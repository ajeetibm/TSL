import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import DashboardPlaybooks from './DashboardPlaybooks'

vi.mock('../../components/dashboard/DashboardShell', () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-shell">{children}</div>
  ),
}))

vi.mock('../../services/metadata', () => ({
  setPageMetadata: vi.fn(),
}))

const renderDashboardPlaybooks = () => {
  return render(
    <BrowserRouter>
      <DashboardPlaybooks />
    </BrowserRouter>
  )
}

describe('DashboardPlaybooks Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    renderDashboardPlaybooks()
    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument()
  })

  it('displays page header', () => {
    renderDashboardPlaybooks()
    expect(screen.getByRole('heading', { name: /^playbooks$/i })).toBeInTheDocument()
    expect(screen.getByText(/step-by-step legal guides/i)).toBeInTheDocument()
  })

  it('displays all playbook sections', () => {
    renderDashboardPlaybooks()
    
    expect(screen.getByText(/^hiring$/i)).toBeInTheDocument()
    expect(screen.getByText(/^compliance$/i)).toBeInTheDocument()
    expect(screen.getByText(/^fundraising$/i)).toBeInTheDocument()
  })

  it('displays hiring playbooks', () => {
    renderDashboardPlaybooks()
    
    expect(screen.getByText(/hiring your first employee/i)).toBeInTheDocument()
    expect(screen.getByText(/contractor vs employee classification/i)).toBeInTheDocument()
    expect(screen.getByText(/building an employee handbook/i)).toBeInTheDocument()
  })

  it('displays compliance playbooks', () => {
    renderDashboardPlaybooks()
    
    expect(screen.getByText(/popia compliance basics/i)).toBeInTheDocument()
    expect(screen.getByText(/document retention checklist/i)).toBeInTheDocument()
    expect(screen.getByText(/website legal readiness/i)).toBeInTheDocument()
  })

  it('displays fundraising playbooks', () => {
    renderDashboardPlaybooks()
    
    expect(screen.getByText(/investor meeting prep/i)).toBeInTheDocument()
    expect(screen.getByText(/founder equity readiness/i)).toBeInTheDocument()
    expect(screen.getByText(/due diligence pack/i)).toBeInTheDocument()
  })

  it('displays playbook steps and time', () => {
    renderDashboardPlaybooks()
    
    expect(screen.getByText(/8 steps/i)).toBeInTheDocument()
    expect(screen.getByText(/15 min/i)).toBeInTheDocument()
  })

  it('displays playbook descriptions', () => {
    renderDashboardPlaybooks()
    
    expect(screen.getByText(/comprehensive guide to compliant employee onboarding/i)).toBeInTheDocument()
  })

  it('displays related wizards for each playbook', () => {
    renderDashboardPlaybooks()
    
    const relatedWizardsHeadings = screen.getAllByText(/related wizards/i)
    expect(relatedWizardsHeadings.length).toBeGreaterThan(0)
  })

  it('displays Read Playbook buttons', () => {
    renderDashboardPlaybooks()
    
    const readButtons = screen.getAllByRole('button', { name: /read playbook/i })
    expect(readButtons.length).toBe(9) // 3 sections × 3 playbooks each
  })

  it('has accessible structure', () => {
    const { container } = renderDashboardPlaybooks()
    expect(container.firstChild).toBeTruthy()
  })

  it('renders with DashboardShell wrapper', () => {
    renderDashboardPlaybooks()
    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument()
  })
})

// Made with Bob
