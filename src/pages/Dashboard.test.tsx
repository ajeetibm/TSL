import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from './Dashboard'
import type { DashboardData } from '../services/dashboardTypes'

// Mock dependencies
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
  }
})

// Mock API
const mockDashboardData: DashboardData = {
  user: {
    userId: 'user-123',
    companyName: 'Test Company',
    plan: 'operator',
    runsRemaining: 8,
    runsTotal: 12,
    runsUsed: 4,
  },
  inProgress: [
    {
      workflowId: 'wf-1',
      wizardName: 'Employment Contract',
      status: 'in_progress',
      progress: 45,
      lastUpdated: '2024-01-15T10:00:00Z',
    },
  ],
  completed: [
    {
      workflowId: 'wf-2',
      wizardName: 'NDA Agreement',
      status: 'completed',
      completedAt: '2024-01-10T15:30:00Z',
      downloads: ['nda.pdf'],
    },
  ],
}

vi.mock('../services/tslApi', () => ({
  smeApi: {
    dashboard: vi.fn(() =>
      Promise.resolve({
        success: true,
        data: mockDashboardData,
      })
    ),
  },
}))

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  )
}

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    renderDashboard()
    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument()
  })

  it('displays loading state initially', () => {
    renderDashboard()
    expect(screen.getByText(/loading dashboard data/i)).toBeInTheDocument()
  })

  it('displays welcome message with plan information', async () => {
    renderDashboard()
    
    await waitFor(() => {
      expect(screen.getByText(/welcome to the startup legal/i)).toBeInTheDocument()
    })
    
    expect(screen.getByText(/operator plan/i)).toBeInTheDocument()
  })

  it('displays plan benefits', async () => {
    renderDashboard()
    
    await waitFor(() => {
      expect(screen.getByText(/12 wizard runs per month/i)).toBeInTheDocument()
    })
    
    expect(screen.getByText(/access to all legal wizards/i)).toBeInTheDocument()
    expect(screen.getByText(/priority support/i)).toBeInTheDocument()
    expect(screen.getByText(/legal counsel credits/i)).toBeInTheDocument()
  })

  it('displays quick start cards', async () => {
    renderDashboard()
    
    await waitFor(() => {
      expect(screen.getByText(/getting started guide/i)).toBeInTheDocument()
    })
    
    expect(screen.getByText(/video tutorials/i)).toBeInTheDocument()
    expect(screen.getByText(/schedule consultation/i)).toBeInTheDocument()
  })

  it('displays workflow statistics', async () => {
    renderDashboard()
    
    await waitFor(() => {
      expect(screen.getByText(/2 workflows/i)).toBeInTheDocument()
    })
    
    expect(screen.getByText(/8 runs left/i)).toBeInTheDocument()
  })

  it('displays in-progress workflows', async () => {
    renderDashboard()
    
    await waitFor(() => {
      expect(screen.getByText(/employment contract/i)).toBeInTheDocument()
    })
    
    expect(screen.getByText(/45%/)).toBeInTheDocument()
    expect(screen.getByText(/in progress/i)).toBeInTheDocument()
  })

  it('displays completed workflows', async () => {
    renderDashboard()
    
    await waitFor(() => {
      expect(screen.getByText(/nda agreement/i)).toBeInTheDocument()
    })
    
    expect(screen.getByText(/completed/i)).toBeInTheDocument()
    expect(screen.getByText(/1 files/i)).toBeInTheDocument()
  })

  it('displays quick actions sidebar', async () => {
    renderDashboard()
    
    await waitFor(() => {
      expect(screen.getByText(/quick actions/i)).toBeInTheDocument()
    })
    
    expect(screen.getByText(/browse all wizards/i)).toBeInTheDocument()
    expect(screen.getByText(/book legal counsel/i)).toBeInTheDocument()
    expect(screen.getByText(/view playbooks/i)).toBeInTheDocument()
  })

  it('displays legal notices', async () => {
    renderDashboard()
    
    await waitFor(() => {
      expect(screen.getByText(/legal notices/i)).toBeInTheDocument()
    })
    
    expect(screen.getByText(/terms of service/i)).toBeInTheDocument()
    expect(screen.getByText(/privacy & popia compliance/i)).toBeInTheDocument()
    expect(screen.getByText(/legal advice disclaimer/i)).toBeInTheDocument()
  })

  it('navigates to wizards page when Browse Wizards is clicked', async () => {
    renderDashboard()
    
    await waitFor(() => {
      expect(screen.getByText(/browse wizards/i)).toBeInTheDocument()
    })
    
    const browseButton = screen.getByRole('button', { name: /browse wizards/i })
    browseButton.click()
    
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/wizards')
  })

  it('navigates to counsel page when Book Legal Counsel is clicked', async () => {
    renderDashboard()
    
    await waitFor(() => {
      expect(screen.getByText(/book legal counsel/i)).toBeInTheDocument()
    })
    
    const counselButton = screen.getByRole('button', { name: /book legal counsel/i })
    counselButton.click()
    
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/counsel')
  })

  it('navigates to playbooks page when View Playbooks is clicked', async () => {
    renderDashboard()
    
    await waitFor(() => {
      expect(screen.getByText(/view playbooks/i)).toBeInTheDocument()
    })
    
    const playbooksButton = screen.getByRole('button', { name: /view playbooks/i })
    playbooksButton.click()
    
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/playbooks')
  })

  it('displays message when no workflows exist', async () => {
    const { smeApi } = await import('../services/tslApi')
    vi.mocked(smeApi.dashboard).mockResolvedValueOnce({
      success: true,
      data: {
        ...mockDashboardData,
        inProgress: [],
        completed: [],
      },
    })
    
    renderDashboard()
    
    await waitFor(() => {
      expect(screen.getByText(/no workflows yet/i)).toBeInTheDocument()
    })
  })

  it('displays error message when API fails', async () => {
    const { smeApi } = await import('../services/tslApi')
    vi.mocked(smeApi.dashboard).mockResolvedValueOnce({
      success: false,
      message: 'Failed to load dashboard data.',
    })
    
    renderDashboard()
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/failed to load dashboard data/i)
    })
  })

  it('has accessible structure', () => {
    const { container } = renderDashboard()
    expect(container.firstChild).toBeTruthy()
  })

  it('renders with DashboardShell wrapper', () => {
    renderDashboard()
    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument()
  })
})

// Made with Bob
