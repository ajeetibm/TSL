import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { NotificationProvider } from '../context/NotificationContext'
import { UserProfileProvider } from '../context/UserProfileContext'
import { CounselAvailabilityProvider } from '../context/CounselAvailabilityContext'
import { CounselRequestProvider } from '../context/CounselRequestContext'
import { RootLayout } from '../layouts/RootLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { preloadUserDashboard } from './dashboardPreload'
import { DashboardShell, type DashboardSection } from '../components/dashboard/DashboardShell'
import '../pages/user-dashboard/Dashboard.css'

const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'))
const ResetPassword  = lazy(() => import('../pages/auth/ResetPassword'))
const ResetSuccess   = lazy(() => import('../pages/auth/ResetSuccess'))
const Home = lazy(() => import('../pages/Home'))
const About = lazy(() => import('../pages/About'))
const Features = lazy(() => import('../pages/Features'))
const Pricing = lazy(() => import('../pages/Pricing'))
const Contact = lazy(() => import('../pages/Contact'))
const Counsel = lazy(() => import('../pages/Counsel'))
const PlaybooksInsights = lazy(() => import('../pages/PlaybooksInsights'))
const AdminDashboard = lazy(() => import('../pages/admin-dashboard/AdminDashboard'))
const CounselLogin = lazy(() => import('../pages/counsel-portal/CounselLogin'))
const CounselEmailSent = lazy(() => import('../pages/counsel-portal/CounselEmailSent'))
const CounselPortal = lazy(() => import('../pages/counsel-portal/CounselPortal'))
const CounselProfile = lazy(() => import('../pages/counsel-portal/CounselProfile'))
const CounselResetPassword = lazy(() => import('../pages/counsel-portal/CounselResetPassword'))
const Dashboard = lazy(preloadUserDashboard)
const DashboardCounsel = lazy(() => import('../pages/user-dashboard/DashboardCounsel'))
const DashboardNotifications = lazy(() => import('../pages/user-dashboard/DashboardNotifications'))
const DashboardPlaybooks = lazy(() => import('../pages/user-dashboard/DashboardPlaybooks'))
const DashboardProfile = lazy(() => import('../pages/user-dashboard/DashboardProfile'))
const DashboardSettings = lazy(() => import('../pages/user-dashboard/DashboardSettings'))
const DashboardWizards = lazy(() => import('../pages/user-dashboard/DashboardWizards'))
const DashboardWizardDetails = lazy(() => import('../pages/user-dashboard/DashboardWizardDetails'))
const CounselTopUpPayment = lazy(() => import('../pages/user-dashboard/CounselTopUpPayment'))
const BlueprintTopUpPayment = lazy(() => import('../pages/user-dashboard/BlueprintTopUpPayment'))
const WizardCatalogue = lazy(() => import('../pages/WizardCatalogue'))
const WizardDetails = lazy(() => import('../pages/WizardDetails'))

