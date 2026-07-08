import { ChevronUp, LayoutDashboard, LogOut, Menu, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { navigation } from '../../data/navigation'
import { clearAuthSession } from '../../services/tslApi'
import { cn } from '../../utils/cn'
import { SignInModal } from '../auth/SignInModal'
import { Container } from './Container'
import './Navbar.css'

function getAccountName() {
  try {
    const savedUser = localStorage.getItem('tsl-auth-user')
    const user = savedUser ? JSON.parse(savedUser) as { fullName?: string; email?: string } : null

    return user?.fullName ?? user?.email ?? 'Sarfraznawaz.in'
  } catch {
    return 'Sarfraznawaz.in'
  }
}

function getPortal(): string | undefined {
  try {
    const savedUser = localStorage.getItem('tsl-auth-user')
    const user = savedUser ? JSON.parse(savedUser) as { portal?: string } : null
    return user?.portal
  } catch {
    return undefined
  }
}

function getDashboardPath() {
  const portal = getPortal()
  if (portal === 'admin') return '/admin/dashboard'
  if (portal === 'counsel') return '/counsel/dashboard'
  return '/dashboard'
}

function getProfilePath() {
  const portal = getPortal()
  if (portal === 'admin') return '/admin/dashboard?nav=profile'
  if (portal === 'counsel') return '/counsel/profile'
  return '/dashboard/profile'
}

export function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'signin' | 'signup'>('signup')
  const [authRedirectTo, setAuthRedirectTo] = useState<string | undefined>()
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('tsl-authenticated') === 'true')
  const accountName = getAccountName()
  const isHomePage = location.pathname === '/'

  const openModal = (mode: 'signin' | 'signup', redirectTo?: string) => {
    setModalMode(mode)
    setAuthRedirectTo(redirectTo)
    setIsSignInModalOpen(true)
  }

  const handleAuthenticated = () => {
    localStorage.setItem('tsl-authenticated', 'true')
    setIsAuthenticated(true)
  }

  const goToDashboard = () => {
    setIsAccountMenuOpen(false)
    navigate(getDashboardPath())
  }

  const goToProfile = () => {
    setIsAccountMenuOpen(false)
    navigate(getProfilePath())
  }

  const handleSignOut = () => {
    clearAuthSession()
    setIsAuthenticated(false)
    setIsAccountMenuOpen(false)
    navigate('/')
  }

  useEffect(() => {
    const handleOpenAuthModal = (event: Event) => {
      const detail = (event as CustomEvent<{ mode?: 'signin' | 'signup'; redirectTo?: string }>).detail
      openModal(detail?.mode ?? 'signup', detail?.redirectTo)
    }

    window.addEventListener('tsl-open-auth-modal', handleOpenAuthModal)

    return () => {
      window.removeEventListener('tsl-open-auth-modal', handleOpenAuthModal)
    }
  }, [])

  return (
    <header className={cn('navbar', (!isHomePage || isAuthenticated) && 'navbar--light')}>
      <Container className="navbar__inner">
        <NavLink to="/" className="navbar__brand" aria-label="TSL home">
          <span className="navbar__brand-mark">TSL</span>
          <span className="navbar__brand-name">The StartUp Legal</span>
        </NavLink>

        <nav className="navbar__links" aria-label="Primary navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn('navbar__link', isActive && 'navbar__link--active')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {isAuthenticated ? (
          <div className="navbar__account-wrap">
            <button
              className="navbar__account"
              onClick={() => setIsAccountMenuOpen((value) => !value)}
              aria-expanded={isAccountMenuOpen}
              aria-haspopup="menu"
            >
              <span className="navbar__account-avatar">
                <UserRound size={16} strokeWidth={2.4} />
              </span>
              <span className="navbar__account-name">{accountName}</span>
              <ChevronUp
                className={isAccountMenuOpen ? 'navbar__account-chevron navbar__account-chevron--open' : 'navbar__account-chevron'}
                size={14}
                strokeWidth={2.4}
              />
            </button>
            <div
              className={isAccountMenuOpen ? 'navbar__account-menu navbar__account-menu--open' : 'navbar__account-menu'}
              role="menu"
            >
              <button type="button" onClick={goToDashboard} role="menuitem">
                <LayoutDashboard size={16} />
                Dashboard
              </button>
              <button type="button" onClick={goToProfile} role="menuitem">
                <UserRound size={16} />
                Profile
              </button>
              <button type="button" onClick={handleSignOut} role="menuitem">
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="navbar__actions">
            <button
              onClick={() => openModal('signin')}
              className="navbar__signin"
            >
              Sign In
            </button>
            <button
              onClick={() => openModal('signup')}
              className="navbar__cta"
            >
              Get Started
            </button>
          </div>
        )}

        <button
          type="button"
          className="navbar__toggle"
          aria-label="Toggle navigation"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((value) => !value)}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </Container>

      {isOpen && (
        <nav className="navbar__mobile" aria-label="Mobile navigation">
          <div className="navbar__mobile-list">
            {navigation.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  cn('navbar__mobile-link', isActive && 'navbar__mobile-link--active')
                }
              >
                {item.label}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <div className="navbar__mobile-account-panel">
                <button
                  className="navbar__mobile-account"
                  onClick={() => {
                    goToDashboard()
                    setIsOpen(false)
                  }}
                >
                  <span className="navbar__account-avatar">
                    <UserRound size={16} strokeWidth={2.4} />
                  </span>
                  <span className="navbar__mobile-account-name">{accountName}</span>
                  <ChevronUp size={14} strokeWidth={2.4} />
                </button>
                <button
                  type="button"
                  className="navbar__mobile-account-action"
                  onClick={() => {
                    goToProfile()
                    setIsOpen(false)
                  }}
                >
                  Profile
                </button>
                <button
                  type="button"
                  className="navbar__mobile-account-action"
                  onClick={() => {
                    handleSignOut()
                    setIsOpen(false)
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  openModal('signup')
                  setIsOpen(false)
                }}
                className="navbar__mobile-cta"
              >
                Get Started
              </button>
            )}
          </div>
        </nav>
      )}

      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => {
          setIsSignInModalOpen(false)
          setAuthRedirectTo(undefined)
        }}
        initialMode={modalMode}
        redirectTo={authRedirectTo}
        onAuthenticated={handleAuthenticated}
      />
    </header>
  )
}
