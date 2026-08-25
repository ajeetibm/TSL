import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { getCurrentPortal, getPortalDashboardPath } from '../config/portals'
import PortalLogin from '../pages/auth/PortalLogin'
import { authApi, clearAuthSession, saveAuthSession } from '../services/tslApi'

export function PortalLanding({ marketing, counselLogin }: { marketing: ReactNode; counselLogin: ReactNode }) {
  const portal = getCurrentPortal()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const handoffCode = searchParams.get('handoff')
  const handoffRedirectTo = searchParams.get('redirectTo')
  const [handoffError, setHandoffError] = useState('')
  // React Strict Mode intentionally re-runs effects in development. A portal
  // handoff is single-use, so only the first effect execution may exchange it.
  const handoffExchangeStarted = useRef(false)

  // Marketing is deliberately session-free. This also clears sessions created
  // by older builds before cross-domain handoff was introduced.
  useEffect(() => {
    if (portal === 'marketing' && localStorage.getItem('tsl-authenticated') === 'true') {
      clearAuthSession()
    }
  }, [portal])

  useEffect(() => {
    if (!handoffCode || handoffExchangeStarted.current) return
    handoffExchangeStarted.current = true

    authApi.exchangePortalHandoff(handoffCode).then((response) => {
      if (!response.success || !response.data) {
        setHandoffError(response.message ?? 'Your sign-in link is invalid or has expired.')
        return
      }
      if (response.data.portal !== portal) {
        setHandoffError('This sign-in link belongs to a different portal.')
        return
      }
      saveAuthSession(response.data)
      if (response.data.mustResetPassword) {
        navigate('/counsel/reset-password', { replace: true, state: { email: response.data.email, token: response.data.token } })
        return
      }
      // If the redirectTo URL contains a `cart` query param, write the encoded
      // wizard selection to localStorage on this (app) domain before navigating.
      // This is necessary because localStorage is origin-scoped: the marketing
      // site cannot write to the app domain's storage.
      if (handoffRedirectTo) {
        try {
          const cartParam = new URL(handoffRedirectTo, window.location.origin).searchParams.get('cart')
          if (cartParam) {
            localStorage.setItem('tsl-selected-dashboard-wizards', decodeURIComponent(cartParam))
          }
        } catch { /* ignore malformed URLs */ }
      }
      navigate(handoffRedirectTo ?? getPortalDashboardPath(portal as Exclude<typeof portal, 'marketing'>), { replace: true })
    }).catch(() => {
      setHandoffError('Unable to complete sign-in. Please try again.')
    })
  }, [handoffCode, navigate, portal])

  if (handoffCode) {
    return (
      <main className="auth-page">
        <section className="auth-page__panel"><div className="auth-page__card auth-page__card--center">
          {handoffError ? <p className="auth-page__error" role="alert">{handoffError}</p> : <p>Completing secure sign-in…</p>}
        </div></section>
      </main>
    )
  }

  const isAuthenticated = localStorage.getItem('tsl-authenticated') === 'true' && Boolean(localStorage.getItem('tsl-auth-token'))

  if (portal === 'marketing') return <>{marketing}</>
  if (isAuthenticated) return <Navigate to={getPortalDashboardPath(portal)} replace />
  if (portal === 'counsel') return <>{counselLogin}</>
  return <PortalLogin portal={portal} />
}
