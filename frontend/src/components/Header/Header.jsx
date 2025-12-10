import {
  Header as CarbonHeader,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SkipToContent
} from '@carbon/react'
import { Asleep, Light, Login, Logout } from '@carbon/icons-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import '../../styles/components/Header.scss'

const Header = ({ currentTheme, onThemeToggle }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginWithRedirect, logout, isAuthenticated, user } = useAuth0()
  const isDark = currentTheme === 'g100'

  return (
    <CarbonHeader aria-label="Epistemic Drift Research">
      <SkipToContent />
      <HeaderName href="#" prefix="RCA PhD" onClick={(e) => { e.preventDefault(); navigate('/') }}>
        {isAuthenticated ? user.name : 'Graham Newman'}
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
        {isAuthenticated ? (
          <HeaderGlobalAction
            aria-label="Logout"
            tooltipAlignment="end"
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          >
            <Logout size={20} />
          </HeaderGlobalAction>
        ) : (
          <HeaderGlobalAction
            aria-label="Login"
            tooltipAlignment="end"
            onClick={() => loginWithRedirect()}
          >
            <Login size={20} />
          </HeaderGlobalAction>
        )}
      </HeaderGlobalBar>
    </CarbonHeader>
  )
}

export default Header
