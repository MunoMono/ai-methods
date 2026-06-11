import { Button, SkeletonText, Tag, Tile } from '@carbon/react'

const copyCitation = async (detail) => {
  const document = detail?.document || {}
  const annotations = detail?.annotations || {}
  const citation = [
    document.title || 'Untitled document',
    annotations.pid ? `PID: ${annotations.pid}` : null,
    document.publication_year ? `Year: ${document.publication_year}` : null,
    document.id ? `Document ID: ${document.id}` : null
  ].filter(Boolean).join(' | ')

  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(citation)
  }
}

const DocumentDetailPanel = ({ detail, loading, onTraceEvidence, onViewAnalytics, onInspectMissingness }) => {
  if (loading) {
    return (
      <Tile>
        <SkeletonText paragraph lineCount={8} />
      </Tile>
    )
  }

  if (!detail) {
    return (
      <Tile>
        <h3>Source detail</h3>
        <p>Select a source to inspect metadata, ingestion status, ML annotations, and handoff paths into source interrogation, absences, and the semantic atlas.</p>
      </Tile>
    )
  }

  const { document, annotations, similarDocuments, error } = detail

  return (
    <Tile>
      <h3 style={{ marginTop: 0 }}>{document.title}</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        <Tag type="blue">{annotations?.pid || 'PID not yet exposed by endpoint'}</Tag>
        <Tag type="gray">{document.publication_year || 'Year not yet exposed by endpoint'}</Tag>
        <Tag type={document.processing_status === 'completed' ? 'green' : 'blue'}>{document.processing_status || 'unknown'}</Tag>
      </div>

      {error && <p>{error}</p>}

      <div style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <h4>Metadata</h4>
          <p style={{ margin: 0 }}>Document ID: {document.id || 'Not yet exposed by endpoint'}</p>
          <p style={{ margin: 0 }}>Filename: {document.filename || 'Not yet exposed by endpoint'}</p>
          <p style={{ margin: 0 }}>Page count: {annotations?.page_count || document.page_count || 'Not yet exposed by endpoint'}</p>
        </div>

        <div>
          <h4>Handoff surface</h4>
          <p style={{ margin: 0 }}>Processing status: {document.processing_status || 'unknown'}</p>
          <p style={{ margin: 0 }}>PID linkage: {annotations?.pid ? 'Present' : 'Not yet exposed by endpoint'}</p>
          <p style={{ margin: 0 }}>Analytical output: source handoff into source interrogation, absences, or the semantic atlas.</p>
        </div>

        <div>
          <h4>ML annotation</h4>
          <p style={{ margin: 0 }}>Used for ML: {annotations?.used_for_ml ? 'Yes' : 'No / unspecified'}</p>
          <p style={{ margin: 0 }}>ML pages: {annotations?.ml_pages || 'Not yet exposed by endpoint'}</p>
          <p style={{ marginBottom: 0 }}>{annotations?.ml_annotation || 'No annotation text returned by the endpoint.'}</p>
        </div>

        <div>
          <h4>Similar documents</h4>
          {similarDocuments?.length > 0 ? (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {similarDocuments.slice(0, 5).map((similar) => (
                <div key={similar.document_id}>
                  <strong>{similar.title}</strong>
                  <div>PID: {similar.pid || 'Not yet exposed by endpoint'} | Similarity: {(similar.similarity * 100).toFixed(1)}%</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0 }}>No similar documents returned for this document.</p>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Button kind="primary" onClick={onTraceEvidence}>Interrogate this source</Button>
          <Button kind="secondary" onClick={onInspectMissingness}>Inspect absences</Button>
          <Button kind="ghost" onClick={onViewAnalytics}>Locate in atlas</Button>
          <Button kind="ghost" onClick={() => copyCitation(detail)}>Copy citation</Button>
          <Button kind="ghost" disabled>Open DDR source</Button>
        </div>
      </div>
    </Tile>
  )
}

export default DocumentDetailPanel