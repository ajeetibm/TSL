import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { FloatingAIButton } from '../components/home/FloatingAIButton'
// import { Footer } from '../components/layout/Footer'
import { Navbar } from '../components/layout/Navbar'

export function RootLayout() {
  const { pathname } = useLocation()
  const [isAnimating, setIsAnimating] = useState(false)
  const isFocusedAppFlow =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/counsel/') ||
    pathname === '/wizard-details'

  useEffect(() => {
    // Trigger animation on route change
    setIsAnimating(true)

    // Pages that manage their own scroll target should not be reset to top
    if (pathname !== '/about' && pathname !== '/features' && pathname !== '/pricing' && pathname !== '/contact') {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      })
    }

    // Remove animation class after animation completes
    const timer = setTimeout(() => {
      setIsAnimating(false)
    }, 600)

    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <div className="min-h-screen bg-white">
      {!isFocusedAppFlow && <Navbar />}
      {!isFocusedAppFlow && <div className="h-16 lg:h-20" aria-hidden="true" />}
      <main className={isAnimating ? 'page-transition-enter' : ''}>
        <Outlet />
      </main>
      {/* {!isFocusedAppFlow && <Footer />} */}
      {!isFocusedAppFlow && <FloatingAIButton />}
    </div>
  )
}
