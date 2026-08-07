"""
Document upload and processing endpoints
Handles PDF uploads with temporal metadata for testamentary traces analysis
"""
import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import uuid
from datetime import datetime

from app.services.docling_processor import DoclingProcessor
from app.services.embedding_service import EmbeddingService
from app.core.database import LocalSessionLocal
from app.models.document import Document, DocumentChunk
from app.services.metadata_roles import extract_metadata_roles

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize services
docling_processor = DoclingProcessor()
embedding_service = EmbeddingService()


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    pid: str = Form(...),  # REQUIRED: Postgres authority PID
    title: Optional[str] = Form(None),
    publication_year: int = Form(...),
    publication_date: Optional[str] = Form(None),
    authority_id: Optional[str] = Form(None),  # DDR Archive authority ID
    metadata: Optional[str] = Form("{}")
):
    """
    Upload PDF/TIFF document for testamentary traces analysis
    
    CRITICAL: Only PID-linked assets are eligible for training corpus
    
    Args:
        file: PDF or TIFF file upload
        pid: Postgres authority PID (REQUIRED - links to source of truth)
        title: Document title
        publication_year: Year published (1965-1985)
        publication_date: Full publication date (optional)
        authority_id: DDR Archive authority ID (optional)
        metadata: JSON string with author, journal, etc.
    """
    try:
        # Validate PID is provided
        if not pid or not pid.strip():
            raise HTTPException(
                status_code=400,
                detail="PID is required - only authority-linked assets can be ingested"
            )
        
        # Validate publication year
        if not (1965 <= publication_year <= 1985):
            raise HTTPException(
                status_code=400,
                detail="Publication year must be between 1965 and 1985"
            )
        
        # Validate file type (PDF or TIFF only)
        allowed_extensions = ['.pdf', '.tiff', '.tif']
        if not any(file.filename.lower().endswith(ext) for ext in allowed_extensions):
            raise HTTPException(
                status_code=400,
                detail="Only PDF and TIFF files are supported for training corpus"
            )
        
        # Generate document ID
        document_id = f"doc_{uuid.uuid4().hex[:12]}"
        
        # Save file temporarily
        import tempfile
        import os
        
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
        content = await file.read()
        temp_file.write(content)
        temp_file.close()
        
        # Create database record
        db = LocalSessionLocal()
        try:
            # Determine file type
            if file.filename.lower().endswith('.pdf'):
                file_type = 'application/pdf'
            elif file.filename.lower().endswith(('.tiff', '.tif')):
                file_type = 'image/tiff'
            else:
                file_type = 'application/octet-stream'
            
            doc = Document(
                document_id=document_id,
                pid=pid.strip(),  # CRITICAL: Authority linkage
                authority_id=authority_id,
                title=title or file.filename,
                publication_year=publication_year,
                filename=file.filename,
                file_type=file_type,
                file_size_bytes=len(content),
                processing_status='pending'
            )
            
            db.add(doc)
            db.commit()
            db.refresh(doc)
            
            # Process with Docling (async in background)
            logger.info(f"Processing document {document_id} with Docling...")
            
            # For now, return immediately - implement background processing later
            return {
                "document_id": document_id,
                "filename": file.filename,
                "publication_year": publication_year,
                "status": "pending",
                "message": "Document uploaded successfully. Processing started."
            }
            
        finally:
            db.close()
            # Clean up temp file
            os.unlink(temp_file.name)
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{document_id}")
async def get_document(document_id: str):
    """Get document details"""
    db = LocalSessionLocal()
    try:
        doc = db.query(Document).filter(
            Document.document_id == document_id
        ).first()
        
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {
            "document_id": doc.document_id,
            "pid": doc.pid,
            "authority_id": doc.authority_id,
            "archive_record_id": doc.archive_record_id,
            "archive_record_pid": doc.archive_record_pid,
            "asset_id": doc.asset_id,
            "asset_pid": doc.asset_pid,
            "asset_id_or_asset_pid": doc.asset_id_or_asset_pid,
            "title": doc.title,
            "publication_year": doc.publication_year,
            "filename": doc.filename,
            "source_uri": doc.source_uri,
            "page_count": doc.page_count,
            "ingestion_version": doc.ingestion_version,
            "corpus_version": doc.corpus_version,
            "processing_status": doc.processing_status,
            "ml_policy_status": doc.ml_policy_status,
            "ml_exclusion_reason": doc.ml_exclusion_reason,
            "has_diagrams": doc.has_diagrams,
            "created_at": doc.created_at.isoformat()
        }
    finally:
        db.close()


