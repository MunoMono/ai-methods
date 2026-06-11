import csv
import io
import uuid
from typing import Any, Literal, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from sqlalchemy import text

from app.api.routes.analysis import build_expanded_query
from app.core.database import LocalSessionLocal
from app.models.research_outputs import CrossReadMapping, CrossReadPassage, QueryRun, QueryRunChunk
from app.services.provenance_service import ProvenanceService

router = APIRouter()
provenance_service = ProvenanceService()

RelationType = Literal["supports", "complicates", "contradicts", "no_documentary_trace"]
PassageStatus = Literal["draft", "reviewing", "mapped", "unresolved"]
SourceType = Literal["oral_history", "interview", "field_note", "researcher_note", "mock_dev"]


class CrossReadPassageCreateRequest(BaseModel):
    passage_text: str
    speaker_or_source: Optional[str] = None
    passage_label: Optional[str] = None
    source_type: Optional[SourceType] = "researcher_note"
    memory_position_note: Optional[str] = None
    status: PassageStatus = "draft"


class CrossReadPassageUpdateRequest(BaseModel):
    passage_text: Optional[str] = None
    speaker_or_source: Optional[str] = None
    passage_label: Optional[str] = None
    memory_position_note: Optional[str] = None
    status: Optional[PassageStatus] = None


class CrossReadRunRequest(BaseModel):
    reviewer_note: Optional[str] = None
    relation_type: Optional[RelationType] = None
    num_context_chunks: int = 3


class CrossReadMappingUpdateRequest(BaseModel):
    relation_type: Optional[RelationType] = None
    reviewer_note: Optional[str] = None
    confidence_or_status: Optional[str] = None


def serialize_mapping(mapping: CrossReadMapping) -> dict[str, Any]:
    return {
        "id": mapping.id,
        "mapping_id": mapping.mapping_id,
        "passage_id": mapping.passage_id,
        "query_id": mapping.query_id,
        "chunk_id": mapping.chunk_id,
        "document_id": mapping.document_id,
        "page_range": mapping.page_range,
        "relation_type": mapping.relation_type,
        "confidence_or_status": mapping.confidence_or_status,
        "reviewer_note": mapping.reviewer_note,
        "citation_text": mapping.citation_text,
        "provenance_json": mapping.provenance_json,
        "source_metadata_json": mapping.source_metadata_json,
        "created_at": mapping.created_at.isoformat() if mapping.created_at else None,
        "updated_at": mapping.updated_at.isoformat() if mapping.updated_at else None,
    }


def serialize_passage(passage: CrossReadPassage, include_mappings: bool = False) -> dict[str, Any]:
    payload = {
        "id": passage.id,
        "passage_id": passage.passage_id,
        "passage_text": passage.passage_text,
        "speaker_or_source": passage.speaker_or_source,
        "passage_label": passage.passage_label,
        "source_type": passage.source_type,
        "memory_position_note": passage.memory_position_note,
        "status": passage.status,
        "created_at": passage.created_at.isoformat() if passage.created_at else None,
        "updated_at": passage.updated_at.isoformat() if passage.updated_at else None,
        "mapping_count": len(passage.mappings or []),
    }
    if include_mappings:
        payload["mappings"] = [serialize_mapping(mapping) for mapping in sorted(passage.mappings or [], key=lambda row: row.created_at or row.id)]
    return payload


def get_passage_or_404(db, passage_id: str) -> CrossReadPassage:
    passage = db.query(CrossReadPassage).filter(CrossReadPassage.passage_id == passage_id).first()
    if not passage:
        raise HTTPException(status_code=404, detail="Cross-read passage not found")
    return passage


def get_mapping_or_404(db, mapping_id: str) -> CrossReadMapping:
    mapping = db.query(CrossReadMapping).filter(CrossReadMapping.mapping_id == mapping_id).first()
    if not mapping:
        raise HTTPException(status_code=404, detail="Cross-read mapping not found")
    return mapping


def build_citation_text(citation: Any) -> Optional[str]:
    if not citation:
        return None
    if isinstance(citation, str):
        return citation

    parts = [
        citation.get("title"),
        f"PID: {citation['pid']}" if citation.get("pid") else None,
        f"Page: {citation['page']}" if citation.get("page") else None,
        citation.get("section"),
        citation.get("public_url") or citation.get("publicUrl"),
    ]
    normalized = [part for part in parts if part]
    return " | ".join(normalized) if normalized else None


