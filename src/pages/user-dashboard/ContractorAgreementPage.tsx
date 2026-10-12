import { useNavigate } from 'react-router-dom'
import { DashboardShell } from '../../components/dashboard/DashboardShell'
import ContractorAgreementWizard from './ContractorAgreementWizard'

export default function ContractorAgreementPage() {
  const navigate = useNavigate()
  return (
    <DashboardShell activeSection="Blueprints">
      <ContractorAgreementWizard
        onClose={() => navigate('/dashboard')}
        onComplete={() => navigate('/dashboard')}
      />
    </DashboardShell>
  )
}
