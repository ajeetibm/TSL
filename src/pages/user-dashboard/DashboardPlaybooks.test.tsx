import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import DashboardPlaybooks from './DashboardPlaybooks'
import userEvent from '@testing-library/user-event'

vi.mock('../../components/dashboard/DashboardShell', () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-shell">{children}</div>
  ),
}))

vi.mock('../../services/metadata', () => ({
  setPageMetadata: vi.fn(),
}))

vi.mock('../../services/tslApi', () => ({
  playbookApi: {
    playBookList: vi.fn().mockResolvedValue({ success: false }),
  },
}))

// react-pdf requires browser canvas APIs not available in jsdom
vi.mock('react-pdf', () => ({
  Document: ({ children, loading }: { children: React.ReactNode; loading: React.ReactNode }) =>
    children ?? loading,
  Page: () => <div data-testid="pdf-page" />,
  pdfjs: { GlobalWorkerOptions: { workerSrc: '' } },
}))

// Suppress pdfjs worker URL construction
vi.mock('../../assets/Sample_Life_Acceptance_Letter.pdf', () => ({
  default: 'sample.pdf',
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

  it('renders without crashing', async () => {
    renderDashboardPlaybooks()
    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText(/loading playbooks/i)).not.toBeInTheDocument())
  })

  it('displays page header', async () => {
    renderDashboardPlaybooks()
    expect(screen.getByRole('heading', { name: /^playbooks$/i })).toBeInTheDocument()
    expect(screen.getByText(/step-by-step legal guides/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText(/loading playbooks/i)).not.toBeInTheDocument())
  })

  it('displays all playbook sections', async () => {
    renderDashboardPlaybooks()
    
    expect(await screen.findByText(/^hiring$/i)).toBeInTheDocument()
    expect(await screen.findByText(/^compliance$/i)).toBeInTheDocument()
    expect(await screen.findByText(/^fundraising$/i)).toBeInTheDocument()
  })

  it('displays hiring playbooks', async () => {
    renderDashboardPlaybooks()
    
    expect(await screen.findByText(/hiring your first employee/i)).toBeInTheDocument()
    expect(await screen.findByText(/contractor vs employee classification/i)).toBeInTheDocument()
    expect(await screen.findByText(/building an employee handbook/i)).toBeInTheDocument()
  })

  it('displays compliance playbooks', async () => {
    renderDashboardPlaybooks()
    
    expect(await screen.findByText(/popia compliance basics/i)).toBeInTheDocument()
    expect(await screen.findByText(/document retention checklist/i)).toBeInTheDocument()
    expect(await screen.findByText(/website legal readiness/i)).toBeInTheDocument()
  })

  it('displays fundraising playbooks', async () => {
    renderDashboardPlaybooks()
    
    expect(await screen.findByText(/investor meeting prep/i)).toBeInTheDocument()
    expect(await screen.findByText(/founder equity readiness/i)).toBeInTheDocument()
    expect(await screen.findByText(/due diligence pack/i)).toBeInTheDocument()
  })

  it('displays playbook steps and time', async () => {
    renderDashboardPlaybooks()
    
    await waitFor(() => {
      expect(screen.getAllByText(/8 steps/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/15 min/i).length).toBeGreaterThan(0)
    })
  })

  it('displays playbook descriptions', async () => {
    renderDashboardPlaybooks()
    
    expect(await screen.findByText(/comprehensive guide to compliant employee onboarding/i)).toBeInTheDocument()
  })

  it('displays related wizards for each playbook', async () => {
    renderDashboardPlaybooks()
    
    await waitFor(() => {
      const relatedWizardsHeadings = screen.getAllByText(/related wizards/i)
      expect(relatedWizardsHeadings.length).toBeGreaterThan(0)
    })
  })

  it('displays Read Playbook buttons', async () => {
    renderDashboardPlaybooks()
    
    await waitFor(() => {
      const readButtons = screen.getAllByRole('button', { name: /read playbook/i })
      expect(readButtons.length).toBe(9) // 3 sections × 3 playbooks each
    })
  })

  it('has accessible structure', async () => {
    const { container } = renderDashboardPlaybooks()
    expect(container.firstChild).toBeTruthy()
    await waitFor(() => expect(screen.queryByText(/loading playbooks/i)).not.toBeInTheDocument())
  })

  it('renders with DashboardShell wrapper', async () => {
    renderDashboardPlaybooks()
    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText(/loading playbooks/i)).not.toBeInTheDocument())
  })

  it('Read playbook button is clickable and opens a PDF modal', async () => {
    const user = userEvent.setup()
    renderDashboardPlaybooks()

    // Wait for sections to load, then click the first "Read Playbook" button
    const readButtons = await screen.findAllByRole('button', { name: /read playbook/i })
    await user.click(readButtons[0])

    // The PDF modal dialog should now be visible
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toBeInTheDocument()

    // Modal title (inside the dialog) matches the clicked playbook
    expect(dialog.querySelector('.pdf-modal__title')).toHaveTextContent(/hiring your first employee/i)
  })

  it('PDF modal can be closed via the close button', async () => {
    const user = userEvent.setup()
    renderDashboardPlaybooks()

    // Open the modal
    const readButtons = await screen.findAllByRole('button', { name: /read playbook/i })
    await user.click(readButtons[0])
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // Close the modal
    await user.click(screen.getByRole('button', { name: /close/i }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})

// Made with Bob