def fetch_candidate_chunks(db, query: str, limit: int) -> list[dict[str, Any]]:
    rows = db.execute(
        text(
            """
            SELECT
                dc.chunk_id,
                dc.document_id,
                dc.chunk_text,
                dc.source_page,
                ts_rank(dc.search_tsv, websearch_to_tsquery('english', :query)) AS rank,
                d.pid,
                d.title
            FROM document_chunks dc
            LEFT JOIN documents d ON d.document_id = dc.document_id
            WHERE dc.search_tsv @@ websearch_to_tsquery('english', :query)
            ORDER BY rank DESC
            LIMIT :limit
            """
        ),
        {"query": build_expanded_query(query), "limit": limit},
    ).fetchall()

    return [
        {
            "chunk_id": row.chunk_id,
            "document_id": row.document_id,
            "excerpt": row.chunk_text,
            "page_range": str(row.source_page) if row.source_page is not None else None,
            "score": float(row.rank) if row.rank is not None else None,
            "pid": row.pid,
            "title": row.title,
        }
        for row in rows
    ]


def create_query_run_for_probe(db, passage: CrossReadPassage, candidate_chunks: list[dict[str, Any]]) -> QueryRun:
    query_id = f"crossread-{passage.passage_id}-{uuid.uuid4().hex[:8]}"
    run = QueryRun(
        query_id=query_id,
        prompt=passage.passage_text,
        mode="cross_read_probe",
        model="retrieval-only",
        response="",
        caveats=None if candidate_chunks else "No source chunks returned for the cross-read retrieval probe.",
        failed_or_partial=len(candidate_chunks) == 0,
        failure_reason=None if candidate_chunks else "No supporting source chunks were returned.",
        export_status=None,
        retrieved_chunk_count=len(candidate_chunks),
    )
    db.add(run)
    db.flush()

    for index, chunk in enumerate(candidate_chunks, start=1):
        db.add(
            QueryRunChunk(
                query_id=query_id,
                chunk_id=chunk["chunk_id"],
                document_id=chunk.get("document_id"),
                page_range=chunk.get("page_range"),
                rank=index,
                score=chunk.get("score"),
                citation_text=None,
                provenance_json=None,
                source_metadata_json={
                    "chunkId": chunk["chunk_id"],
                    "documentId": chunk.get("document_id"),
                    "pid": chunk.get("pid"),
                    "title": chunk.get("title"),
                    "page": chunk.get("page_range"),
                    "score": chunk.get("score"),
                    "citationStatus": "unavailable",
                    "provenanceStatus": "unavailable",
                },
            )
        )

    return run


def build_mapping_payload(chunk: Optional[dict[str, Any]], relation_type: RelationType, reviewer_note: Optional[str], query_id: str) -> dict[str, Any]:
    if not chunk:
        return {
            "mapping_id": f"map-{uuid.uuid4().hex[:12]}",
            "query_id": query_id,
            "chunk_id": None,
            "document_id": None,
            "page_range": None,
            "relation_type": "no_documentary_trace",
            "confidence_or_status": "unresolved",
            "reviewer_note": reviewer_note or "No documentary trace returned for this passage retrieval probe.",
            "citation_text": None,
            "provenance_json": None,
            "source_metadata_json": {
                "citationStatus": "unavailable",
                "provenanceStatus": "unavailable",
            },
        }

    citation_text = None
    provenance_json = None
    source_metadata = {
        "chunkId": chunk["chunk_id"],
        "documentId": chunk.get("document_id"),
        "pid": chunk.get("pid"),
        "title": chunk.get("title"),
        "page": chunk.get("page_range"),
        "score": chunk.get("score"),
        "excerpt": chunk.get("excerpt"),
    }

    try:
        citation = provenance_service.build_chunk_citation(chunk["chunk_id"])
        if citation:
            citation_text = build_citation_text(citation)
            source_metadata["citationStatus"] = "loaded"
        else:
            source_metadata["citationStatus"] = "unavailable"
    except Exception:
        source_metadata["citationStatus"] = "unavailable"

    try:
        provenance = provenance_service.get_chunk_provenance(chunk["chunk_id"])
        if provenance and provenance.get("error") != "Chunk not found":
            provenance_json = provenance
            source_metadata["provenanceStatus"] = "loaded"
            source_metadata["title"] = source_metadata.get("title") or provenance.get("document", {}).get("title")
            source_metadata["pid"] = source_metadata.get("pid") or provenance.get("document", {}).get("pid")
        else:
            source_metadata["provenanceStatus"] = "unavailable"
    except Exception:
        source_metadata["provenanceStatus"] = "unavailable"

    return {
        "mapping_id": f"map-{uuid.uuid4().hex[:12]}",
        "query_id": query_id,
        "chunk_id": chunk["chunk_id"],
        "document_id": chunk.get("document_id"),
        "page_range": chunk.get("page_range"),
        "relation_type": relation_type,
        "confidence_or_status": "reviewing",
        "reviewer_note": reviewer_note,
        "citation_text": citation_text,
        "provenance_json": provenance_json,
        "source_metadata_json": source_metadata,
    }