function HomeOrRedirect() {
  try {
    if (localStorage.getItem('tsl-authenticated') === 'true') {
      const raw = localStorage.getItem('tsl-auth-user')
      if (raw) {
        const user = JSON.parse(raw) as { portal?: string; role?: string }
        if (user.portal === 'admin' || user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
        if (user.portal === 'counsel') return <Navigate to="/counsel/dashboard" replace />
        return <Navigate to="/dashboard" replace />
      }
    }
  } catch {
    // fall through to Home
  }
  return <Home />
}

function getDashboardSection(pathname: string): DashboardSection {
  if (pathname.startsWith('/dashboard/counsel')) return 'Counsel'
  if (pathname.startsWith('/dashboard/notifications')) return 'Notifications'
  if (pathname.startsWith('/dashboard/playbooks')) return 'Playbooks'
  if (pathname.startsWith('/dashboard/profile')) return 'Profile'
  if (pathname.startsWith('/dashboard/settings')) return 'Settings'
  if (pathname.startsWith('/dashboard/blueprints') || pathname.startsWith('/dashboard/wizard-details')) return 'Blueprints'
  return 'Dashboard'
}

/**
 * Lazy route chunks are not immediately available after a hard refresh. Render
 * the destination portal's chrome while that code is downloaded, rather than
 * briefly replacing the current route with the generic blue application splash.
 */
function RouteLoadingFallback() {
  const { pathname } = useLocation()

  if (pathname.startsWith('/dashboard')) {
    const section = getDashboardSection(pathname)
    return (
      <DashboardShell activeSection={section}>
        <main className="user-dashboard__loading-page" aria-busy="true" aria-live="polite">
          <div className="user-dashboard__loading-card" role="status">
            <span className="user-dashboard__loading-icon" aria-hidden="true"><Loader2 size={32} /></span>
            <div>
              <h2>Loading {section}</h2>
              <p>Preparing your page…</p>
            </div>
          </div>
        </main>
      </DashboardShell>
    )
  }

  return (
    <div className="grid min-h-screen place-items-center bg-white text-slate-800">
      <span className="rounded-full bg-slate-100 px-5 py-3 text-sm font-bold">Loading TSL…</span>
    </div>
  )
}

export function AppRoutes() {
  return (
    <CounselRequestProvider>
    <UserProfileProvider>
    <NotificationProvider>
    <Suspense
      fallback={<RouteLoadingFallback />}
    >
      <Routes>
        <Route element={<RootLayout />}>
          {/* Public marketing routes — redirect authenticated users to their portal */}
          <Route index element={<HomeOrRedirect />} />
          <Route path="about" element={<About />} />
          <Route path="features" element={<Features />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="contact" element={<Contact />} />
          <Route path="counsel" element={<Counsel />} />
          <Route path="playbooks-insights" element={<PlaybooksInsights />} />
          <Route path="wizard-catalogue" element={<WizardCatalogue />} />
          <Route path="wizard-details" element={<WizardDetails />} />

          {/* Password reset flow — public */}
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password"  element={<ResetPassword />} />
          <Route path="reset-success"   element={<ResetSuccess />} />

          {/* Counsel login is public */}
          <Route path="counsel/login" element={<CounselLogin />} />
          <Route path="counsel/email-sent" element={<CounselEmailSent />} />
          <Route path="counsel/reset-password" element={<CounselResetPassword />} />

          {/* Protected routes — require authentication */}
          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="dashboard/counsel" element={<DashboardCounsel />} />
            <Route path="dashboard/counsel/topup" element={<CounselTopUpPayment />} />
            <Route path="dashboard/blueprint-topup" element={<BlueprintTopUpPayment />} />
            <Route path="dashboard/notifications" element={<DashboardNotifications />} />
            <Route path="dashboard/playbooks" element={<DashboardPlaybooks />} />
            <Route path="dashboard/profile" element={<DashboardProfile />} />
            <Route path="dashboard/settings" element={<DashboardSettings />} />
            <Route path="dashboard/blueprints" element={<DashboardWizards />} />
            <Route path="dashboard/wizard-details" element={<DashboardWizardDetails />} />
            <Route path="admin/dashboard" element={<AdminDashboard />} />
            <Route path="admin/dashboard/users" element={<AdminDashboard />} />
            <Route path="admin/dashboard/counsel" element={<AdminDashboard />} />
            <Route path="admin/dashboard/counsel-requests" element={<AdminDashboard />} />
            <Route path="admin/dashboard/issues" element={<AdminDashboard />} />
            <Route path="admin/dashboard/settings" element={<AdminDashboard />} />
            <Route path="admin/dashboard/profile" element={<AdminDashboard />} />
            <Route element={<CounselAvailabilityProvider><Outlet /></CounselAvailabilityProvider>}>
              <Route path="counsel/dashboard" element={<CounselPortal mode="dashboard" />} />
              <Route path="counsel/requests" element={<CounselPortal mode="requests" />} />
              <Route path="counsel/profile" element={<CounselProfile />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </Suspense>
    </NotificationProvider>
    </UserProfileProvider>
    </CounselRequestProvider>
  )
}
