import apiRequest from './client'

export const listExperiments = (params = {}) => apiRequest('/api/experiments/list', { params })

export const getExperiment = (experimentId) => apiRequest(`/api/experiments/${experimentId}`)

export const getExperimentMetrics = (experimentId) => apiRequest(`/api/experiments/${experimentId}/metrics`)