def get_export_rows(db) -> list[dict[str, Any]]:
    rows = []
    passages = db.query(CrossReadPassage).order_by(CrossReadPassage.created_at.asc()).all()
    for passage in passages:
        for mapping in passage.mappings or []:
            rows.append(
                {
                    "passage_id": passage.passage_id,
                    "passage_label": passage.passage_label,
                    "speaker_or_source": passage.speaker_or_source,
                    "passage_text_excerpt": (passage.passage_text or "")[:180],
                    "relation_type": mapping.relation_type,
                    "chunk_id": mapping.chunk_id,
                    "document_id": mapping.document_id,
                    "page_range": mapping.page_range,
                    "citation_text": mapping.citation_text,
                    "reviewer_note": mapping.reviewer_note,
                    "query_id": mapping.query_id,
                    "created_at": mapping.created_at.isoformat() if mapping.created_at else None,
                }
            )
    return rows


@router.get("/passages")
@router.get("/passages/")
async def list_passages():
    db = LocalSessionLocal()
    try:
        passages = db.query(CrossReadPassage).order_by(CrossReadPassage.created_at.asc()).all()
        return {
            "count": len(passages),
            "passages": [serialize_passage(passage) for passage in passages],
        }
    finally:
        db.close()


@router.post("/passages", status_code=201)
@router.post("/passages/", status_code=201)
async def create_passage(request: CrossReadPassageCreateRequest):
    db = LocalSessionLocal()
    try:
        passage = CrossReadPassage(
            passage_id=f"pass-{uuid.uuid4().hex[:12]}",
            passage_text=request.passage_text,
            speaker_or_source=request.speaker_or_source,
            passage_label=request.passage_label,
            source_type=request.source_type,
            memory_position_note=request.memory_position_note,
            status=request.status,
        )
        db.add(passage)
        db.commit()
        db.refresh(passage)
        return serialize_passage(passage, include_mappings=True)
    finally:
        db.close()


@router.get("/passages/{passage_id}")
async def get_passage_detail(passage_id: str):
    db = LocalSessionLocal()
    try:
        passage = get_passage_or_404(db, passage_id)
        return serialize_passage(passage, include_mappings=True)
    finally:
        db.close()


@router.patch("/passages/{passage_id}")
async def update_passage(passage_id: str, request: CrossReadPassageUpdateRequest):
    db = LocalSessionLocal()
    try:
        passage = get_passage_or_404(db, passage_id)
        if request.passage_text is not None:
            passage.passage_text = request.passage_text
        if request.speaker_or_source is not None:
            passage.speaker_or_source = request.speaker_or_source
        if request.passage_label is not None:
            passage.passage_label = request.passage_label
        if request.memory_position_note is not None:
            passage.memory_position_note = request.memory_position_note
        if request.status is not None:
            passage.status = request.status

        db.commit()
        db.refresh(passage)
        return serialize_passage(passage, include_mappings=True)
    finally:
        db.close()


@router.post("/passages/{passage_id}/run", status_code=201)
async def run_passage_probe(passage_id: str, request: CrossReadRunRequest):
    db = LocalSessionLocal()
    try:
        passage = get_passage_or_404(db, passage_id)
        relation_type = request.relation_type or "complicates"
        candidate_chunks = fetch_candidate_chunks(db, passage.passage_text, request.num_context_chunks)
        query_run = create_query_run_for_probe(db, passage, candidate_chunks)

        for mapping in list(passage.mappings or []):
            if mapping.query_id == query_run.query_id:
                db.delete(mapping)

        if candidate_chunks:
            mapping_rows = [
                CrossReadMapping(passage_id=passage.passage_id, **build_mapping_payload(chunk, relation_type, request.reviewer_note, query_run.query_id))
                for chunk in candidate_chunks
            ]
            passage.status = "mapped"
        else:
            mapping_rows = [
                CrossReadMapping(passage_id=passage.passage_id, **build_mapping_payload(None, "no_documentary_trace", request.reviewer_note, query_run.query_id))
            ]
            passage.status = "unresolved"

        for mapping in mapping_rows:
            db.add(mapping)

        db.commit()
        db.refresh(passage)
        db.refresh(query_run)

        return {
            "passage": serialize_passage(passage, include_mappings=True),
            "query_run": {
                "query_id": query_run.query_id,
                "prompt": query_run.prompt,
                "mode": query_run.mode,
                "model": query_run.model,
                "failed_or_partial": bool(query_run.failed_or_partial),
                "failure_reason": query_run.failure_reason,
                "retrieved_chunk_count": query_run.retrieved_chunk_count,
                "created_at": query_run.created_at.isoformat() if query_run.created_at else None,
            },
        }
    finally:
        db.close()


