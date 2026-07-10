import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import DashboardCounsel from './DashboardCounsel'
import { CounselRequestProvider } from '../../context/CounselRequestContext'

// Mock DashboardShell
vi.mock('../../components/dashboard/DashboardShell', () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-shell">{children}</div>
  ),
}))

vi.mock('../../services/metadata', () => ({
  setPageMetadata: vi.fn(),
}))

// Mock counselApi so we don't make real HTTP calls during tests
vi.mock('../../services/tslApi', () => ({
  counselApi: {
    credits: vi.fn().mockResolvedValue({ success: false }),
    requests: vi.fn().mockResolvedValue({ success: false }),
    createRequest: vi.fn().mockResolvedValue({ success: false }),
    topUpCredits: vi.fn().mockResolvedValue({ success: false }),
  },
}))

const renderDashboardCounsel = () => {
  return render(
    <BrowserRouter>
      <CounselRequestProvider>
        <DashboardCounsel />
      </CounselRequestProvider>
    </BrowserRouter>
  )
}

describe('DashboardCounsel Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    renderDashboardCounsel()
    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument()
  })

  it('displays page header', () => {
    renderDashboardCounsel()
    expect(screen.getByRole('heading', { name: /^counsel$/i, level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/connect with experienced attorneys/i)).toBeInTheDocument()
  })

  it('displays counsel credit statistics', () => {
    renderDashboardCounsel()
    
    expect(screen.getAllByText(/2/).length).toBeGreaterThan(0)
    expect(screen.getByText(/credits remaining/i)).toBeInTheDocument()
    expect(screen.getAllByText(/counsel credits/i).length).toBeGreaterThan(0)
  })

  it('displays usage statistics', () => {
    renderDashboardCounsel()
    
    expect(screen.getAllByText(/^1$/).length).toBeGreaterThan(0)
    expect(screen.getByText(/credits used/i)).toBeInTheDocument()
    expect(screen.getByText(/usage this month/i)).toBeInTheDocument()
  })

  it('displays top-up information', () => {
    renderDashboardCounsel()
    
    expect(screen.getByText(/credit usage & top-ups/i)).toBeInTheDocument()
    expect(screen.getByText(/r450 per additional credit hour/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /top up credits/i })).toBeInTheDocument()
  })

  it('displays both tabs', () => {
    renderDashboardCounsel()
    
    expect(screen.getByRole('button', { name: /book counsel/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /request history/i })).toBeInTheDocument()
  })

  it('shows Book Counsel tab by default', () => {
    renderDashboardCounsel()
    
    expect(screen.getByText(/request expert review/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument()
  })

  it('displays booking form fields', () => {
    renderDashboardCounsel()
    
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/related wizard/i)).toBeInTheDocument()
  })

  it('displays upload button for attachments', () => {
    renderDashboardCounsel()
    
    expect(screen.getByRole('button', { name: /upload files/i })).toBeInTheDocument()
    expect(screen.getByText(/pdf, docx/i)).toBeInTheDocument()
  })

  it('displays submit button', () => {
    renderDashboardCounsel()
    
    expect(screen.getByRole('button', { name: /submit request/i })).toBeInTheDocument()
  })

  it('switches to Request History tab when clicked', () => {
    renderDashboardCounsel()
    
    const historyTab = screen.getByRole('button', { name: /request history/i })
    fireEvent.click(historyTab)
    
    expect(screen.getAllByText(/nda review - tech partnership/i).length).toBeGreaterThan(0)
  })

  it('displays request history items', () => {
    renderDashboardCounsel()
    
    const historyTab = screen.getByRole('button', { name: /request history/i })
    fireEvent.click(historyTab)
    
    const historyItems = screen.getAllByText(/nda review - tech partnership/i)
    expect(historyItems.length).toBe(3) // 3 history items
  })

  it('displays request status in history', () => {
    renderDashboardCounsel()
    
    const historyTab = screen.getByRole('button', { name: /request history/i })
    fireEvent.click(historyTab)
    
    expect(screen.getByText(/in progress/i)).toBeInTheDocument()
    expect(screen.getAllByText(/completed/i).length).toBeGreaterThan(0)
  })

  it('displays reviewer information in history', () => {
    renderDashboardCounsel()
    
    const historyTab = screen.getByRole('button', { name: /request history/i })
    fireEvent.click(historyTab)
    
    const reviewerInfo = screen.getAllByText(/reviewed by sarah naidoo/i)
    expect(reviewerInfo.length).toBe(3)
  })

  it('displays View Response buttons in history', () => {
    renderDashboardCounsel()
    
    const historyTab = screen.getByRole('button', { name: /request history/i })
    fireEvent.click(historyTab)
    
    const viewButtons = screen.getAllByRole('button', { name: /view response/i })
    expect(viewButtons.length).toBe(3)
  })

  it('displays dates in history', () => {
    renderDashboardCounsel()
    
    const historyTab = screen.getByRole('button', { name: /request history/i })
    fireEvent.click(historyTab)
    
    const dates = screen.getAllByText(/dec 15, 2025/i)
    expect(dates.length).toBe(3)
  })

  it('switches back to Book Counsel tab', () => {
    renderDashboardCounsel()
    
    const historyTab = screen.getByRole('button', { name: /request history/i })
    fireEvent.click(historyTab)
    
    const bookTab = screen.getByRole('button', { name: /book counsel/i })
    fireEvent.click(bookTab)
    
    expect(screen.getByText(/request expert review/i)).toBeInTheDocument()
  })

  it('has accessible form labels', () => {
    renderDashboardCounsel()
    
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/related wizard/i)).toBeInTheDocument()
  })

  it('displays wizard options in select dropdown', () => {
    renderDashboardCounsel()
    
    const select = screen.getByLabelText(/related wizard/i)
    expect(select).toBeInTheDocument()
    
    // Check if options exist
    const options = select.querySelectorAll('option')
    expect(options.length).toBeGreaterThan(1)
  })

  it('has accessible structure', () => {
    const { container } = renderDashboardCounsel()
    expect(container.firstChild).toBeTruthy()
  })

  it('renders with DashboardShell wrapper', () => {
    renderDashboardCounsel()
    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument()
  })
})

// Made with Bob
