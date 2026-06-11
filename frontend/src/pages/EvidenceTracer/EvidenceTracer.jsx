import {
  Button,
  InlineLoading,
  InlineNotification,
  Select,
  SelectItem,
  Tag,
  TextArea,
  Tile
} from '@carbon/react'
import { Copy, Download, Search, Checkmark } from '@carbon/icons-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { analyzeGranite } from '../../api/granite'
import { getChunkCitation, getChunkProvenance, getInferenceProvenance } from '../../api/provenance'
import {
  createClaimFromQueryRun,
  createMissingnessEventFromQueryRun,
  createQueryRun,
  exportQueryRunJson,
  exportQueryRunMarkdown
} from '../../api/queryRuns'
import EvidenceChain from '../../components/evidence/EvidenceChain'
import EvidenceStatusControl from '../../components/evidence/EvidenceStatusControl'
import PanelHeader from '../../components/layout/PanelHeader'
import PageHeader from '../../components/layout/PageHeader'
import { PageGrid, PageColumn as Column } from '../../components/layout/PageGrid'
import EvidenceGraph from '../../components/visualizations/EvidenceGraph'
import { buildEvidenceTraceMemo, downloadMarkdown } from '../../utils/memoExport'
import { downloadFile, downloadJson } from '../../utils/workbenchExport'
import '../../styles/pages/EvidenceTracer.scss'

const defaultStatus = 'Needs review'

