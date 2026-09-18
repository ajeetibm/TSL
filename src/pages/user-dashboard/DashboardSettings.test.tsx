import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import DashboardSettings from './DashboardSettings'

vi.mock('../../components/dashboard/DashboardShell', () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-shell">{children}</div>
  ),
}))

vi.mock('../../services/metadata', () => ({
  setPageMetadata: vi.fn(),
}))

vi.mock('../../services/tslApi', () => ({
  billingApi: {
    paymentMethods: vi.fn().mockResolvedValue({ success: true, data: [] }),
    addPaymentMethod: vi.fn().mockResolvedValue({ success: false }),
    setDefaultMethod: vi.fn().mockResolvedValue({ success: false }),
  },
  paymentApi: {
    invoices: vi.fn().mockResolvedValue({ success: false }),
  },
}))

vi.mock('../../services/paystackClient', () => ({
  openPaystackCheckout: vi.fn().mockResolvedValue({ status: 'cancelled' }),
}))

vi.mock('../../hooks/useBillingSubscription', () => ({
  useBillingSubscription: () => ({
    subscription: {
      planId: 'launchpad',
      planName: 'Launchpad',
      price: 499,
      currency: 'ZAR',
      tagline: 'Perfect for solo founders getting started',
      wizardRuns: 4,
      teamMembers: 1,
      usage: {
        // Lifetime usage is deliberately larger than the active top-up pool.
        runsUsed: 6,
        runsTotal: 4,
        runsRemaining: 4,
        topUpRunsPurchased: 6,
        topUpRunsRemaining: 4,
        teamMembers: 1,
      },
      nextBillingDate: '2026-10-18',
      paymentMethod: null,
      pendingDowngrade: null,
      counselCreditsTotal: 1,
      counselCreditsRemaining: 1,
    },
    subLoading: false,
    subError: null,
    plans: [],
    plansLoading: false,
    plansError: null,
    upgradePreview: null,
    previewLoading: false,
    previewError: null,
    selectedPlan: null,
    upgradeResult: null,
    activeModal: 'none',
    closeModal: vi.fn(),
    toast: null,
    actionLoading: false,
    actionError: null,
    invoices: [],
    invoicesLoading: false,
    invoicesError: null,
    openUpgradePlans: vi.fn(),
    openComparePlans: vi.fn(),
    selectPlan: vi.fn(),
    confirmUpgrade: vi.fn(),
    confirmDowngrade: vi.fn(),
    cancelUpgradeConfirm: vi.fn(),
    cancelDowngradeConfirm: vi.fn(),
    cancelDowngrade: vi.fn(),
    openCancelDowngradeConfirm: vi.fn(),
  }),
}))

const renderDashboardSettings = () => {
  return render(
    <BrowserRouter>
      <DashboardSettings />
    </BrowserRouter>
  )
}

describe('DashboardSettings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    renderDashboardSettings()
    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument()
  })

  it('displays page header', () => {
    renderDashboardSettings()
    expect(screen.getByRole('heading', { name: /^settings$/i })).toBeInTheDocument()
    expect(screen.getByText(/manage your account, billing, and notification preferences/i)).toBeInTheDocument()
  })

  it('displays billing and history tabs', () => {
    renderDashboardSettings()

    expect(screen.getByRole('button', { name: /billing & subscription/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /billing history/i })).toBeInTheDocument()
  })

  it('shows billing tab by default', () => {
    renderDashboardSettings()
    expect(screen.getAllByText(/payment methods/i).length).toBeGreaterThan(0)
  })

  it('has accessible structure', () => {
    const { container } = renderDashboardSettings()
    expect(container.firstChild).toBeTruthy()
  })

  it('renders with DashboardShell wrapper', () => {
    renderDashboardSettings()
    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument()
  })

  it('uses the active top-up credit pool for current billing-cycle usage', async () => {
    localStorage.setItem('tsl-wizard-access-cache', JSON.stringify({ hasSubscription: true }))
    renderDashboardSettings()

    await waitFor(() => {
      expect(screen.getByText('Credits Used')).toBeInTheDocument()
      expect(screen.getByText('2 of 6')).toBeInTheDocument()
      expect(screen.getByText('4 credits remaining')).toBeInTheDocument()
    })
  })
})

// Made with Bob