@router.patch("/mappings/{mapping_id}")
async def update_mapping(mapping_id: str, request: CrossReadMappingUpdateRequest):
    db = LocalSessionLocal()
    try:
        mapping = get_mapping_or_404(db, mapping_id)
        if request.relation_type is not None:
            mapping.relation_type = request.relation_type
        if request.reviewer_note is not None:
            mapping.reviewer_note = request.reviewer_note
        if request.confidence_or_status is not None:
            mapping.confidence_or_status = request.confidence_or_status

        db.commit()
        db.refresh(mapping)
        return serialize_mapping(mapping)
    finally:
        db.close()


@router.get("/map")
async def get_cross_read_map():
    db = LocalSessionLocal()
    try:
        passages = db.query(CrossReadPassage).order_by(CrossReadPassage.created_at.asc()).all()
        return {
            "count": len(passages),
            "passages": [serialize_passage(passage, include_mappings=True) for passage in passages],
        }
    finally:
        db.close()


@router.get("/export.csv")
async def export_cross_read_csv():
    db = LocalSessionLocal()
    try:
        rows = get_export_rows(db)
        buffer = io.StringIO()
        writer = csv.DictWriter(
            buffer,
            fieldnames=[
                "passage_id",
                "passage_label",
                "speaker_or_source",
                "passage_text_excerpt",
                "relation_type",
                "chunk_id",
                "document_id",
                "page_range",
                "citation_text",
                "reviewer_note",
                "query_id",
                "created_at",
            ],
        )
        writer.writeheader()
        for row in rows:
            writer.writerow(row)

        return PlainTextResponse(
            buffer.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="testimony-record-map.csv"'},
        )
    finally:
        db.close()


@router.get("/export.md")
async def export_cross_read_markdown():
    db = LocalSessionLocal()
    try:
        passages = db.query(CrossReadPassage).order_by(CrossReadPassage.created_at.asc()).all()
        blocks = []
        for passage in passages:
            mappings = passage.mappings or []
            mapping_lines = []
            for index, mapping in enumerate(mappings, start=1):
                source_metadata = mapping.source_metadata_json or {}
                mapping_lines.extend([
                    f"### Candidate archival record {index}",
                    f"- Query/run ID: {mapping.query_id or 'Unavailable'}",
                    f"- Relation annotation: {mapping.relation_type}",
                    f"- Chunk ID: {mapping.chunk_id or 'Unavailable'}",
                    f"- Document ID: {mapping.document_id or source_metadata.get('documentId') or 'Unavailable'}",
                    f"- Page range: {mapping.page_range or 'Unavailable'}",
                    f"- Citation: {mapping.citation_text or 'Unavailable'}",
                    f"- Provenance: {'Available' if mapping.provenance_json else 'Unavailable'}",
                    f"- Reviewer note: {mapping.reviewer_note or 'None'}",
                    "",
                ])

            if not mapping_lines:
                mapping_lines = ["No candidate archival records are currently mapped.", ""]

            blocks.append(
                "\n".join([
                    f"## {passage.passage_id}",
                    f"- Passage label: {passage.passage_label or 'Unlabelled passage'}",
                    f"- Speaker/source: {passage.speaker_or_source or 'Unavailable'}",
                    f"- Status: {passage.status}",
                    "",
                    "### Passage text",
                    "",
                    passage.passage_text,
                    "",
                    f"### Memory-position note\n\n{passage.memory_position_note or 'None recorded.'}",
                    "",
                    *mapping_lines,
                ])
            )

        content = "# Testimony-record map\n\n" + "\n\n".join(blocks) + "\n"
        return PlainTextResponse(
            content,
            media_type="text/markdown",
            headers={"Content-Disposition": 'attachment; filename="testimony-record-map.md"'},
        )
    finally:
        db.close()