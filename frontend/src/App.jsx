import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Theme } from '@carbon/react'
import Header from './components/Header/Header'
import Dashboard from './pages/Dashboard/Dashboard'
import EvidenceTracer from './pages/EvidenceTracer/EvidenceTracer'
import SessionRecorder from './pages/SessionRecorder/SessionRecorder'
import ExperimentalLog from './pages/ExperimentalLog/ExperimentalLog'
import './styles/App.scss'

function App() {
  const [theme, setTheme] = useState('g100')

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'white' ? 'g100' : 'white')
  }

  return (
    <Router basename="/ai-methods">
      <Theme theme={theme}>
        <Header currentTheme={theme} onThemeToggle={toggleTheme} />
        <div className="app-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tracer" element={<EvidenceTracer />} />
            <Route path="/sessions" element={<SessionRecorder />} />
            <Route path="/experiments" element={<ExperimentalLog />} />
          </Routes>
        </div>
      </Theme>
    </Router>
  )
}

export default App
