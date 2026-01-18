"""
S3 sync endpoints - trigger document sync from DigitalOcean Spaces
"""
import logging
from fastapi import APIRouter, HTTPException
from typing import Optional

from app.services.s3_sync import S3SyncService

logger = logging.getLogger(__name__)
router = APIRouter()

sync_service = S3SyncService()


@router.post("/trigger")
async def trigger_sync(max_docs: Optional[int] = None):
    """
    Trigger S3 sync to pull PDFs from DigitalOcean Spaces
    
    Args:
        max_docs: Maximum number of documents to process (None = all)
    
    Returns:
        Sync operation summary
    """
    try:
        logger.info(f"Triggering S3 sync (max_docs={max_docs})...")
        
        result = await sync_service.sync_from_s3(max_docs=max_docs)
        
        if 'error' in result:
            raise HTTPException(status_code=500, detail=result['error'])
        
        return {
            'status': 'success',
            'message': f"Processed {result['processed']} documents",
            'details': result
        }
        
    except Exception as e:
        logger.error(f"Error during S3 sync: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def sync_status():
    """Get S3 sync service status"""
    pdfs = sync_service.list_pdfs_in_bucket()
    
    return {
        'configured': sync_service.s3_client is not None,
        'bucket': sync_service.s3_client and sync_service.s3_client._endpoint.host,
        'pdfs_in_bucket': len(pdfs),
        'pdfs_with_year': len([p for p in pdfs if p['publication_year']]),
        'year_range': {
            'min': min([p['publication_year'] for p in pdfs if p['publication_year']], default=None),
            'max': max([p['publication_year'] for p in pdfs if p['publication_year']], default=None)
        }
    }


@router.get("/list-pdfs")
async def list_pdfs():
    """List all PDFs in S3 bucket with metadata"""
    pdfs = sync_service.list_pdfs_in_bucket()
    
    return {
        'count': len(pdfs),
        'pdfs': [
            {
                'filename': p['filename'],
                'key': p['key'],
                'size_mb': round(p['size'] / 1024 / 1024, 2),
                'publication_year': p['publication_year'],
                'last_modified': p['last_modified'].isoformat()
            }
            for p in pdfs
        ]
    }
