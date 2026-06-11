const formatCitation = (source) => {
  if (!source.citation) {
    return 'Not available from current endpoint.'
  }

  if (typeof source.citation === 'string') {
    return source.citation
  }

  const parts = [
    source.citation.title,
    source.citation.pid ? `PID: ${source.citation.pid}` : null,
    source.citation.page ? `Page: ${source.citation.page}` : null,
    source.citation.section ? `Section: ${source.citation.section}` : null,
    source.citation.publicUrl || null
  ].filter(Boolean)

  return parts.join(' | ')
}

export const buildEvidenceTraceMemo = ({ trace, validationStatuses, generatedAt = new Date() }) => {
  const sourceLines = trace.sources.length > 0
    ? trace.sources.map((source, index) => {
        const status = validationStatuses[source.chunkId || `source-${index}`] || 'Needs review'
        return [
          `### Source ${index + 1}`,
          `- Document: ${source.title || 'Not available from current endpoint.'}`,
          `- PID: ${source.pid || 'Not available from current endpoint.'}`,
          `- Chunk ID: ${source.chunkId || 'Not available from current endpoint.'}`,
          `- Page/Section: ${source.page || 'N/A'}${source.section ? ` / ${source.section}` : ''}`,
          `- Retrieval score: ${source.score ?? 'Not available'}`,
          `- Validation status: ${status}`,
          `- Citation: ${formatCitation(source)}`,
          `- Excerpt: ${source.excerpt || 'No excerpt returned.'}`
        ].join('\n')
      }).join('\n\n')
    : 'No source chunks were returned by the current endpoint.'

  return [
    `# Evidence Trace Memo`,
    '',
    `- Date: ${generatedAt.toISOString()}`,
    `- Query: ${trace.query || 'Not available'}`,
    `- Model: ${trace.model || 'Not available'}`,
    `- Model version: ${trace.modelVersion || 'Not available'}`,
    `- Inference ID: ${trace.inferenceId || 'Not available'}`,
    '',
    `## Answer`,
    '',
    trace.answer || 'No answer returned.',
    '',
    `## Sources`,
    '',
    sourceLines,
    '',
    `## Methodological note`,
    '',
    'This memo was generated from an evidence-tracing session and should be reviewed against the original DDR archival sources.'
  ].join('\n')
}

export const downloadMarkdown = (filename, content) => {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const buildVisualAnalyticsMemo = ({
  filters,
  projection,
  selectedPoint,
  selectedCluster,
  generatedAt = new Date()
}) => {
  const visiblePids = [...new Set((projection?.points || []).map((point) => point.pid).filter(Boolean))]

  const pointSection = selectedPoint
    ? [
        `## Selected point`,
        '',
        `- Title: ${selectedPoint.title || 'Unavailable'}`,
        `- PID: ${selectedPoint.pid || 'Unavailable'}`,
        `- Document ID: ${selectedPoint.documentId || 'Unavailable'}`,
        `- Chunk ID: ${selectedPoint.chunkId || 'Unavailable'}`,
        `- Cluster: ${selectedPoint.clusterLabel || 'Unavailable'}`,
        `- Year: ${selectedPoint.year || 'Unavailable'}`,
        `- Source type: ${selectedPoint.sourceType || 'unknown'}`,
        `- Excerpt: ${selectedPoint.excerpt || 'Unavailable'}`
      ].join('\n')
    : '## Selected point\n\nNo point selected.'

  const clusterSection = selectedCluster
    ? [
        `## Selected cluster`,
        '',
        `- Label: ${selectedCluster.label}`,
        `- Size: ${selectedCluster.size}`,
        `- Top terms: ${selectedCluster.topTerms?.join(', ') || 'Unavailable'}`,
        `- Year range: ${selectedCluster.yearRange?.join(' - ') || 'Unavailable'}`,
        `- Representative PIDs: ${selectedCluster.representativePids?.join(', ') || 'Unavailable'}`
      ].join('\n')
    : '## Selected cluster\n\nNo cluster selected.'

  return [
    '# Visual Analytics Memo',
    '',
    `- Date: ${generatedAt.toISOString()}`,
    `- Point type: ${filters.pointType}`,
    `- Colour by: ${filters.colorBy}`,
    `- Year range: ${filters.yearMin || 'Any'} to ${filters.yearMax || 'Any'}`,
    `- Theme filter: ${filters.theme || 'Any'}`,
    `- Source type filter: ${filters.sourceType || 'Any'}`,
    `- Visible point count: ${(projection?.points || []).length}`,
    `- Source PIDs: ${visiblePids.length > 0 ? visiblePids.join(', ') : 'None returned'}`,
    '',
    pointSection,
    '',
    clusterSection,
    '',
    '## Methodological note',
    '',
    'This memo records a visual-analytic reading of DDR archival traces. Spatial proximity should be interpreted as a prompt for archival investigation, not as proof of historical relation.'
  ].join('\n')
}

export const buildClusterMemo = ({ cluster, visiblePoints = [], generatedAt = new Date() }) => {
  return [
    '# Cluster Memo',
    '',
    `- Date: ${generatedAt.toISOString()}`,
    `- Cluster label: ${cluster?.label || 'Unavailable'}`,
    `- Size: ${cluster?.size ?? 'Unavailable'}`,
    `- Top terms: ${cluster?.topTerms?.join(', ') || 'Unavailable'}`,
    `- Year range: ${cluster?.yearRange?.join(' - ') || 'Unavailable'}`,
    `- Representative PIDs: ${cluster?.representativePids?.join(', ') || 'Unavailable'}`,
    '',
    '## Visible points',
    '',
    visiblePoints.length > 0
      ? visiblePoints.map((point) => `- ${point.title || point.id} | PID: ${point.pid || 'Unavailable'}`).join('\n')
      : 'No visible points are associated with the current cluster selection.',
    '',
    '## Methodological note',
    '',
    'This memo records a cluster-oriented visual reading of DDR archival traces and should be reviewed alongside the original archival materials.'
  ].join('\n')
}