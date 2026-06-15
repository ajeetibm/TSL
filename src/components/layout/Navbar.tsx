import { ChevronUp, Menu, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { navigation } from '../../data/navigation'
import { cn } from '../../utils/cn'
import { SignInModal } from '../auth/SignInModal'
import { Container } from './Container'
import './Navbar.css'

export function Navbar() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'signin' | 'signup'>('signup')
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('tsl-authenticated') === 'true')

  const openModal = (mode: 'signin' | 'signup') => {
    setModalMode(mode)
    setIsSignInModalOpen(true)
  }

  const handleAuthenticated = () => {
    localStorage.setItem('tsl-authenticated', 'true')
    setIsAuthenticated(true)
  }

  const goToDashboard = () => {
    navigate('/dashboard')
  }

  useEffect(() => {
    const handleOpenAuthModal = (event: Event) => {
      const detail = (event as CustomEvent<{ mode?: 'signin' | 'signup' }>).detail
      openModal(detail?.mode ?? 'signup')
    }

    window.addEventListener('tsl-open-auth-modal', handleOpenAuthModal)

    return () => {
      window.removeEventListener('tsl-open-auth-modal', handleOpenAuthModal)
    }
  }, [])

  return (
    <header className="navbar">
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
          <button className="navbar__account" onClick={goToDashboard}>
            <span className="navbar__account-avatar">
              <UserRound size={16} strokeWidth={2.4} />
            </span>
            <span className="navbar__account-name">Sarfraznawaz.in</span>
            <ChevronUp size={14} strokeWidth={2.4} />
          </button>
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
                <span className="navbar__mobile-account-name">Sarfraznawaz.in</span>
                <ChevronUp size={14} strokeWidth={2.4} />
              </button>
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
        onClose={() => setIsSignInModalOpen(false)}
        initialMode={modalMode}
        onAuthenticated={handleAuthenticated}
      />
    </header>
  )
}
