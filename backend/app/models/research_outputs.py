from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.core.database import LocalBase


class MissingnessEvent(LocalBase):
    __tablename__ = "missingness_events"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(255), unique=True, nullable=False, index=True)
    type = Column(String(32), nullable=False, index=True)
    query_or_entity_or_field = Column(Text, nullable=False)
    evidence = Column(Text, nullable=False)
    query_id = Column(String(255), index=True)
    source_document_id = Column(String(255), index=True)
    source_chunk_id = Column(String(255), index=True)
    status = Column(String(32), nullable=False, default="open", index=True)
    reviewer_note = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Claim(LocalBase):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(String(255), unique=True, nullable=False, index=True)
    claim_text = Column(Text, nullable=False)
    support_level = Column(String(32), nullable=False, default="unresolved", index=True)
    caveats = Column(Text)
    reviewer_status = Column(String(64), nullable=False, default="draft", index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    evidence = relationship("ClaimEvidence", back_populates="claim", cascade="all, delete-orphan")


class ClaimEvidence(LocalBase):
    __tablename__ = "claim_evidence"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(String(255), ForeignKey("claims.claim_id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_id = Column(String(255), nullable=False, index=True)
    document_id = Column(String(255), index=True)
    page_range = Column(String(255))
    citation_text = Column(Text)
    provenance_json = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow)

    claim = relationship("Claim", back_populates="evidence")


class QueryRun(LocalBase):
    __tablename__ = "query_runs"

    id = Column(Integer, primary_key=True, index=True)
    query_id = Column(String(255), unique=True, nullable=False, index=True)
    prompt = Column(Text, nullable=False)
    mode = Column(String(64), index=True)
    model = Column(String(255))
    response = Column(Text)
    caveats = Column(Text)
    failed_or_partial = Column(Boolean, nullable=False, default=False, index=True)
    failure_reason = Column(Text)
    retrieved_chunk_count = Column(Integer, nullable=False, default=0)
    export_status = Column(String(64))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    chunks = relationship("QueryRunChunk", back_populates="query_run", cascade="all, delete-orphan")
    exports = relationship("QueryRunExport", back_populates="query_run", cascade="all, delete-orphan")


class QueryRunChunk(LocalBase):
    __tablename__ = "query_run_chunks"

    id = Column(Integer, primary_key=True, index=True)
    query_id = Column(String(255), ForeignKey("query_runs.query_id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_id = Column(String(255), nullable=False, index=True)
    document_id = Column(String(255), index=True)
    page_range = Column(String(255))
    rank = Column(Integer)
    score = Column(Float)
    citation_text = Column(Text)
    provenance_json = Column(JSONB)
    source_metadata_json = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow)

    query_run = relationship("QueryRun", back_populates="chunks")


class QueryRunExport(LocalBase):
    __tablename__ = "query_run_exports"

    id = Column(Integer, primary_key=True, index=True)
    query_id = Column(String(255), ForeignKey("query_runs.query_id", ondelete="CASCADE"), nullable=False, index=True)
    export_type = Column(String(32), nullable=False, index=True)
    export_payload = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    query_run = relationship("QueryRun", back_populates="exports")


class CrossReadPassage(LocalBase):
    __tablename__ = "cross_read_passages"

    id = Column(Integer, primary_key=True, index=True)
    passage_id = Column(String(255), unique=True, nullable=False, index=True)
    passage_text = Column(Text, nullable=False)
    speaker_or_source = Column(String(255))
    passage_label = Column(String(255))
    source_type = Column(String(64), index=True)
    memory_position_note = Column(Text)
    status = Column(String(32), nullable=False, default="draft", index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    mappings = relationship("CrossReadMapping", back_populates="passage", cascade="all, delete-orphan")


class CrossReadMapping(LocalBase):
    __tablename__ = "cross_read_mappings"

    id = Column(Integer, primary_key=True, index=True)
    mapping_id = Column(String(255), unique=True, nullable=False, index=True)
    passage_id = Column(String(255), ForeignKey("cross_read_passages.passage_id", ondelete="CASCADE"), nullable=False, index=True)
    query_id = Column(String(255), ForeignKey("query_runs.query_id", ondelete="SET NULL"), index=True)
    chunk_id = Column(String(255), index=True)
    document_id = Column(String(255), index=True)
    page_range = Column(String(255))
    relation_type = Column(String(64), nullable=False, index=True)
    confidence_or_status = Column(String(64), index=True)
    reviewer_note = Column(Text)
    citation_text = Column(Text)
    provenance_json = Column(JSONB)
    source_metadata_json = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    passage = relationship("CrossReadPassage", back_populates="mappings")