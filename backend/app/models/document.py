"""
Document models for temporal epistemic drift analysis
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Float
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from app.core.database import LocalBase


class Document(LocalBase):
    """Documents for epistemic drift analysis (1965-1985)"""
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(String(255), unique=True, nullable=False, index=True)
    title = Column(String(500))
    publication_year = Column(Integer, nullable=False, index=True)  # 1965-1985
    publication_date = Column(DateTime)  # Full date if available
    
    # File info
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50))  # 'pdf', 'tiff', etc.
    s3_key = Column(String(500))  # S3 storage path
    file_size_bytes = Column(Integer)
    
    # Extracted content
    extracted_text = Column(Text)  # Full text from Docling
    has_diagrams = Column(Integer, default=0)  # Count of diagrams
    diagram_s3_keys = Column(JSONB)  # Array of S3 keys for extracted diagrams
    
    # Processing metadata
    processed_at = Column(DateTime, default=datetime.utcnow)
    processing_status = Column(String(50), default='pending')  # pending, processing, completed, failed
    processing_error = Column(Text)
    
    # Metadata
    metadata = Column(JSONB)  # Author, journal, keywords, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DocumentChunk(LocalBase):
    """Text chunks from documents for embedding and analysis"""
    __tablename__ = "document_chunks"
    
    id = Column(Integer, primary_key=True, index=True)
    chunk_id = Column(String(255), unique=True, nullable=False, index=True)
    document_id = Column(String(255), nullable=False, index=True)  # FK to documents
    
    # Chunk content
    chunk_text = Column(Text, nullable=False)
    chunk_index = Column(Integer)  # Position in document
    chunk_type = Column(String(50))  # 'paragraph', 'heading', 'caption', etc.
    
    # Temporal context
    publication_year = Column(Integer, nullable=False, index=True)
    
    # Embeddings
    embedding_vector = Column(Text)  # Vector as text (will use pgvector)
    embedding_model = Column(String(100))  # e.g., 'all-MiniLM-L6-v2'
    
    # Analysis results
    key_concepts = Column(JSONB)  # Extracted concepts
    drift_score = Column(Float)  # Epistemic drift score
    
    # Metadata
    metadata = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow)


class DriftAnalysis(LocalBase):
    """Temporal epistemic drift analysis results"""
    __tablename__ = "drift_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(String(255), unique=True, nullable=False, index=True)
    
    # Time period comparison
    period_start_year = Column(Integer, nullable=False)
    period_end_year = Column(Integer, nullable=False)
    
    # Documents analyzed
    document_count = Column(Integer)
    document_ids = Column(JSONB)  # Array of document IDs
    
    # Drift metrics
    drift_score = Column(Float)  # Overall drift score
    conceptual_shift = Column(JSONB)  # Concepts that changed
    terminology_changes = Column(JSONB)  # Term frequency changes
    semantic_distance = Column(Float)  # Average semantic distance
    
    # Analysis method
    analysis_method = Column(String(100))  # 'embedding_comparison', 'granite_analysis', etc.
    model_used = Column(String(100))
    
    # Results
    results = Column(JSONB)  # Full analysis results
    visualization_data = Column(JSONB)  # Data for charts
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    metadata = Column(JSONB)
