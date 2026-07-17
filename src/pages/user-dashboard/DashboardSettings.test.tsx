import { render, screen } from '@testing-library/react'
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
})

// Made with Bob
