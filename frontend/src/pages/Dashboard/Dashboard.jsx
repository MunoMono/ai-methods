import { ClickableTile, InlineNotification, Tag, Tile } from '@carbon/react'
import { useNavigate } from 'react-router-dom'
import { Search, WarningAlt, Checkmark, InProgress, Chip, ArrowRight } from '@carbon/icons-react'
import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import { PageGrid, PageColumn as Column } from '../../components/layout/PageGrid'
import SectionHeading from '../../components/layout/SectionHeading'
import { fetchDashboardStats } from '../../api/viz'
import { getGraniteModelInfo } from '../../api/granite'
import '../../styles/pages/Dashboard.scss'

const readinessDefinitions = [
  {
    key: 'source-interrogation',
    title: 'Retrieval-augmented archival interrogation',
    description: 'RAG becomes a method of archival interrogation when retrieval is treated as a traceable interpretive act rather than as automated answer production.'
  },
  {
    key: 'absences',
    title: 'Retrieval-augmented missingness',
    description: 'Missingness becomes legible when failed retrieval, sparse metadata, absent entities, access restrictions and oral-history contradictions are recorded as analytical evidence.'
  },
  {
    key: 'cross-readings',
    title: 'Oral-historical / testimony-archive cross-reading',
    description: 'Oral history activates the archive not by filling gaps with facts, but by creating interpretive cross-readings between recollection, documentary trace and institutional memory.'
  },
  {
    key: 'semantic-atlas',
    title: 'Embedding-based visual analytics',
    description: 'Embedding-based visual analytics creates new legibilities by allowing contested design knowledge to be read as semantic proximity, cluster formation, anomaly and drift.'
  },
  {
    key: 'claims-evidence',
    title: 'Corroborative checking and interpretive control',
    description: 'Computational outputs become research evidence only when they are checked against provenance, metadata distribution, oral-historical interpretation and human judgement.'
  }
]

