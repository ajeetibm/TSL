export type Portal = 'marketing' | 'sme' | 'admin' | 'counsel'

type PortalOrigins = Record<Portal, string>

const DEFAULT_ORIGINS: PortalOrigins = {
  marketing: 'https://thestartuplegal.co.za',
  sme: 'https://app.thestartuplegal.co.za',
  admin: 'https://admin.thestartuplegal.co.za',
  // This preserves the hostname supplied for the counsel portal. Correcting the
  // DNS name later only requires changing VITE_COUNSEL_URL at deploy time.
  counsel: 'https://counsel.thetsartuplegal.co.za',
}

function configuredOrigin(value: string | undefined, fallback: string) {
  return (value || fallback).replace(/\/$/, '')
}

export const portalOrigins: PortalOrigins = {
  marketing: configuredOrigin(import.meta.env.VITE_MARKETING_URL, DEFAULT_ORIGINS.marketing),
  sme: configuredOrigin(import.meta.env.VITE_APP_URL, DEFAULT_ORIGINS.sme),
  admin: configuredOrigin(import.meta.env.VITE_ADMIN_URL, DEFAULT_ORIGINS.admin),
  counsel: configuredOrigin(import.meta.env.VITE_COUNSEL_URL, DEFAULT_ORIGINS.counsel),
}

export function getCurrentPortal(hostname = typeof window === 'undefined' ? '' : window.location.hostname): Portal {
  const localPortal = import.meta.env.VITE_PORTAL as Portal | undefined
  if (localPortal && ['marketing', 'sme', 'admin', 'counsel'].includes(localPortal)) return localPortal

  const normalizedHost = hostname.toLowerCase().split(':')[0]
  const match = (Object.entries(portalOrigins) as Array<[Portal, string]>).find(([, origin]) => {
    try {
      return new URL(origin).hostname.toLowerCase() === normalizedHost
    } catch {
      return false
    }
  })

  return match?.[0] ?? 'marketing'
}

export function getPortalUrl(portal: Portal, path = '/') {
  return new URL(path, `${portalOrigins[portal]}/`).toString()
}

export function getPortalDashboardPath(portal: Exclude<Portal, 'marketing'>) {
  if (portal === 'admin') return '/admin/dashboard'
  if (portal === 'counsel') return '/counsel/dashboard'
  return '/dashboard'
}

/** Return users to the marketing origin after sign-out or session expiry. */
export function navigateToMarketing(navigate: (to: string) => void) {
  if (getCurrentPortal() === 'marketing') {
    navigate('/')
    return
  }
  window.location.assign(getPortalUrl('marketing'))
}

export function redirectToMarketing() {
  if (getCurrentPortal() === 'marketing') {
    window.location.assign('/')
    return
  }
  window.location.assign(getPortalUrl('marketing'))
}