@router.get("")
@router.get("/")
async def list_documents(
    year: Optional[int] = None,
    status: Optional[str] = None
):
    """List all documents with optional filters"""
    db = LocalSessionLocal()
    try:
        query = db.query(Document)
        
        if year:
            query = query.filter(Document.publication_year == year)
        if status:
            query = query.filter(Document.processing_status == status)
        
        docs = query.order_by(Document.publication_year).all()
        
        return {
            "count": len(docs),
            "documents": [
                {
                    "document_id": doc.document_id,
                    "pid": doc.pid,
                    "asset_id_or_asset_pid": doc.asset_id_or_asset_pid,
                    "title": doc.title,
                    "publication_year": doc.publication_year,
                    "page_count": doc.page_count,
                    "ml_policy_status": doc.ml_policy_status,
                    "status": doc.processing_status
                }
                for doc in docs
            ]
        }
    finally:
        db.close()


@router.get("/{document_id}/ml-annotations")
async def get_ml_annotations(document_id: str):
    """
    Get ML page annotations for a document
    
    Returns the ml_pages specification and ml_annotation from authority_data
    
    Args:
        document_id: Document identifier
    
    Returns:
        ML annotation metadata including page specifications
    """
    db = LocalSessionLocal()
    try:
        doc = db.query(Document).filter(
            Document.document_id == document_id
        ).first()
        
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        
        authority_data = doc.authority_data or {}
        roles = extract_metadata_roles(authority_data)
        page_count = getattr(doc, 'page_count', None)
        ml_processed_at = getattr(doc, 'ml_processed_at', None)
        source_filename = authority_data.get('source_filename') or doc.filename
        public_url = roles['retrieval_provenance'].get('record_public_uri') or authority_data.get('record_public_uri') or authority_data.get('public_uri')
        
        return {
            "document_id": doc.document_id,
            "pid": doc.pid,
            "title": doc.title,
            "archive_record_pid": doc.archive_record_pid or roles['retrieval_provenance'].get('archive_record_pid'),
            "archive_record_id": doc.archive_record_id or roles['retrieval_provenance'].get('archive_record_id'),
            "asset_id": doc.asset_id or roles['retrieval_provenance'].get('asset_id'),
            "asset_pid": doc.asset_pid or roles['retrieval_provenance'].get('asset_pid'),
            "asset_id_or_asset_pid": doc.asset_id_or_asset_pid or roles['retrieval_provenance'].get('asset_id_or_asset_pid'),
            "source_filename": source_filename,
            "source_uri": doc.source_uri,
            "used_for_ml": authority_data.get('use_for_ml', doc.use_for_ml),
            "ml_pages": authority_data.get('ml_pages', ''),
            "ml_page_scope": authority_data.get('ml_page_scope', doc.ml_page_scope),
            "ml_annotation": authority_data.get('ml_annotation', ''),
            "ml_policy_status": doc.ml_policy_status,
            "ml_exclusion_reason": doc.ml_exclusion_reason,
            "processing_status": doc.processing_status,
            "ingestion_version": doc.ingestion_version,
            "corpus_version": doc.corpus_version,
            "metadata_roles_version": authority_data.get('metadata_roles_version'),
            "record_public_uri": public_url,
            "corpus_control": roles['corpus_control'],
            "retrieval_provenance": roles['retrieval_provenance'],
            "catalogue_metadata": roles['catalogue_metadata'],
            "page_count": page_count,
            "ml_processed_at": ml_processed_at.isoformat() if ml_processed_at else None
        }
    finally:
        db.close()