const Dashboard = () => {
  const navigate = useNavigate()
  const [graniteInfo, setGraniteInfo] = useState(null)
  const [stats, setStats] = useState(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let isCancelled = false

    const loadDashboard = async () => {
      try {
        const [granitePayload, statsPayload] = await Promise.all([
          getGraniteModelInfo().catch(() => null),
          fetchDashboardStats().catch(() => null)
        ])

        if (isCancelled) {
          return
        }

        setGraniteInfo(granitePayload)
        setStats(statsPayload)
      } catch (error) {
        if (!isCancelled) {
          setLoadError(error.message || 'Failed to load dashboard metrics.')
        }
      }
    }

    loadDashboard()

    return () => {
      isCancelled = true
    }
  }, [])

  const corpusStatus = useMemo(() => {
    const overview = stats?.overview || {}
    const mlProcessing = stats?.mlProcessing || {}
    return [
      { label: 'Local corpus documents', value: overview.totalDocuments ?? 0 },
      { label: 'Local persisted pages', value: overview.totalPages ?? 0 },
      { label: 'Documents with embeddings', value: mlProcessing.documentsWithEmbeddings ?? 0 },
      { label: 'Local PDF assets', value: overview.totalPdfAssets ?? overview.totalPdfs ?? 0 }
    ]
  }, [stats])

  const recentActivity = stats?.recentActivity?.length
    ? stats.recentActivity.slice(0, 4).map((item) => ({
        label: item.label || item.type || 'Activity',
        detail: `${item.count} recent event${item.count === 1 ? '' : 's'}`
      }))
    : [
        { label: 'Granite retrieval path', detail: 'Healthy on the local small Granite model.' },
        { label: 'Docling-ingested corpus', detail: 'Only four PDFs currently support retrieval and clustering.' },
        { label: 'Workbench refactor', detail: 'Primary workflow now centers Ask, Missingness, Cross-read, Clusters, and Claims.' }
      ]

  const limitations = [
    'Dashboard corpus counts describe the local persisted corpus, not the broader remote archive inventory discovered during Turin Phase 2.',
    'Only a small number of locally materialized PDFs currently have extracted text, so outputs remain case-study scale.',
    'Missingness, Cross-read, and Claims still use mocked first-wave data contracts while backend tables stabilize.',
    'Clusters reflect the current embedded evidence surface, not the full archive, and must not be treated as proof.'
  ]

  const priorities = [
    'Replace mocked missingness events with a lightweight backend event log.',
    'Persist Ask retrieval trails and Claims evidence attachments through stable endpoints.',
    'Tighten document and chunk handoff from Corpus into Ask and Clusters.'
  ]

  return (
    <div className="dashboard">
      <div className="dashboard__hero">
        <div className="dashboard__hero-inner">
          <PageHeader
            eyebrow="90-day statement of work"
            title="Archival activation workbench"
            description="A provenance-aware research apparatus for source interrogation, absences, cross-readings, semantic patterning, and claim-evidence control."
          />
        </div>
      </div>

      <PageGrid>
        <Column>
          <Tile className="dashboard__granite-hero-content">
            <div className="dashboard__granite-hero-badge">
              <Tag type="blue" size="md">
                <Chip size={20} /> Granite status
              </Tag>
              {graniteInfo && (
                <Tag type={graniteInfo.loaded ? 'green' : 'gray'} size="md">
                  {graniteInfo.loaded ? <Checkmark size={16} /> : <InProgress size={16} />}
                  {graniteInfo.loaded ? ' Active' : ' Standby'}
                </Tag>
              )}
            </div>
            <h2 className="dashboard__granite-hero-title">Research apparatus status</h2>
            <p className="dashboard__granite-hero-description">
              The current workbench is organized around five analytical outputs: source interrogation, absences, cross-readings, semantic patterning, and claims and evidence. Each view exists to produce a thesis artefact, provenance trail, or research decision surface.
            </p>
            {graniteInfo && (
              <div className="dashboard__granite-hero-specs">
                <div className="dashboard__granite-hero-spec">
                  <span className="dashboard__granite-hero-spec-label">Model</span>
                  <span className="dashboard__granite-hero-spec-value">{graniteInfo.model_name || 'Unavailable'}</span>
                </div>
                <div className="dashboard__granite-hero-spec">
                  <span className="dashboard__granite-hero-spec-label">Device</span>
                  <span className="dashboard__granite-hero-spec-value">{graniteInfo.device || 'CPU'}</span>
                </div>
                <div className="dashboard__granite-hero-spec">
                  <span className="dashboard__granite-hero-spec-label">Active runtime max tokens</span>
                  <span className="dashboard__granite-hero-spec-value">{graniteInfo.max_tokens ?? 'N/A'}</span>
                </div>
                <div className="dashboard__granite-hero-spec">
                  <span className="dashboard__granite-hero-spec-label">Active runtime temperature</span>
                  <span className="dashboard__granite-hero-spec-value">{graniteInfo.temperature ?? 'N/A'}</span>
                </div>
              </div>
            )}
          </Tile>
        </Column>

        {loadError && (
          <Column>
            <InlineNotification lowContrast kind="warning" title="Dashboard metrics degraded" subtitle={loadError} />
          </Column>
        )}

        <Column>
          <SectionHeading title="Corpus status" />
          <p className="app-copy-tight">These figures describe the local persisted experimental corpus and runtime state, not the full remote archive inventory.</p>
        </Column>

        {corpusStatus.map((item) => (
          <Column key={item.label} lg={4} md={4} sm={4}>
            <Tile className="dashboard__info-tile">
              <h4>{item.label}</h4>
              <p className="dashboard__metric-value">{item.value}</p>
            </Tile>
          </Column>
        ))}

        <Column>
          <SectionHeading title="Five-bucket readiness" />
        </Column>

        {readinessDefinitions.map((item) => (
          <Column key={item.key} lg={4} md={4} sm={4}>
            <ClickableTile onClick={() => navigate(`/${item.key}`)} className="dashboard__tile">
              <div className="dashboard__tile-icon">
                <ArrowRight size={24} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              {item.priority ? <p className="dashboard__priority-copy">{item.priority}</p> : null}
            </ClickableTile>
          </Column>
        ))}

        <Column>
          <SectionHeading title="Supporting views" />
        </Column>

        <Column lg={5} md={4} sm={4}>
          <ClickableTile onClick={() => navigate('/sources')} className="dashboard__tile">
            <div className="dashboard__tile-icon">
              <Search size={32} />
            </div>
            <h3>Sources</h3>
            <p>Source inspection before interrogation: document metadata, ingestion status, annotation detail, and workflow handoff.</p>
          </ClickableTile>
        </Column>

        <Column lg={5} md={4} sm={4}>
          <ClickableTile onClick={() => navigate('/provenance')} className="dashboard__tile">
            <div className="dashboard__tile-icon">
              <WarningAlt size={32} />
            </div>
            <h3>Provenance</h3>
            <p>Exports, session traces, and training provenance kept available as audit instruments rather than top-level research destinations.</p>
          </ClickableTile>
        </Column>

        <Column lg={5} md={8} sm={4}>
          <Tile className="dashboard__info-tile">
            <SectionHeading title="Recent research activity" />
            <div className="app-card-grid app-card-grid--dense">
              {recentActivity.map((item) => (
                <div key={item.label}>
                  <strong>{item.label}</strong>
                  <p className="app-copy-tight">{item.detail}</p>
                </div>
              ))}
            </div>
          </Tile>
        </Column>

        <Column lg={5} md={8} sm={4}>
          <Tile className="dashboard__info-tile">
            <SectionHeading title="Current known limitations" />
            <div className="app-card-grid app-card-grid--dense">
              {limitations.map((item) => (
                <p key={item} className="app-copy-reset">{item}</p>
              ))}
            </div>
          </Tile>
        </Column>

        <Column lg={6} md={8} sm={4}>
          <Tile className="dashboard__info-tile">
            <SectionHeading title="Next build priority" />
            <div className="app-card-grid app-card-grid--dense">
              {priorities.map((item) => (
                <p key={item} className="app-copy-reset">{item}</p>
              ))}
            </div>
          </Tile>
        </Column>
      </PageGrid>
    </div>
  )
}

export default Dashboard
