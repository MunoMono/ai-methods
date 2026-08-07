import apiRequest from './client'
import { normalizeDocument } from '../utils/normalizers'

export const listDocuments = async (params = {}) => {
  const payload = await apiRequest('/api/documents', { params })

  return {
    count: payload?.count || 0,
    documents: (payload?.documents || []).map(normalizeDocument)
  }
}

export const getDocument = async (documentId) => {
  const payload = await apiRequest(`/api/documents/${documentId}`)
  return normalizeDocument(payload)
}

export const getDocumentAnnotations = async (documentId) => {
  const payload = await apiRequest(`/api/documents/${documentId}/ml-annotations`)

  return {
    document_id: payload.document_id,
    pid: payload.pid || null,
    title: payload.title || 'Untitled document',
    used_for_ml: Boolean(payload.used_for_ml),
    ml_pages: payload.ml_pages || '',
    ml_page_scope: payload.ml_page_scope || '',
    ml_annotation: payload.ml_annotation || '',
    archive_record_pid: payload.archive_record_pid || null,
    archive_record_id: payload.archive_record_id || null,
    asset_id: payload.asset_id || null,
    asset_pid: payload.asset_pid || null,
    asset_id_or_asset_pid: payload.asset_id_or_asset_pid || null,
    source_filename: payload.source_filename || null,
    source_uri: payload.source_uri || null,
    ml_policy_status: payload.ml_policy_status || null,
    ml_exclusion_reason: payload.ml_exclusion_reason || null,
    processing_status: payload.processing_status || null,
    ingestion_version: payload.ingestion_version || null,
    corpus_version: payload.corpus_version || null,
    metadata_roles_version: payload.metadata_roles_version || null,
    record_public_uri: payload.record_public_uri || null,
    corpus_control: payload.corpus_control || {},
    retrieval_provenance: payload.retrieval_provenance || {},
    catalogue_metadata: payload.catalogue_metadata || {},
    page_count: payload.page_count || 0,
    ml_processed_at: payload.ml_processed_at || null
  }
}

export const uploadDocument = (payload) => apiRequest('/api/documents/upload', {
  method: 'POST',
  body: payload
})