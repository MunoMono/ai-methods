import apiRequest from './client'

export const semanticSearch = (payload) => apiRequest('/api/search/semantic', {
  method: 'POST',
  body: payload
})

export const getSimilarDocuments = async (documentId) => {
  const payload = await apiRequest(`/api/search/similar-documents/${documentId}`)

  return {
    sourceDocument: payload?.sourceDocument || null,
    similarDocuments: (payload?.similarDocuments || []).map((document) => ({
      document_id: document.documentId,
      pid: document.pid || null,
      title: document.title || 'Untitled document',
      similarity: document.similarity || 0,
      themes: document.themes || [],
      pdf_count: document.pdfCount || 0,
      year: document.year || null
    })),
    metadata: payload?.metadata || {}
  }
}

export const entitySearch = (params = {}) => apiRequest('/api/search/entity-search', { params })

export const autocompleteSearch = async (params = {}) => {
  const payload = await apiRequest('/api/search/autocomplete', { params })

  return {
    documents: payload?.documents || [],
    themes: payload?.themes || [],
    entities: payload?.entities || []
  }
}