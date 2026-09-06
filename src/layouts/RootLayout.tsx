import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { FloatingAIButton } from '../components/home/FloatingAIButton'
import { Navbar } from '../components/layout/Navbar'

const MARKETING_ROUTES = ['/', '/about', '/features', '/pricing', '/contact', '/counsel', '/playbooks-insights', '/wizard-catalogue', '/wizard-details', '/forgot-password', '/reset-password', '/reset-success', '/counsel/reset-password']

function isMarketingRoute(pathname: string) {
  return MARKETING_ROUTES.includes(pathname) || pathname.startsWith('/wizard') || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password') || pathname.startsWith('/reset-success') || pathname.startsWith('/counsel/reset-password')
}

function isCounselPublicRoute(pathname: string) {
  return (
    pathname.startsWith('/counsel/login') ||
    pathname.startsWith('/counsel/email-sent') ||
    pathname.startsWith('/counsel/reset-password')
  )
}

export function RootLayout() {
  const { pathname } = useLocation()
  const isFocusedAppFlow =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    (pathname.startsWith('/counsel/') && !isCounselPublicRoute(pathname))
  const isMarketing = isMarketingRoute(pathname)
  // Only show the dark footer for counsel login/email-sent, NOT reset-password (uses marketing bg)
  const showCounselFooter = isCounselPublicRoute(pathname) && !pathname.startsWith('/counsel/reset-password')

  useEffect(() => {
    // Pages that manage their own scroll target should not be reset to top
    if (pathname !== '/about' && pathname !== '/features' && pathname !== '/pricing' && pathname !== '/contact') {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      })
    }
  }, [pathname])

  return (
    <div className={`min-h-screen bg-white${showCounselFooter ? ' has-counsel-footer' : ''}`} style={showCounselFooter ? { display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' } : undefined}>
      {!isFocusedAppFlow && <Navbar />}
      {!isFocusedAppFlow && <div className="h-16 lg:h-20 bg-[#0D1B2A]" aria-hidden="true" />}
      {isMarketing ? (
        <main key={pathname} className="page-transition-marketing">
          <Outlet />
        </main>
      ) : (
        <main style={showCounselFooter ? { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } : undefined}>
          <Outlet />
        </main>
      )}
      {showCounselFooter && (
        <footer style={{
          background: '#0d1b2a',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          height: '72px',
          color: 'rgba(255,255,255,0.55)',
          fontSize: '13px',
        }}>
          <span>© Copyright 2025 The Legal Startup. All rights reserved.</span>
          <nav style={{ display: 'flex', gap: '24px' }}>
            <a
              href="/"
              style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: '13px' }}
              onMouseOver={e => (e.currentTarget.style.color = '#c79a3b')}
              onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
            >
              Sign Up
            </a>
            <a
              href="/counsel/login"
              style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: '13px' }}
              onMouseOver={e => (e.currentTarget.style.color = '#c79a3b')}
              onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
            >
              Login
            </a>
          </nav>
        </footer>
      )}
      {!isFocusedAppFlow && <FloatingAIButton />}
    </div>
  )
}
