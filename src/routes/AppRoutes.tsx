import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { RootLayout } from '../layouts/RootLayout'

const Home = lazy(() => import('../pages/Home'))
const About = lazy(() => import('../pages/About'))
const Features = lazy(() => import('../pages/Features'))
const Pricing = lazy(() => import('../pages/Pricing'))
const Contact = lazy(() => import('../pages/Contact'))
const AdminDashboard = lazy(() => import('../pages/admin-dashboard/AdminDashboard'))
const CounselLogin = lazy(() => import('../pages/counsel-portal/CounselLogin'))
const CounselPortal = lazy(() => import('../pages/counsel-portal/CounselPortal'))
const CounselProfile = lazy(() => import('../pages/counsel-portal/CounselProfile'))
const CounselResetPassword = lazy(() => import('../pages/counsel-portal/CounselResetPassword'))
const Dashboard = lazy(() => import('../pages/user-dashboard/Dashboard'))
const DashboardCounsel = lazy(() => import('../pages/user-dashboard/DashboardCounsel'))
const DashboardNotifications = lazy(() => import('../pages/user-dashboard/DashboardNotifications'))
const DashboardPlaybooks = lazy(() => import('../pages/user-dashboard/DashboardPlaybooks'))
const DashboardProfile = lazy(() => import('../pages/user-dashboard/DashboardProfile'))
const DashboardSettings = lazy(() => import('../pages/user-dashboard/DashboardSettings'))
const DashboardWizards = lazy(() => import('../pages/user-dashboard/DashboardWizards'))
const DashboardWizardDetails = lazy(() => import('../pages/user-dashboard/DashboardWizardDetails'))
const WizardCatalogue = lazy(() => import('../pages/WizardCatalogue'))
const WizardDetails = lazy(() => import('../pages/WizardDetails'))

export function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-navy-primary text-white">
          <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-bold">Loading TSL...</span>
        </div>
      }
    >
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="features" element={<Features />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="contact" element={<Contact />} />
          <Route path="admin/dashboard" element={<AdminDashboard />} />
          <Route path="counsel/login" element={<CounselLogin />} />
          <Route path="counsel/dashboard" element={<CounselPortal mode="dashboard" />} />
          <Route path="counsel/reset-password" element={<CounselResetPassword />} />
          <Route path="counsel/requests" element={<CounselPortal mode="requests" />} />
          <Route path="counsel/profile" element={<CounselProfile />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="dashboard/counsel" element={<DashboardCounsel />} />
          <Route path="dashboard/notifications" element={<DashboardNotifications />} />
          <Route path="dashboard/playbooks" element={<DashboardPlaybooks />} />
          <Route path="dashboard/profile" element={<DashboardProfile />} />
          <Route path="dashboard/settings" element={<DashboardSettings />} />
          <Route path="dashboard/wizards" element={<DashboardWizards />} />
          <Route path="dashboard/wizard-details" element={<DashboardWizardDetails />} />
          <Route path="wizard-catalogue" element={<WizardCatalogue />} />
          <Route path="wizard-details" element={<WizardDetails />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
