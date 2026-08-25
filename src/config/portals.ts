export type Portal = 'marketing' | 'sme' | 'admin' | 'counsel'

export function getCurrentPortal(hostname = typeof window === 'undefined' ? '' : window.location.hostname): Portal {
  const localPortal = import.meta.env.VITE_PORTAL as Portal | undefined
  if (localPortal && ['marketing', 'sme', 'admin', 'counsel'].includes(localPortal)) return localPortal

  const hostMap: Record<string, Portal> = {
    'thestartuplegal.co.za': 'marketing',
    'app.thestartuplegal.co.za': 'sme',
    'admin.thestartuplegal.co.za': 'admin',
    'counsel.thetsartuplegal.co.za': 'counsel',
  }

  const normalizedHost = hostname.toLowerCase().split(':')[0]
  return hostMap[normalizedHost] ?? 'marketing'
}

export function getPortalDashboardPath(portal: Exclude<Portal, 'marketing'>) {
  if (portal === 'admin') return '/admin/dashboard'
  if (portal === 'counsel') return '/counsel/dashboard'
  return '/dashboard'
}
