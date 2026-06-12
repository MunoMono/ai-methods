import { Button, SkeletonText, Tag, Tile } from '@carbon/react'
import './CorpusPanels.scss'

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
      <h3 className="corpus-panel__section-title">{document.title}</h3>
      <div className="app-tag-row corpus-panel__tag-row">
        <Tag type="blue">{annotations?.pid || 'PID not yet exposed by endpoint'}</Tag>
        <Tag type="gray">{document.publication_year || 'Year not yet exposed by endpoint'}</Tag>
        <Tag type={document.processing_status === 'completed' ? 'green' : 'blue'}>{document.processing_status || 'unknown'}</Tag>
      </div>

      {error && <p>{error}</p>}

      <div className="corpus-panel__stack">
        <div>
          <h4 className="corpus-panel__section-title">Metadata</h4>
          <p className="corpus-panel__copy">Document ID: {document.id || 'Not yet exposed by endpoint'}</p>
          <p className="corpus-panel__copy">Filename: {document.filename || 'Not yet exposed by endpoint'}</p>
          <p className="corpus-panel__copy">Page count: {annotations?.page_count || document.page_count || 'Not yet exposed by endpoint'}</p>
        </div>

        <div>
          <h4 className="corpus-panel__section-title">Handoff surface</h4>
          <p className="corpus-panel__copy">Processing status: {document.processing_status || 'unknown'}</p>
          <p className="corpus-panel__copy">PID linkage: {annotations?.pid ? 'Present' : 'Not yet exposed by endpoint'}</p>
          <p className="corpus-panel__copy">Analytical output: source handoff into source interrogation, absences, or the semantic atlas.</p>
        </div>

        <div>
          <h4 className="corpus-panel__section-title">ML annotation</h4>
          <p className="corpus-panel__copy">Used for ML: {annotations?.used_for_ml ? 'Yes' : 'No / unspecified'}</p>
          <p className="corpus-panel__copy">ML pages: {annotations?.ml_pages || 'Not yet exposed by endpoint'}</p>
          <p className="corpus-panel__copy">{annotations?.ml_annotation || 'No annotation text returned by the endpoint.'}</p>
        </div>

        <div>
          <h4 className="corpus-panel__section-title">Similar documents</h4>
          {similarDocuments?.length > 0 ? (
            <div className="corpus-panel__list">
              {similarDocuments.slice(0, 5).map((similar) => (
                <div key={similar.document_id}>
                  <strong>{similar.title}</strong>
                  <div className="corpus-panel__meta">PID: {similar.pid || 'Not yet exposed by endpoint'} | Similarity: {(similar.similarity * 100).toFixed(1)}%</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="corpus-panel__empty">No similar documents returned for this document.</p>
          )}
        </div>

        <div className="app-actions-row app-actions-row--comfortable">
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