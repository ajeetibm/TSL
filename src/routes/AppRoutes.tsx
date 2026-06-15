import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { RootLayout } from '../layouts/RootLayout'

const Home = lazy(() => import('../pages/Home'))
const About = lazy(() => import('../pages/About'))
const Features = lazy(() => import('../pages/Features'))
const Pricing = lazy(() => import('../pages/Pricing'))
const Contact = lazy(() => import('../pages/Contact'))
const Dashboard = lazy(() => import('../pages/Dashboard'))
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
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="wizard-catalogue" element={<WizardCatalogue />} />
          <Route path="wizard-details" element={<WizardDetails />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
