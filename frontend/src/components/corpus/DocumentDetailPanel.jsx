import { Button, SkeletonText, Tag, Tile } from '@carbon/react'
import './CorpusPanels.scss'

const renderValue = (value, fallback = 'Not available from the current endpoint.') => {
  if (value === null || value === undefined) {
    return fallback
  }

  if (Array.isArray(value)) {
    const flattened = value.filter(Boolean).join(', ')
    return flattened || fallback
  }

  if (typeof value === 'string') {
    return value.trim() || fallback
  }

  return value
}

const formatMlEligibility = (annotations) => {
  if (!annotations) {
    return 'Not available from the current endpoint.'
  }

  if (annotations.ml_policy_status === 'excluded_use_for_ml_false') {
    return 'Excluded'
  }

  if (annotations.used_for_ml) {
    return 'Included'
  }

  return 'Policy unresolved'
}

const formatMlPageScope = (annotations) => {
  const scope = annotations?.ml_page_scope || annotations?.ml_pages || ''
  if (!scope) {
    return annotations?.used_for_ml ? 'All pages' : 'Not applicable'
  }

  if (scope === 'all_pages') {
    return 'All pages'
  }

  return `pp. ${scope.replace(/-/g, '–')}`
}

const formatPolicyReason = (annotations) => {
  if (!annotations?.ml_exclusion_reason) {
    return null
  }

  if (annotations.ml_exclusion_reason === 'asset_marked_use_for_ml_false') {
    return 'Asset marked Use for ML = false'
  }

  if (annotations.ml_exclusion_reason.startsWith('invalid_ml_pages:')) {
    return 'Page-scope metadata could not be interpreted safely'
  }

  return annotations.ml_exclusion_reason.replaceAll('_', ' ')
}

const formatStatusLabel = (value) => {
  if (!value) {
    return 'Unknown'
  }

  return value.replaceAll('_', ' ')
}

const formatMetadataList = (metadata) => Object.entries(metadata || {}).filter(([, value]) => {
  if (Array.isArray(value)) {
    return value.length > 0
  }

  return value !== null && value !== undefined && `${value}`.trim() !== ''
})

const copyCitation = async (detail) => {
  const document = detail?.document || {}
  const annotations = detail?.annotations || {}
  const citation = [
    document.title || 'Untitled document',
    annotations.archive_record_pid ? `Archive record PID: ${annotations.archive_record_pid}` : annotations.pid ? `PID: ${annotations.pid}` : null,
    annotations.asset_pid ? `Asset PID: ${annotations.asset_pid}` : annotations.asset_id ? `Asset ID: ${annotations.asset_id}` : null,
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
  const catalogueMetadata = formatMetadataList(annotations?.catalogue_metadata)
  const provenanceMetadata = annotations?.retrieval_provenance || {}
  const policyReason = formatPolicyReason(annotations)
  const recordPublicUrl = annotations?.record_public_uri || provenanceMetadata.record_public_uri || null

  return (
    <Tile>
      <h3 className="corpus-panel__section-title">{document.title}</h3>
      <div className="app-tag-row corpus-panel__tag-row">
        <Tag type="blue">{annotations?.archive_record_pid || annotations?.pid || 'Record PID unavailable'}</Tag>
        <Tag type="gray">{document.publication_year || 'Year not yet exposed by endpoint'}</Tag>
        <Tag type={document.processing_status === 'completed' ? 'green' : 'blue'}>{document.processing_status || 'unknown'}</Tag>
      </div>

      {error && <p>{error}</p>}

      <div className="corpus-panel__stack">
        <div>
          <h4 className="corpus-panel__section-title">Corpus control</h4>
          <p className="corpus-panel__copy">ML eligibility: {formatMlEligibility(annotations)}</p>
          <p className="corpus-panel__copy">ML page scope: {formatMlPageScope(annotations)}</p>
          <p className="corpus-panel__copy">Policy status: {renderValue(formatStatusLabel(annotations?.ml_policy_status), 'Not available from the current endpoint.')}</p>
          {policyReason ? <p className="corpus-panel__copy">Reason: {policyReason}</p> : null}
          <p className="corpus-panel__copy">Access and rights control: {renderValue(annotations?.corpus_control?.access_level || annotations?.corpus_control?.rights_note)}</p>
        </div>

        <div>
          <h4 className="corpus-panel__section-title">Retrieval and provenance</h4>
          <p className="corpus-panel__copy">Document ID: {document.id || 'Not yet exposed by endpoint'}</p>
          <p className="corpus-panel__copy">Archive record PID: {renderValue(annotations?.archive_record_pid)}</p>
          <p className="corpus-panel__copy">Asset identifier: {renderValue(annotations?.asset_pid || annotations?.asset_id || annotations?.asset_id_or_asset_pid)}</p>
          <p className="corpus-panel__copy">Source filename: {renderValue(annotations?.source_filename || document.filename)}</p>
          <p className="corpus-panel__copy">Archive reference: {renderValue(provenanceMetadata.archive_reference)}</p>
          <p className="corpus-panel__copy">Creator: {renderValue(provenanceMetadata.creator)}</p>
          <p className="corpus-panel__copy">Date: {renderValue(provenanceMetadata.document_date)}</p>
          <p className="corpus-panel__copy">Page count: {annotations?.page_count || document.page_count || 'Not available from the current endpoint.'}</p>
        </div>

        <div>
          <h4 className="corpus-panel__section-title">Archive / catalogue metadata</h4>
          {catalogueMetadata.length > 0 ? (
            <div className="corpus-panel__list">
              {catalogueMetadata.map(([key, value]) => (
                <p key={key} className="corpus-panel__copy"><strong>{key.replaceAll('_', ' ')}:</strong> {renderValue(value)}</p>
              ))}
            </div>
          ) : (
            <p className="corpus-panel__empty">No descriptive archive metadata returned for this source.</p>
          )}
          <p className="corpus-panel__meta">Catalogue metadata is descriptive context about the archived object, not a transcription of the PDF source text.</p>
        </div>

        <div>
          <h4 className="corpus-panel__section-title">Persistence and handoff</h4>
          <p className="corpus-panel__copy">Local corpus status: {renderValue(document.processing_status || annotations?.processing_status, 'unknown')}</p>
          <p className="corpus-panel__copy">Metadata role version: {renderValue(annotations?.metadata_roles_version, 'Not present on this record.')}</p>
          <p className="corpus-panel__copy">Ingestion version: {renderValue(annotations?.ingestion_version, 'Not recorded on this record.')}</p>
          <p className="corpus-panel__copy">Corpus version: {renderValue(annotations?.corpus_version, 'Not recorded on this record.')}</p>
          <p className="corpus-panel__copy">Analytical handoff: source interrogation, absences, or semantic atlas, without collapsing policy metadata into source evidence.</p>
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
          <Button kind="ghost" disabled={!recordPublicUrl} onClick={() => recordPublicUrl && window.open(recordPublicUrl, '_blank', 'noopener,noreferrer')}>Open DDR source</Button>
        </div>
      </div>
    </Tile>
  )
}

export default DocumentDetailPanel