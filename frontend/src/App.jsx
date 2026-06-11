import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Theme, Loading } from '@carbon/react'
import Header from './components/Header/Header'
import Dashboard from './pages/Dashboard/Dashboard'
import CorpusExplorer from './pages/CorpusExplorer/CorpusExplorer'
import EvidenceTracer from './pages/EvidenceTracer/EvidenceTracer'
import VisualAnalytics from './pages/VisualAnalytics/VisualAnalytics'
import MissingnessWorkbench from './pages/MissingnessWorkbench/MissingnessWorkbench'
import CrossReadWorkbench from './pages/CrossReadWorkbench/CrossReadWorkbench'
import ClaimsWorkbench from './pages/ClaimsWorkbench/ClaimsWorkbench'
import AuditWorkbench from './pages/AuditWorkbench/AuditWorkbench'
import LoginPage from './components/Auth/LoginPage'
import './styles/App.scss'

function App() {
  const [theme, setTheme] = useState('g100')
  const { isAuthenticated, isLoading } = useAuth0()

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'white' ? 'g100' : 'white')
  }

  if (isLoading) {
    return (
      <Theme theme={theme}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <Loading withOverlay={false} />
        </div>
      </Theme>
    )
  }

  if (!isAuthenticated) {
    return (
      <Theme theme={theme}>
        <LoginPage />
      </Theme>
    )
  }

  return (
    <Router>
      <Theme theme={theme}>
        <Header currentTheme={theme} onThemeToggle={toggleTheme} />
        <div className="app-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/workbench" element={<Dashboard />} />
            <Route path="/dashboard" element={<Navigate to="/workbench" replace />} />
            <Route path="/sources" element={<CorpusExplorer />} />
            <Route path="/source-interrogation" element={<EvidenceTracer />} />
            <Route path="/absences" element={<MissingnessWorkbench />} />
            <Route path="/cross-readings" element={<CrossReadWorkbench />} />
            <Route path="/semantic-atlas" element={<VisualAnalytics />} />
            <Route path="/claims-evidence" element={<ClaimsWorkbench />} />
            <Route path="/provenance" element={<AuditWorkbench />} />
            <Route path="/corpus" element={<Navigate to="/sources" replace />} />
            <Route path="/ask" element={<Navigate to="/source-interrogation" replace />} />
            <Route path="/missingness" element={<Navigate to="/absences" replace />} />
            <Route path="/cross-read" element={<Navigate to="/cross-readings" replace />} />
            <Route path="/clusters" element={<Navigate to="/semantic-atlas" replace />} />
            <Route path="/claims" element={<Navigate to="/claims-evidence" replace />} />
            <Route path="/audit" element={<Navigate to="/provenance" replace />} />
            <Route path="/tracer" element={<Navigate to="/source-interrogation" replace />} />
            <Route path="/visual-analytics" element={<Navigate to="/semantic-atlas" replace />} />
            <Route path="/sessions" element={<Navigate to="/provenance" replace />} />
            <Route path="/experiments" element={<Navigate to="/provenance" replace />} />
            <Route path="/ml-dashboard" element={<Navigate to="/provenance" replace />} />
          </Routes>
        </div>
      </Theme>
    </Router>
  )
}

export default App
