import { Button, SkeletonText, Tag, Tile } from '@carbon/react'
import './CorpusPanels.scss'

const hasValue = (value) => {
  if (value === null || value === undefined) {
    return false
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasValue(item))
  }

  if (typeof value === 'string') {
    return value.trim().length > 0
  }

  return true
}

const renderValue = (value, fallback = 'Not available from the current endpoint.') => {
  if (!hasValue(value)) {
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

  if (annotations.used_for_ml === true || annotations.ml_policy_status?.startsWith('eligible')) {
    return 'Included'
  }

  return 'Policy unresolved'
}

const formatMlPageScope = (annotations) => {
  const scope = annotations?.ml_page_scope || annotations?.ml_pages || ''
  if (scope === 'all_pages') {
    return 'All pages'
  }

  if (scope) {
    return `pp. ${scope.replace(/-/g, '–')}`
  }

  if (annotations?.ml_policy_status === 'excluded_use_for_ml_false' || annotations?.used_for_ml === false) {
    return 'Not applicable'
  }

  if (annotations?.ml_policy_status === 'policy_unresolved' || annotations?.used_for_ml === null || annotations?.used_for_ml === undefined) {
    return 'Unresolved'
  }

  if (annotations?.used_for_ml === true) {
    return 'All pages'
  }

  return 'Not yet recorded'
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

const buildFieldRows = (rows) => rows.filter((row) => hasValue(row.value))

const formatFieldLabel = (value) => value.replaceAll('_', ' ')

const formatAuthorityRole = (value) => value.replaceAll('_', ' ')

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

const DocumentDetailPanel = ({ detail, loading, onTraceEvidence, onViewAnalytics, onInspectMissingness, authoritySummary = null }) => {
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
  const policyStatusLabel = formatStatusLabel(annotations?.ml_policy_status)
  const policyExplanation = annotations?.ml_policy_status === 'policy_unresolved' || annotations?.used_for_ml === null || annotations?.used_for_ml === undefined
    ? policyReason || 'The current local record does not yet contain enough asset-level policy data to determine ML eligibility or page scope.'
    : null
  const retrievalRows = buildFieldRows([
    { label: 'Document ID', value: document.id, fallback: 'Not yet exposed by endpoint' },
    { label: 'Archive record PID', value: annotations?.archive_record_pid },
    { label: 'Attached-media PID', value: annotations?.attached_media_pid || document.attached_media_pid || document.pid },
    { label: 'Asset PID', value: annotations?.asset_pid },
    { label: 'Asset ID', value: annotations?.asset_id },
    { label: 'Source filename', value: annotations?.source_filename || document.filename },
    { label: 'Source URI', value: annotations?.source_uri || document.source_uri },
    { label: 'Archive reference', value: provenanceMetadata.archive_reference },
    { label: 'Creator', value: provenanceMetadata.creator },
    { label: 'Date', value: provenanceMetadata.document_date },
    { label: 'Page count', value: annotations?.page_count ?? document.page_count ?? null }
  ])
  const persistence = annotations?.persistence || {}
  const persistenceRows = [
    { label: 'Local persistence status', value: document.processing_status || annotations?.processing_status, fallback: 'Unknown' },
    { label: 'Metadata roles version', value: persistence.metadata_roles_version || annotations?.metadata_roles_version, fallback: 'Not yet recorded' },
    { label: 'Ingestion version', value: persistence.ingestion_version || annotations?.ingestion_version, fallback: 'Not yet recorded' },
    { label: 'Corpus version', value: persistence.corpus_version || annotations?.corpus_version, fallback: 'Not yet recorded' }
  ]

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
          <p className="corpus-panel__copy">Policy status: {renderValue(policyStatusLabel, 'Policy unresolved')}</p>
          {policyReason ? <p className="corpus-panel__copy">Reason: {policyReason}</p> : null}
          {policyExplanation ? <p className="corpus-panel__meta">{policyExplanation}</p> : null}
          <p className="corpus-panel__copy">Access and rights control: {renderValue(annotations?.corpus_control?.access_level || annotations?.corpus_control?.rights_note, 'Not recorded on this local record.')}</p>
        </div>

        <div>
          <h4 className="corpus-panel__section-title">Retrieval and provenance</h4>
          <div className="corpus-panel__list">
            {retrievalRows.map((row) => (
              <div key={row.label} className="corpus-panel__field-row">
                <p className="corpus-panel__field-label">{row.label}</p>
                <p className="corpus-panel__field-value">{renderValue(row.value, row.fallback || 'Not yet recorded')}</p>
              </div>
            ))}
          </div>
          <p className="corpus-panel__meta">Additional archive provenance is not yet exposed through this local record.</p>
        </div>

        <div>
          <h4 className="corpus-panel__section-title">Archive / catalogue metadata</h4>
          {catalogueMetadata.length > 0 ? (
            <div className="corpus-panel__list">
              {catalogueMetadata.map(([key, value]) => (
                <div key={key} className="corpus-panel__field-row">
                  <p className="corpus-panel__field-label">{formatFieldLabel(key)}</p>
                  <p className="corpus-panel__field-value">{renderValue(value)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="corpus-panel__empty">No archive/catalogue metadata is currently attached to this local corpus record.</p>
          )}
          <p className="corpus-panel__meta">Catalogue metadata is descriptive context about the archived object, not a transcription of the PDF source text.</p>
        </div>

        <div>
          <h4 className="corpus-panel__section-title">Persistence and handoff</h4>
          <div className="corpus-panel__list">
            {persistenceRows.map((row) => (
              <div key={row.label} className="corpus-panel__field-row">
                <p className="corpus-panel__field-label">{row.label}</p>
                <p className="corpus-panel__field-value">{renderValue(row.value, row.fallback)}</p>
              </div>
            ))}
          </div>
          <p className="corpus-panel__copy">Analytical handoff: source interrogation, absences, or semantic atlas, without collapsing policy metadata into source evidence.</p>
        </div>

        {authoritySummary ? (
          <div>
            <h4 className="corpus-panel__section-title">Archive authorities</h4>
            <div className="app-tag-row corpus-panel__tag-row">
              <Tag type="teal">{authoritySummary.totalRecords} authority records</Tag>
              <Tag type="blue">{authoritySummary.count} authority types</Tag>
              <Tag type="gray">{authoritySummary.coreRecords} core</Tag>
              <Tag type="purple">{authoritySummary.criticalRecords} critical</Tag>
            </div>
            <p className="corpus-panel__meta">Authorities support future entity resolution, filtering and controlled query expansion. They are not source-document evidence.</p>
            <div className="corpus-panel__list corpus-panel__list--compact">
              {authoritySummary.authorityTypes.slice(0, 4).map((item) => (
                <div key={item.authority_type} className="corpus-panel__field-row">
                  <p className="corpus-panel__field-label">{formatFieldLabel(item.authority_type)}</p>
                  <p className="corpus-panel__field-value">{item.count} records · {item.allowed_roles.map(formatAuthorityRole).join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

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