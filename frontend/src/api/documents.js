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
    ml_annotation: payload.ml_annotation || '',
    page_count: payload.page_count || 0,
    ml_processed_at: payload.ml_processed_at || null
  }
}

export const uploadDocument = (payload) => apiRequest('/api/documents/upload', {
  method: 'POST',
  body: payload
})