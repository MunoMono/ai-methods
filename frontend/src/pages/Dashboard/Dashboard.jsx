import { Grid, Column, Tile, ClickableTile, Tag } from '@carbon/react'
import { useNavigate } from 'react-router-dom'
import { ChartNetwork, DataVis_1, Recording, Chemistry, Checkmark, InProgress, Chip } from '@carbon/icons-react'
import { useEffect, useState } from 'react'
import TemporalDriftChart from '../../components/visualizations/TemporalDriftChart'
import StatsCards from '../../components/StatsCards/StatsCards'
import '../../styles/pages/Dashboard.scss'

const Dashboard = () => {
  const navigate = useNavigate()
  const [graniteInfo, setGraniteInfo] = useState(null)

  useEffect(() => {
    fetch('/api/granite/model-info')
      .then(res => res.json())
      .then(data => setGraniteInfo(data))
      .catch(err => console.error('Failed to fetch Granite model info:', err))
  }, [])

  return (
    <div className="dashboard">
      <div className="dashboard__hero">
        <Grid className="dashboard__hero-content">
          <Column lg={10} md={6} sm={4}>
            <h1 className="dashboard__hero-title">
              Epistemic drift detection
            </h1>
            <p className="dashboard__hero-subtitle">
              PID-gated NLP for design methods research (1965-1985). 
              BERT embeddings + provenance tracking + IBM Granite fine-tuning with full academic attribution.
            </p>
          </Column>
        </Grid>
      </div>

      <Grid className="dashboard__content" fullWidth>
        {graniteInfo && (
          <Column lg={16} md={8} sm={4}>
            <Tile className="dashboard__granite-tile">
              <div className="dashboard__granite-header">
                <div className="dashboard__granite-logo">
                  <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="32" height="32" rx="4" fill="#0F62FE"/>
                    <path d="M8 12L16 8L24 12V20L16 24L8 20V12Z" fill="white" fillOpacity="0.9"/>
                    <path d="M16 8V16M16 16L8 12M16 16L24 12M16 16V24M8 20L16 24M24 20L16 24" stroke="#0F62FE" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="dashboard__granite-info">
                  <h3>IBM Granite Language Model</h3>
                  <div className="dashboard__granite-meta">
                    <Tag type="blue" size="sm">
                      <Chip size={16} /> {graniteInfo.model_name || 'granite-3.1-8b-instruct'}
                    </Tag>
                    <Tag type={graniteInfo.is_loaded ? 'green' : 'gray'} size="sm">
                      {graniteInfo.is_loaded ? '✓ Loaded' : 'Loading...'}
                    </Tag>
                    <Tag type="purple" size="sm">
                      Device: {graniteInfo.device || 'CPU'}
                    </Tag>
                  </div>
                </div>
              </div>
              <p className="dashboard__granite-description">
                Enterprise-grade LLM optimized for epistemic drift analysis. 8-bit quantization for efficient CPU inference with full provenance tracking.
              </p>
              {graniteInfo.config && (
                <div className="dashboard__granite-config">
                  <span>Max Tokens: {graniteInfo.config.max_tokens}</span>
                  <span>Temperature: {graniteInfo.config.temperature}</span>
                  <span>Top-p: {graniteInfo.config.top_p}</span>
                </div>
              )}
            </Tile>
          </Column>
        )}

        <Column lg={16} md={8} sm={4}>
          <h2 className="dashboard__section-title">System Metrics</h2>
        </Column>
        
        <Column lg={16} md={8} sm={4}>
          <StatsCards />
        </Column>

        <Column lg={16} md={8} sm={4}>
          <div className="dashboard__diagram-section">
            <Tag type="blue" size="md" className="dashboard__diagram-badge">
              <Checkmark size={16} /> PID-Gated Architecture
            </Tag>
            <img 
              src="/diagrams/home/phd-model.svg" 
              alt="PhD research framework diagram showing the three strands of research"
              className="dashboard__diagram"
            />
          </div>
        </Column>

        <Column lg={16} md={8} sm={4}>
          <h2 className="dashboard__section-title">Research Tools</h2>
        </Column>

        <Column lg={8} md={4} sm={4}>
          <ClickableTile onClick={() => navigate('/tracer')} className="dashboard__tile">
            <div className="dashboard__tile-icon">
              <ChartNetwork size={32} />
            </div>
            <h3>Evidence Tracer</h3>
            <p>Trace predictions to archival sources with formal citations. Full provenance: Embeddings → Chunks → PIDs → DDR Archive</p>
          </ClickableTile>
        </Column>

        <Column lg={8} md={4} sm={4}>
          <ClickableTile onClick={() => navigate('/sessions')} className="dashboard__tile">
            <div className="dashboard__tile-icon">
              <Recording size={32} />
            </div>
            <h3>Session Recorder</h3>
            <p>Inference logging for XAI. Every prediction attributed to source chunks for supervisor validation</p>
          </ClickableTile>
        </Column>

        <Column lg={8} md={4} sm={4}>
          <ClickableTile onClick={() => navigate('/experiments')} className="dashboard__tile">
            <div className="dashboard__tile-icon">
              <Chemistry size={32} />
            </div>
            <h3>Experimental Log</h3>
            <p>IBM Granite training runs with provenance. Track which PIDs trained which model for reproducibility</p>
          </ClickableTile>
        </Column>

        <Column lg={8} md={4} sm={4}>
          <Tile className="dashboard__tile dashboard__tile--static">
            <div className="dashboard__tile-icon">
              <DataVis_1 size={32} />
            </div>
            <h3>Temporal Analysis</h3>
            <p>Monitor epistemic drift patterns and model behavior changes</p>
          </Tile>
        </Column>

        <Column lg={16} md={8} sm={4}>
          <Tile className="dashboard__chart-tile">
            <h3 className="dashboard__chart-title">Temporal Drift Analysis</h3>
            <TemporalDriftChart />
          </Tile>
        </Column>

        <Column lg={16} md={8} sm={4}>
          <div className="dashboard__info-section">
            <h2 className="dashboard__section-title">System Architecture</h2>
            <Grid condensed>
              <Column lg={5} md={8} sm={4}>
                <Tile className="dashboard__info-tile">
                  <h4>Ingestion Layer</h4>
                  <p>PID-gated allowlist: GraphQL sync + S3 validation + Docling OCR (PDF/TIFF)</p>
                </Tile>
              </Column>
              <Column lg={5} md={8} sm={4}>
                <Tile className="dashboard__info-tile">
                  <h4>NLP Layer</h4>
                  <p>BERT embeddings (384-dim) + IBM Granite fine-tuning + pgvector similarity search</p>
                </Tile>
              </Column>
              <Column lg={6} md={8} sm={4}>
                <Tile className="dashboard__info-tile">
                  <h4>Provenance Layer</h4>
                  <p>Training runs + inference logs + corpus snapshots + formal citations</p>
                </Tile>
              </Column>
            </Grid>
          </div>
        </Column>
      </Grid>
    </div>
  )
}

export default Dashboard
