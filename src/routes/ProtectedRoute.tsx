import { Navigate, Outlet } from 'react-router-dom'

/**
 * Wraps routes that require authentication.
 * Reads the same key written by saveAuthSession() in tslApi.ts.
 * If no valid session is found the user is redirected to the home page
 * where they can open the Sign In modal.
 */
export function ProtectedRoute() {
  const isAuthenticated = localStorage.getItem('tsl-authenticated') === 'true'
  const hasToken = Boolean(localStorage.getItem('tsl-auth-token'))

  if (!isAuthenticated || !hasToken) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
