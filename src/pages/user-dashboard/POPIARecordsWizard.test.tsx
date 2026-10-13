import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import POPIARecordsWizard from './POPIARecordsWizard'
import type { POPIARecordsData } from './POPIARecordsWizard'
import { PP_EMPTY_DATA } from '../../hooks/usePrivacyPolicyWizard'
import type { PrivacyPolicyWizardData } from '../../hooks/usePrivacyPolicyWizard'

const mockProfile = {
  entityType: 'Company',
  legalName: 'Acme South Africa (Pty) Ltd',
  businessEmail: 'privacy@acme.co.za',
  email: 'admin@acme.co.za',
  individualFullNames: '',
}

vi.mock('../../context/UserProfileContext', () => ({
  useUserProfile: () => ({ profile: mockProfile, updateProfile: vi.fn() }),
}))

const completedPrivacyPolicy: PrivacyPolicyWizardData = {
  ...PP_EMPTY_DATA,
  responsibleParty: 'Acme South Africa (Pty) Ltd',
  officerFullNames: 'Jane Officer',
  privacyEmail: 'privacy@acme.co.za',
  domains: ['www.acme.co.za'],
  piCategories: ['Contact details'],
  purposes: [{ purpose: 'Billing', categories: 'Contact details', basis: 'Necessary for a contract', liStatement: '' }],
  retention: [{ category: 'Contact details', period: '5 years', reason: 'Tax law' }],
  thirdParties: [{ name: 'Stripe', purpose: 'Payments', country: 'Ireland' }],
  cookies: [{ name: 'session', purpose: 'Login', duration: 'Session', necessary: 'Yes' }],
  dsrChannel: 'requests@acme.co.za',
  dsrDays: '30',
  securitySummary: ['Encryption at rest'],
  effectiveDate: '2025-01-01',
}

// Draft saved when the user closed POPIA before completing the Privacy policy:
// every inherited field is empty.
const staleDraft = {
  inheritedConfirmed: true,
  responsibleParty: 'Acme South Africa (Pty) Ltd',
  infoOfficer: '',
  privacyEmail: 'privacy@acme.co.za',
  domains: '',
  piCategories: [],
  specialPi: [],
  specialPiBasis: '',
  childrenData: '',
  childrenConsent: '',
  purposes: '',
  purposesBasis: '',
  retention: '',
  thirdParties: '',
  crossBorder: '',
  crossBorderCountries: '',
  transferBasis: '',
  directMarketing: '',
  cookies: '',
  cookieConsent: '',
  analyticsProvider: '',
  dsrChannel: '',
  dsrDays: '',
  securitySummary: [],
  effectiveDate: '',
  activities: [],
  operators: [],
  generateOperatorAgreements: '',
  breachOwner: {} as POPIARecordsData['breachOwner'],
  breachEscalation: {} as POPIARecordsData['breachEscalation'],
  dsrOwner: '',
  securityMeasures: [],
  paiaManual: '',
} as unknown as POPIARecordsData

describe('POPIARecordsWizard inheritance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // jsdom does not implement Element.scrollTo, which the wizard calls on step change.
    Element.prototype.scrollTo = vi.fn()
  })

  it('inherits the completed Privacy & Cookies Policy on a fresh run', () => {
    render(<POPIARecordsWizard onClose={vi.fn()} onComplete={vi.fn()} privacyPolicyData={completedPrivacyPolicy} />)

    expect(screen.getByText('Jane Officer')).toBeInTheDocument()
    expect(screen.getByText('www.acme.co.za')).toBeInTheDocument()
  })

  it('refreshes a draft started before the Privacy policy was completed and allows proceeding', () => {
    render(
      <POPIARecordsWizard
        onClose={vi.fn()}
        onComplete={vi.fn()}
        initialData={staleDraft}
        privacyPolicyData={completedPrivacyPolicy}
      />,
    )

    // Previously these stayed as "—" because the empty draft overrode the policy.
    expect(screen.getByText('Jane Officer')).toBeInTheDocument()
    expect(screen.getByText('www.acme.co.za')).toBeInTheDocument()

    // The stale confirmation is reset, so the user must re-confirm, then can proceed.
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }))
    expect(screen.getByText(/Confirm the inherited inputs to continue/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }))
    expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument()
  })
})
