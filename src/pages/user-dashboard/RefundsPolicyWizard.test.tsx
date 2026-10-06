import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RefundsPolicyWizard from './RefundsPolicyWizard'
import * as tslApi from '../../services/tslApi'

const mockProfile = {
  companySnapshotId: 'snap-123',
  entityType: 'Company',
  legalName: 'Acme South Africa (Pty) Ltd',
  tradingName: 'Acme SA',
  registrationNumber: '2023/123456/07',
  businessEmail: 'refunds@acme.co.za',
  email: 'admin@acme.co.za',
  businessPhone: '+27 11 000 0000',
  individualFullNames: '',
  idNumber: '',
  streetName: 'Main Road',
  unitNumber: '1',
  building: 'Acme House',
  suburb: 'Rosebank',
  city: 'Johannesburg',
  province: 'Gauteng',
  postalCode: '2196',
  country: 'South Africa',
  signatoryName: 'John Doe',
  signatoryCapacity: 'Director',
}

vi.mock('../../context/UserProfileContext', () => ({
  useUserProfile: () => ({
    profile: mockProfile,
    updateProfile: vi.fn(),
  }),
}))

describe('RefundsPolicyWizard', () => {
  const onClose = vi.fn()
  const onComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(tslApi, 'request').mockResolvedValue({ success: true, data: { status: 'generated' } })
  })

  it('renders the wizard modal with Step 1 by default', () => {
    render(<RefundsPolicyWizard onClose={onClose} onComplete={onComplete} />)

    expect(screen.getByRole('heading', { name: /REFUNDS POLICY/i })).toBeInTheDocument()
    expect(screen.getByText(/Business and products/i)).toBeInTheDocument()
    expect(screen.getByText(/Step 1 of 3/i)).toBeInTheDocument()
  })

  it('allows confirming company snapshot', () => {
    render(<RefundsPolicyWizard onClose={onClose} onComplete={onComplete} />)

    const confirmBtn = screen.getByRole('button', { name: /CONFIRM/i })
    fireEvent.click(confirmBtn)
    expect(screen.getByRole('button', { name: /Confirmed/i })).toBeInTheDocument()
  })

  it('shows 4 steps when Subscriptions is selected as a product type', () => {
    render(<RefundsPolicyWizard onClose={onClose} onComplete={onComplete} />)

    // Click "Subscriptions" chip
    const subscriptionsChip = screen.getByRole('button', { name: /^Subscriptions$/i })
    fireEvent.click(subscriptionsChip)

    expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument()
  })

  it('validates Step 1 required fields when next is clicked', () => {
    render(
      <RefundsPolicyWizard
        onClose={onClose}
        onComplete={onComplete}
        initialData={{
          companyId: '',
          company: '',
          companyConfirmed: false,
          refundsEmail: 'invalid-email',
          productTypes: [],
          salesChannel: '',
          offersRefunds: 'Yes',
          refundDays: '14',
          refundCondition: [],
          digitalExclusions: [],
          servicesExclusion: 'Yes',
          returnShipping: 'Customer unless faulty',
          cancellationApproach: 'Cancel any time, access continues to period end',
          cancellationNoticeDays: '',
          prorataRefund: 'No',
          refundProcess: 'Email',
          refundInfoRequired: [],
          refundProcessingDays: '10',
          refundMethod: 'Original payment method',
          effectiveDate: '2026-03-31',
        }}
      />,
    )

    const nextBtn = screen.getByRole('button', { name: /Next Step/i })
    fireEvent.click(nextBtn)

    expect(screen.getByText(/Confirm your Company Snapshot before continuing/i)).toBeInTheDocument()
    expect(screen.getByText(/Enter a valid email address/i)).toBeInTheDocument()
    expect(screen.getByText(/Select at least one product type/i)).toBeInTheDocument()
  })

  it('navigates to Step 2 and displays gate warning when offersRefunds is No', () => {
    render(
      <RefundsPolicyWizard
        onClose={onClose}
        onComplete={onComplete}
        initialStep={2}
        initialData={{
          companyId: 'snap-123',
          company: 'Acme South Africa (Pty) Ltd',
          companyConfirmed: true,
          refundsEmail: 'refunds@acme.co.za',
          productTypes: ['Physical goods', 'Digital downloads', 'Services'],
          salesChannel: 'Website only',
          offersRefunds: 'No',
          refundDays: '14',
          refundCondition: ['Unused and in original packaging'],
          digitalExclusions: ['No refund once downloaded'],
          servicesExclusion: 'Yes',
          returnShipping: 'Customer unless faulty',
          cancellationApproach: 'Cancel any time, access continues to period end',
          cancellationNoticeDays: '',
          prorataRefund: 'No',
          refundProcess: 'Email',
          refundInfoRequired: ['Order number'],
          refundProcessingDays: '10',
          refundMethod: 'Original payment method',
          effectiveDate: '2026-03-31',
        }}
      />,
    )

    expect(screen.getByText(/Statutory rights cannot be excluded/i)).toBeInTheDocument()
    expect(screen.getByText(/Digital download exclusions/i)).toBeInTheDocument()
    expect(screen.getByText(/Services already performed/i)).toBeInTheDocument()
    expect(screen.getByText(/Who pays return shipping/i)).toBeInTheDocument()
  })

  it('shows cooling-off representation information when offersRefunds is Yes', () => {
    render(
      <RefundsPolicyWizard
        onClose={onClose}
        onComplete={onComplete}
        initialStep={2}
        initialData={{
          companyId: 'snap-123',
          company: 'Acme South Africa (Pty) Ltd',
          companyConfirmed: true,
          refundsEmail: 'refunds@acme.co.za',
          productTypes: ['Physical goods'],
          salesChannel: 'Website only',
          offersRefunds: 'Yes',
          refundDays: '14',
          refundCondition: ['Unused and in original packaging', 'Any reason within the window'],
          digitalExclusions: [],
          servicesExclusion: 'Yes',
          returnShipping: 'Customer unless faulty',
          cancellationApproach: 'Cancel any time, access continues to period end',
          cancellationNoticeDays: '',
          prorataRefund: 'No',
          refundProcess: 'Email',
          refundInfoRequired: ['Order number'],
          refundProcessingDays: '10',
          refundMethod: 'Original payment method',
          effectiveDate: '2026-03-31',
        }}
      />,
    )

    expect(screen.getByText(/Cooling-off representations/i)).toBeInTheDocument()
    expect(screen.getByText(/A refund for any reason within the window is a voluntary promise/i)).toBeInTheDocument()
  })

  it('navigates through Cancellations and Process to Preview and Submits', async () => {
    render(
      <RefundsPolicyWizard
        onClose={onClose}
        onComplete={onComplete}
        initialStep={1}
        initialData={{
          companyId: 'snap-123',
          company: 'Acme South Africa (Pty) Ltd',
          companyConfirmed: true,
          refundsEmail: 'refunds@acme.co.za',
          productTypes: ['Subscriptions', 'Physical goods'],
          salesChannel: 'Website only',
          offersRefunds: 'Yes',
          refundDays: '14',
          refundCondition: ['Unused and in original packaging'],
          digitalExclusions: [],
          servicesExclusion: 'Yes',
          returnShipping: 'Customer unless faulty',
          cancellationApproach: 'Cancel any time, access continues to period end',
          cancellationNoticeDays: '',
          prorataRefund: 'No',
          refundProcess: 'Email',
          refundInfoRequired: ['Order number', 'Proof of purchase'],
          refundProcessingDays: '10',
          refundMethod: 'Original payment method',
          effectiveDate: '2026-03-31',
        }}
      />,
    )

    // Step 1 -> Step 2
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }))
    expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument()

    // Step 2 -> Step 3 (Cancellations)
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }))
    expect(screen.getByText(/Step 3 of 4/i)).toBeInTheDocument()
    expect(screen.getByText(/Cancellation approach/i)).toBeInTheDocument()

    // Step 3 -> Step 4 (Process)
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }))
    expect(screen.getByText(/Step 4 of 4/i)).toBeInTheDocument()
    expect(screen.getByText(/How to request a refund/i)).toBeInTheDocument()

    // Step 4 -> Preview
    fireEvent.click(screen.getByRole('button', { name: /Preview/i }))
    expect(screen.getByText(/Business and products/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Generate Policy/i })).toBeInTheDocument()

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Generate Policy/i }))

    await waitFor(() => {
      expect(tslApi.request).toHaveBeenCalledWith(
        '/api/v1/sme/refunds-policy/submit',
        'POST',
        expect.objectContaining({
          company: 'Acme South Africa (Pty) Ltd',
          offersRefunds: 'Yes',
          refundProcess: 'Email',
        }),
      )
      expect(onComplete).toHaveBeenCalled()
      expect(screen.getByText(/Refunds Policy generated/i)).toBeInTheDocument()
    })
  })
})
