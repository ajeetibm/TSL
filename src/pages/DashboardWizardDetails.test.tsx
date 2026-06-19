import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import DashboardWizardDetails from './DashboardWizardDetails'

vi.mock('../components/dashboard/DashboardShell', () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-shell">{children}</div>
  ),
}))

vi.mock('../services/metadata', () => ({
  setPageMetadata: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      state: {
        selectedWizards: [
          { title: 'Non-Disclosure Agreement (NDA)', quantity: 2 },
          { title: 'Employment Offer Letter', quantity: 1 },
        ],
      },
    }),
  }
})

const renderDashboardWizardDetails = () => {
  return render(
    <BrowserRouter>
      <DashboardWizardDetails />
    </BrowserRouter>
  )
}

describe('DashboardWizardDetails Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders without crashing', () => {
    renderDashboardWizardDetails()
    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument()
  })

  it('displays page header', () => {
    renderDashboardWizardDetails()
    expect(screen.getByText(/wizard details/i)).toBeInTheDocument()
  })

  it('displays selected wizards from location state', () => {
    renderDashboardWizardDetails()
    
    expect(screen.getByText(/non-disclosure agreement/i)).toBeInTheDocument()
    expect(screen.getByText(/employment offer letter/i)).toBeInTheDocument()
  })

  it('has accessible structure', () => {
    const { container } = renderDashboardWizardDetails()
    expect(container.firstChild).toBeTruthy()
  })

  it('renders with DashboardShell wrapper', () => {
    renderDashboardWizardDetails()
    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument()
  })
})

// Made with Bob
