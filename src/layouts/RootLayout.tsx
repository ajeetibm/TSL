import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { FloatingAIButton } from '../components/home/FloatingAIButton'
// import { Footer } from '../components/layout/Footer'
import { Navbar } from '../components/layout/Navbar'

const MARKETING_ROUTES = ['/', '/about', '/features', '/pricing', '/contact', '/counsel', '/playbooks-insights', '/wizard-catalogue', '/wizard-details']

function isMarketingRoute(pathname: string) {
  return MARKETING_ROUTES.includes(pathname) || pathname.startsWith('/wizard')
}

export function RootLayout() {
  const { pathname } = useLocation()
  const isFocusedAppFlow =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/counsel/')
  const isMarketing = isMarketingRoute(pathname)

  useEffect(() => {
    // Pages that manage their own scroll target should not be reset to top
    if (pathname !== '/about' && pathname !== '/features' && pathname !== '/pricing' && pathname !== '/contact') {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      })
    }
  }, [pathname])

  return (
    <div className="min-h-screen bg-white">
      {!isFocusedAppFlow && <Navbar />}
      {!isFocusedAppFlow && <div className="h-16 lg:h-20" aria-hidden="true" />}
      {isMarketing ? (
        <main key={pathname} className="page-transition-marketing">
          <Outlet />
        </main>
      ) : (
        <main>
          <Outlet />
        </main>
      )}
      {/* {!isFocusedAppFlow && <Footer />} */}
      {!isFocusedAppFlow && <FloatingAIButton />}
    </div>
  )
}