const EvidenceTracer = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState('granite')
  const [traceData, setTraceData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [persistenceError, setPersistenceError] = useState('')
  const [claimMessage, setClaimMessage] = useState('')
  const [claimError, setClaimError] = useState('')
  const [creatingClaim, setCreatingClaim] = useState(false)
  const [missingnessMessage, setMissingnessMessage] = useState('')
  const [missingnessError, setMissingnessError] = useState('')
  const [createdMissingnessEventId, setCreatedMissingnessEventId] = useState('')
  const [creatingMissingness, setCreatingMissingness] = useState(false)
  const [validationStatuses, setValidationStatuses] = useState({ overall: defaultStatus })

  useEffect(() => {
    const seededQuery = searchParams.get('query') || searchParams.get('pid') || searchParams.get('chunkId') || ''
    if (seededQuery && !query) {
      setQuery(seededQuery)
    }
  }, [query, searchParams])

  const persistTrace = async (nextTrace) => {
    const payload = {
      query_id: nextTrace.queryId,
      prompt: nextTrace.prompt,
      mode,
      model: nextTrace.model,
      response: nextTrace.response,
      caveats: nextTrace.caveats,
      failed_or_partial: nextTrace.failed_or_partial,
      failure_reason: nextTrace.failureReason,
      sources: (nextTrace.sources || []).map((source, index) => ({
        chunk_id: source.chunkId,
        document_id: source.documentId,
        pid: source.pid,
        title: source.title,
        page: source.page,
        section: source.section,
        excerpt: source.excerpt,
        score: source.score,
        rank: index + 1,
        citation: source.citation,
        citation_text: typeof source.citation === 'string' ? source.citation : null,
        provenance: source.provenance,
        provenance_status: source.provenanceStatus,
        citation_status: source.citationStatus
      })),
      source_metadata: nextTrace.sourceMetadata,
      citations: nextTrace.citations,
      page_ranges: nextTrace.pageRanges
    }

    return createQueryRun(payload)
  }

  const handleTrace = async () => {
    if (!query.trim() || loading || mode !== 'granite') {
      return
    }

    setLoading(true)
    setError('')
    setPersistenceError('')
    setClaimMessage('')
    setClaimError('')
    setMissingnessMessage('')
    setMissingnessError('')
    setCreatedMissingnessEventId('')

    try {
      const analysis = await analyzeGranite(query, { num_context_chunks: 3 })

      const enrichedSources = await Promise.all(
        analysis.sources.map(async (source) => {
          if (!source.chunkId) {
            return source
          }

          const nextSource = { ...source }

          try {
            const citation = await getChunkCitation(source.chunkId)
            nextSource.citation = citation
            nextSource.citationStatus = 'loaded'
            nextSource.pid = nextSource.pid || citation.pid
            nextSource.title = nextSource.title || citation.title
            nextSource.page = nextSource.page || citation.page
            nextSource.section = nextSource.section || citation.section
          } catch (citationError) {
            nextSource.citationStatus = 'error'
            nextSource.citationError = citationError.message
          }

          try {
            const provenance = await getChunkProvenance(source.chunkId)
            nextSource.provenance = provenance
            nextSource.provenanceStatus = 'loaded'
            nextSource.pid = nextSource.pid || provenance.document.pid
            nextSource.title = nextSource.title || provenance.document.title
            nextSource.page = nextSource.page || provenance.chunk.page
            nextSource.section = nextSource.section || provenance.chunk.section
            nextSource.documentId = nextSource.documentId || provenance.chunk.documentId || provenance.raw?.document_id || null
          } catch (provenanceError) {
            nextSource.provenanceStatus = 'error'
            nextSource.provenanceError = provenanceError.message
          }

          return nextSource
        })
      )

      let inferenceProvenance = null
      if (analysis.inferenceId) {
        try {
          inferenceProvenance = await getInferenceProvenance(analysis.inferenceId)
        } catch (inferenceError) {
          inferenceProvenance = { error: inferenceError.message }
        }
      }

      const nextTrace = {
        ...analysis,
        queryId: analysis.inferenceId || `query-${Date.now()}`,
        prompt: query,
        response: analysis.answer || '',
        retrievedChunkIds: enrichedSources.map((source) => source.chunkId).filter(Boolean),
        citations: enrichedSources.map((source) => source.citation).filter(Boolean),
        pageRanges: enrichedSources.map((source) => source.page).filter(Boolean),
        sourceMetadata: enrichedSources.map((source) => ({
          chunkId: source.chunkId,
          documentId: source.documentId,
          pid: source.pid,
          title: source.title,
          page: source.page,
          section: source.section,
          score: source.score
        })),
        timestamp: new Date().toISOString(),
        failed_or_partial: enrichedSources.length === 0 || enrichedSources.some((source) => source.provenanceStatus !== 'loaded'),
        caveats: enrichedSources.length === 0
          ? ['No source chunks returned by the current endpoint.']
          : enrichedSources.some((source) => source.provenanceStatus !== 'loaded')
            ? ['Some citation or provenance fields are incomplete in the current local stack.']
            : [],
        sources: enrichedSources,
        inferenceProvenance
      }

      let persistedRun = null
      try {
        persistedRun = await persistTrace(nextTrace)
      } catch (persistError) {
        setPersistenceError(persistError.message || 'The retrieval trail could not be persisted.')
      }

      setTraceData({
        ...nextTrace,
        queryId: persistedRun?.query_id || nextTrace.queryId,
        persisted: Boolean(persistedRun),
        retrievedChunkCount: persistedRun?.retrieved_chunk_count ?? nextTrace.retrievedChunkIds.length,
        failureReason: persistedRun?.failure_reason ?? nextTrace.failureReason ?? null
      })

      setValidationStatuses({
        overall: defaultStatus,
        ...Object.fromEntries(enrichedSources.map((source, index) => [source.chunkId || `source-${index}`, defaultStatus]))
      })
    } catch (traceError) {
      const failedTrace = {
        query,
        answer: '',
        model: 'Granite retrieval, stable',
        modelVersion: 'Unavailable',
        inferenceId: null,
        queryId: `query-${Date.now()}`,
        prompt: query,
        response: '',
        retrievedChunkIds: [],
        citations: [],
        pageRanges: [],
        sourceMetadata: [],
        timestamp: new Date().toISOString(),
        failed_or_partial: true,
        failureReason: traceError.message || 'Evidence trace failed.',
        caveats: [traceError.message || 'Evidence trace failed.'],
        sources: [],
        inferenceProvenance: null
      }

      try {
        const persistedRun = await persistTrace(failedTrace)
        failedTrace.queryId = persistedRun?.query_id || failedTrace.queryId
        failedTrace.persisted = Boolean(persistedRun)
        failedTrace.retrievedChunkCount = persistedRun?.retrieved_chunk_count ?? 0
        failedTrace.failureReason = persistedRun?.failure_reason || failedTrace.failureReason
      } catch (persistError) {
        setPersistenceError(persistError.message || 'The failed interrogation could not be persisted.')
      }

      setError(traceError.message || 'Evidence trace failed.')
      setTraceData(failedTrace)
      setValidationStatuses({ overall: defaultStatus })
    } finally {
      setLoading(false)
    }
  }

  const provenanceStatus = useMemo(() => {
    if (!traceData) {
      return { label: 'Retrieval ready', type: 'blue' }
    }

    const loaded = traceData.sources.filter((source) => source.provenanceStatus === 'loaded').length
    if (loaded === traceData.sources.length && loaded > 0) {
      return { label: 'Provenance enabled', type: 'green' }
    }

    if (loaded > 0 || traceData.sources.some((source) => source.citationStatus === 'loaded')) {
      return { label: 'Partial provenance', type: 'blue' }
    }

    return { label: 'Retrieval only', type: 'gray' }
  }, [traceData])

  const updateValidationStatus = (key, value) => {
    setValidationStatuses((current) => ({
      ...current,
      [key]: value
    }))
  }

  const handleToggleProvenance = (source) => {
    setTraceData((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        sources: current.sources.map((item) => {
          const key = item.chunkId || item.documentId || item.pid
          const sourceKey = source.chunkId || source.documentId || source.pid
          return key === sourceKey
            ? { ...item, provenanceExpanded: !item.provenanceExpanded }
            : item
        })
      }
    })
  }

  const handleCopyCitation = async (source) => {
    const citationText = typeof source.citation === 'string'
      ? source.citation
      : source.citation
        ? [source.citation.title, source.citation.pid ? `PID: ${source.citation.pid}` : null, source.citation.page ? `Page: ${source.citation.page}` : null, source.citation.publicUrl || null].filter(Boolean).join(' | ')
        : 'Not available from current endpoint.'

    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(citationText)
    }
  }

  const handleCopyMemo = async () => {
    if (!traceData) {
      return
    }

    const memo = buildEvidenceTraceMemo({ trace: traceData, validationStatuses })
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(memo)
    }
  }

  const handleDownloadMemo = () => {
    if (!traceData) {
      return
    }

    const memo = buildEvidenceTraceMemo({ trace: traceData, validationStatuses })
    const slug = (traceData.query || 'evidence-trace').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'evidence-trace'
    downloadMarkdown(`${slug}.md`, memo)
  }

  const handleExportMarkdown = async () => {
    if (!traceData) {
      return
    }

    if (traceData.persisted && traceData.queryId) {
      try {
        const content = await exportQueryRunMarkdown(traceData.queryId)
        downloadFile(`${traceData.queryId}.md`, content, 'text/markdown;charset=utf-8')
        return
      } catch (exportError) {
        setPersistenceError(exportError.message || 'Failed to export persisted retrieval memo.')
      }
    }

    handleDownloadMemo()
  }

  const goToCorpus = (source) => {
    const params = new URLSearchParams()
    if (source.documentId) params.set('documentId', source.documentId)
    if (source.pid) params.set('pid', source.pid)
    navigate(`/sources?${params.toString()}`)
  }

  const goToAnalytics = (source) => {
    const params = new URLSearchParams()
    if (source.chunkId) params.set('chunkId', source.chunkId)
    if (source.pid) params.set('pid', source.pid)
    navigate(`/semantic-atlas?${params.toString()}`)
  }

  const exportRetrievalTrail = async () => {
    if (!traceData) {
      return
    }

    if (traceData.persisted && traceData.queryId) {
      try {
        const content = await exportQueryRunJson(traceData.queryId)
        downloadFile(`${traceData.queryId}.json`, content, 'application/json;charset=utf-8')
        return
      } catch (exportError) {
        setPersistenceError(exportError.message || 'Failed to export the persisted retrieval trail.')
      }
    }

    downloadJson('ask-retrieval-trail.json', {
      query_id: traceData.queryId,
      prompt: traceData.prompt,
      response: traceData.response,
      model: traceData.model,
      retrieved_chunk_ids: traceData.retrievedChunkIds,
      citations: traceData.citations,
      page_ranges: traceData.pageRanges,
      source_metadata: traceData.sourceMetadata,
      timestamp: traceData.timestamp,
      failed_or_partial: traceData.failed_or_partial,
      caveats: traceData.caveats
    })
  }

  const handleCreateDraftClaim = async () => {
    if (!traceData?.queryId || !traceData.response || creatingClaim) {
      return
    }

    setCreatingClaim(true)
    setClaimError('')
    setClaimMessage('')

    try {
      const payload = await createClaimFromQueryRun(traceData.queryId, {
        claim_text: traceData.response,
        selected_chunk_ids: traceData.retrievedChunkIds,
        caveats: (traceData.caveats || []).join(' ') || null
      })
      setClaimMessage(`Draft claim ${payload.claim_id} created from this interrogation.`)
      navigate(`/claims-evidence?claimId=${payload.claim_id}`)
    } catch (createError) {
      setClaimError(createError.message || 'Failed to create a draft claim from this interrogation.')
    } finally {
      setCreatingClaim(false)
    }
  }

  const handleCreateAbsencesEvent = async () => {
    if (!traceData?.queryId || creatingMissingness) {
      return
    }

    setCreatingMissingness(true)
    setMissingnessError('')
    setMissingnessMessage('')

    try {
      const payload = await createMissingnessEventFromQueryRun(traceData.queryId, {})
      setCreatedMissingnessEventId(payload.event_id)
      setMissingnessMessage(`Absences event ${payload.event_id} created from this interrogation.`)
    } catch (createError) {
      setMissingnessError(createError.message || 'Failed to create an Absences event from this interrogation.')
    } finally {
      setCreatingMissingness(false)
    }
  }

  const canCreateAbsencesEvent = Boolean(
    traceData?.persisted &&
    traceData?.queryId &&
    (traceData.failed_or_partial || (traceData.retrievedChunkCount ?? traceData.retrievedChunkIds?.length ?? 0) === 0)
  )
  const showNoSourcesReturned = Boolean(
    traceData &&
    !loading &&
    (traceData.retrievedChunkCount ?? traceData.sources?.length ?? 0) === 0
  )

  return (
    <PageGrid className="evidence-tracer">
      <Column>
        <PageHeader
          title="Source Interrogation"
          description="Ask research questions against retrieved archival chunks, then inspect the source stack, caveats, and provenance trail."
          actions={(
            <Tag type={provenanceStatus.type} size="md">
              <Checkmark size={16} /> {provenanceStatus.label}
            </Tag>
          )}
        />
      </Column>

      <Column>
        <Tile className="tracer__panel tracer__panel--query">
          <PanelHeader
            title="Research query"
            description="Use the stable Granite retrieval path first. This view preserves the working local Granite route and treats provenance as mandatory, not optional."
          />

          <div className="tracer__query-grid">
            <TextArea
              id="query-input"
              labelText="Research query"
              rows={4}
              placeholder="Ask a research question about DDR traces, themes, testimony, projects, or design knowledge..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <Select id="trace-mode" labelText="Mode / model selector" value={mode} onChange={(e) => setMode(e.target.value)}>
              <SelectItem value="granite" text="Granite retrieval, stable" />
              <SelectItem value="agent" text="Agent trace, unavailable" disabled />
            </Select>
          </div>

          <div className="tracer__query-actions">
            <Button renderIcon={Search} onClick={handleTrace} disabled={!query.trim() || loading || mode !== 'granite'}>
              Run interrogation
            </Button>
            {loading && <InlineLoading description="Tracing retrieval, provenance, and evidence chain..." status="active" />}
          </div>
        </Tile>
      </Column>

      <Column>
        <InlineNotification
          lowContrast
          kind="info"
          title="Analytical output"
          subtitle="This view produces a retrieval trail / source stack. Generated answers are provisional until checked against retrieved source chunks and their provenance fields."
        />
      </Column>

      {!traceData && !loading && !error && (
        <Column>
          <InlineNotification
            lowContrast
            kind="info"
            title="Before interrogation"
            subtitle="Source interrogation turns a research question into a source-backed chain: prompt, model response, retrieved chunks, page ranges, source metadata, and DDR provenance where available."
          />
        </Column>
      )}

      {error && (
        <Column>
          <InlineNotification lowContrast kind="error" title="Interrogation failed" subtitle={error} />
        </Column>
      )}

      {persistenceError && (
        <Column>
          <InlineNotification lowContrast kind="warning" title="Persistence unavailable" subtitle={persistenceError} />
        </Column>
      )}

      {claimMessage && (
        <Column>
          <InlineNotification lowContrast kind="success" title="Draft claim created" subtitle={claimMessage} />
        </Column>
      )}

      {claimError && (
        <Column>
          <InlineNotification lowContrast kind="error" title="Claim handoff failed" subtitle={claimError} />
        </Column>
      )}

      {missingnessMessage && (
        <Column>
          <InlineNotification
            lowContrast
            kind="success"
            title="Absences event created"
            subtitle={missingnessMessage}
            actions={(
              <Button kind="ghost" size="sm" onClick={() => navigate(`/absences?eventId=${createdMissingnessEventId}`)}>
                Open in Absences
              </Button>
            )}
          />
        </Column>
      )}

      {missingnessError && (
        <Column>
          <InlineNotification lowContrast kind="error" title="Absences handoff failed" subtitle={missingnessError} />
        </Column>
      )}

      {traceData?.failed_or_partial && (
        <Column>
          <InlineNotification
            lowContrast
            kind="warning"
            title="Retrieval / provenance issue"
            subtitle={(traceData.caveats || []).join(' ') || 'The current interrogation completed with partial provenance or incomplete source coverage.'}
          />
        </Column>
      )}

      <Column>
        <Tile className="tracer__panel">
          <PanelHeader
            title="Answer"
            description="Granite-assisted response with explicit source-backing, caveats, and export controls. Generated answers remain provisional until checked against retrieved source chunks."
            actions={traceData && (
              <div className="tracer__answer-tags">
                <Tag type="blue">{traceData.model || 'Model unavailable'}</Tag>
                <Tag type="gray">{traceData.sources.length > 0 ? 'Source-backed' : 'No sources returned'}</Tag>
                {traceData.confidence !== null && <Tag type="teal">Confidence {traceData.confidence}</Tag>}
                {traceData.queryId && <Tag type="purple">{traceData.queryId}</Tag>}
              </div>
            )}
          />

          <div className="tracer__answer-body">
            {traceData ? (traceData.answer || 'No answer returned.') : 'No answer returned yet. Submit a query to begin evidence tracing.'}
          </div>

          {traceData && (
            <div className="tracer__answer-controls">
              <EvidenceStatusControl
                id="overall-evidence-status"
                label="Overall claim status"
                value={validationStatuses.overall || defaultStatus}
                onChange={(value) => updateValidationStatus('overall', value)}
              />
              <Button kind="ghost" size="sm" renderIcon={Copy} onClick={handleCopyMemo}>Copy retrieval memo</Button>
              <Button kind="ghost" size="sm" renderIcon={Download} onClick={handleExportMarkdown}>Download retrieval memo</Button>
              <Button kind="ghost" size="sm" renderIcon={Download} onClick={exportRetrievalTrail}>Export retrieval trail</Button>
              <Button kind="secondary" size="sm" onClick={handleCreateDraftClaim} disabled={!traceData.queryId || !traceData.response || creatingClaim}>
                {creatingClaim ? 'Creating draft claim...' : 'Create draft claim'}
              </Button>
              {canCreateAbsencesEvent && (
                <Button kind="secondary" size="sm" onClick={handleCreateAbsencesEvent} disabled={creatingMissingness}>
                  {creatingMissingness ? 'Creating Absences event...' : 'Create Absences event'}
                </Button>
              )}
            </div>
          )}
        </Tile>
      </Column>

      <Column>
        <Tile className="tracer__panel">
          <PanelHeader
            title="Retrieved source stack and evidence chain"
            description="Query → Granite model → retrieved chunks → documents → PIDs → DDR archive."
          />
          <EvidenceChain
            sources={traceData?.sources || []}
            showEmptyState={showNoSourcesReturned}
            validationStatuses={validationStatuses}
            onValidationChange={(source, value) => updateValidationStatus(source.chunkId || source.documentId || source.pid, value)}
            onCopyCitation={handleCopyCitation}
            onOpenCorpus={goToCorpus}
            onShowAnalytics={goToAnalytics}
            onToggleProvenance={handleToggleProvenance}
          />
        </Tile>
      </Column>

      <Column>
        <Tile className="tracer__visualization">
          <PanelHeader
            title="Retrieval trail"
            description="Visual cue for how the current answer traversed the local evidence surface."
          />
          <EvidenceGraph data={traceData} />
        </Tile>
      </Column>
    </PageGrid>
  )
}

export default EvidenceTracer
