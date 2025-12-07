import { Grid, Column, Tile, TextInput, Button } from '@carbon/react'
import { Search } from '@carbon/icons-react'
import { useState } from 'react'
import EvidenceGraph from '../../components/visualizations/EvidenceGraph'
import '../../styles/pages/EvidenceTracer.scss'

const EvidenceTracer = () => {
  const [query, setQuery] = useState('')
  const [traceData, setTraceData] = useState(null)

  const handleTrace = async () => {
    // TODO: Connect to FastAPI backend
    console.log('Tracing query:', query)
  }

  return (
    <Grid className="evidence-tracer" fullWidth>
      <Column lg={16} md={8} sm={4}>
        <h1>Evidence Tracer</h1>
        <p className="tracer__description">
          Visualize how the Granite agent constructs reasoning from retrieved document chunks
        </p>
      </Column>

      <Column lg={12} md={6} sm={4}>
        <TextInput
          id="query-input"
          labelText="Research Query"
          placeholder="Enter a question to trace the agent's reasoning..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </Column>

      <Column lg={4} md={2} sm={4}>
        <Button
          renderIcon={Search}
          onClick={handleTrace}
          disabled={!query.trim()}
        >
          Trace Evidence
        </Button>
      </Column>

      <Column lg={16} md={8} sm={4}>
        <Tile className="tracer__visualization">
          <EvidenceGraph data={traceData} />
        </Tile>
      </Column>
    </Grid>
  )
}

export default EvidenceTracer
