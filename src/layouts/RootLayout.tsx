import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { FloatingAIButton } from '../components/home/FloatingAIButton'
import { Footer } from '../components/layout/Footer'
import { Navbar } from '../components/layout/Navbar'

export function RootLayout() {
  const { pathname } = useLocation()
  const isFocusedAppFlow =
    pathname.startsWith('/dashboard') || pathname === '/wizard-catalogue' || pathname === '/wizard-details'

  useEffect(() => {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    })
  }, [pathname])

  return (
    <div className="min-h-screen bg-white">
      {!isFocusedAppFlow && <Navbar />}
      {!isFocusedAppFlow && <div className="h-16 lg:h-20" aria-hidden="true" />}
      <main>
        <Outlet />
      </main>
      {!isFocusedAppFlow && <Footer />}
      {!isFocusedAppFlow && <FloatingAIButton />}
    </div>
  )
}
