import {
  Header as CarbonHeader,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SkipToContent
} from '@carbon/react'
import { Asleep, Light } from '@carbon/icons-react'
import { useNavigate, useLocation } from 'react-router-dom'
import '../../styles/components/Header.scss'

const Header = ({ currentTheme, onThemeToggle }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const isDark = currentTheme === 'g100'

  return (
    <CarbonHeader aria-label="Epistemic Drift Research">
      <SkipToContent />
      <HeaderName href="#" prefix="RCA PhD" onClick={(e) => { e.preventDefault(); navigate('/') }}>
        Graham Newman
      </HeaderName>
      <HeaderNavigation aria-label="Research Navigation">
        <HeaderMenuItem
          onClick={() => navigate('/')}
          isCurrentPage={location.pathname === '/'}
        >
          Dashboard
        </HeaderMenuItem>
        <HeaderMenuItem
          onClick={() => navigate('/tracer')}
          isCurrentPage={location.pathname === '/tracer'}
        >
          Evidence Tracer
        </HeaderMenuItem>
        <HeaderMenuItem
          onClick={() => navigate('/sessions')}
          isCurrentPage={location.pathname === '/sessions'}
        >
          Session Recorder
        </HeaderMenuItem>
        <HeaderMenuItem
          onClick={() => navigate('/experiments')}
          isCurrentPage={location.pathname === '/experiments'}
        >
          Experimental Log
        </HeaderMenuItem>
      </HeaderNavigation>
      <HeaderGlobalBar>
        <HeaderGlobalAction
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          tooltipAlignment="end"
          onClick={onThemeToggle}
        >
          {isDark ? <Light size={20} /> : <Asleep size={20} />}
        </HeaderGlobalAction>
      </HeaderGlobalBar>
    </CarbonHeader>
  )
}

export default Header
