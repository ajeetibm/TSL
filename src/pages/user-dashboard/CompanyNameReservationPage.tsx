import { useNavigate } from 'react-router-dom'
import { DashboardShell } from '../../components/dashboard/DashboardShell'
import CompanyNameReservationWizard from './CompanyNameReservationWizard'

export default function CompanyNameReservationPage() {
  const navigate = useNavigate()
  return <DashboardShell activeSection="Blueprints"><CompanyNameReservationWizard onClose={() => navigate('/dashboard')} onComplete={() => navigate('/dashboard')} /></DashboardShell>
}
