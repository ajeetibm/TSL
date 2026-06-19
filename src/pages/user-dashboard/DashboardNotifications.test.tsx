import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import DashboardNotifications from './DashboardNotifications'

// Mock DashboardShell
vi.mock('../../components/dashboard/DashboardShell', () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-shell">{children}</div>
  ),
}))

vi.mock('../../services/metadata', () => ({
  setPageMetadata: vi.fn(),
}))

const renderDashboardNotifications = () => {
  return render(
    <BrowserRouter>
      <DashboardNotifications />
    </BrowserRouter>
  )
}

describe('DashboardNotifications Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    renderDashboardNotifications()
    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument()
  })

  it('displays page header', () => {
    renderDashboardNotifications()
    expect(screen.getByRole('heading', { name: /^notifications$/i })).toBeInTheDocument()
    expect(screen.getByText(/stay updated with your legal workflow activities/i)).toBeInTheDocument()
  })

  it('displays "Mark all as read" button', () => {
    renderDashboardNotifications()
    expect(screen.getByRole('button', { name: /mark all as read/i })).toBeInTheDocument()
  })

  it('displays unread section with count', () => {
    renderDashboardNotifications()
    expect(screen.getByText(/^unread$/i)).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('displays unread notifications', () => {
    renderDashboardNotifications()
    
    expect(screen.getByText(/document completed/i)).toBeInTheDocument()
    expect(screen.getByText(/signature required/i)).toBeInTheDocument()
    expect(screen.getByText(/legal counsel available/i)).toBeInTheDocument()
    expect(screen.getByText(/new wizard available/i)).toBeInTheDocument()
    expect(screen.getByText(/subscription renewal/i)).toBeInTheDocument()
  })

  it('displays notification messages', () => {
    renderDashboardNotifications()
    
    expect(screen.getByText(/privacy policy.*has been completed/i)).toBeInTheDocument()
    expect(screen.getByText(/founder agreement is awaiting your signature/i)).toBeInTheDocument()
  })

  it('displays notification timestamps', () => {
    renderDashboardNotifications()
    
    expect(screen.getByText(/2 hours ago/i)).toBeInTheDocument()
    expect(screen.getByText(/5 hours ago/i)).toBeInTheDocument()
    expect(screen.getByText(/4 days ago/i)).toBeInTheDocument()
  })

  it('displays "Mark as read" buttons for unread notifications', () => {
    renderDashboardNotifications()
    
    const markAsReadButtons = screen.getAllByRole('button', { name: /mark as read/i })
    expect(markAsReadButtons.length).toBe(5) // 5 unread notifications
  })

  it('displays "Earlier" section', () => {
    renderDashboardNotifications()
    expect(screen.getByText(/^earlier$/i)).toBeInTheDocument()
  })

  it('displays earlier notifications', () => {
    renderDashboardNotifications()
    
    expect(screen.getByText(/new team member added/i)).toBeInTheDocument()
    expect(screen.getByText(/wizard update available/i)).toBeInTheDocument()
    expect(screen.getByText(/payment successful/i)).toBeInTheDocument()
  })

  it('displays notification settings sidebar', () => {
    renderDashboardNotifications()
    
    expect(screen.getByText(/notification settings/i)).toBeInTheDocument()
    expect(screen.getByText(/customize what you want to be notified about/i)).toBeInTheDocument()
  })

  it('displays all settings options', () => {
    renderDashboardNotifications()
    
    expect(screen.getByText(/document updates/i)).toBeInTheDocument()
    expect(screen.getByText(/signature requests/i)).toBeInTheDocument()
    expect(screen.getByText(/team activity/i)).toBeInTheDocument()
    expect(screen.getByText(/billing updates/i)).toBeInTheDocument()
    expect(screen.getByText(/product updates/i)).toBeInTheDocument()
  })

  it('displays checkboxes for settings options', () => {
    renderDashboardNotifications()
    
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.length).toBe(5) // 5 settings options
    
    // All should be checked by default
    checkboxes.forEach(checkbox => {
      expect(checkbox).toBeChecked()
    })
  })

  it('displays "Save Preferences" button', () => {
    renderDashboardNotifications()
    expect(screen.getByRole('button', { name: /save preferences/i })).toBeInTheDocument()
  })

  it('displays "Stay Informed" summary section', () => {
    renderDashboardNotifications()
    
    expect(screen.getByText(/stay informed/i)).toBeInTheDocument()
    expect(screen.getByText(/never miss important updates/i)).toBeInTheDocument()
  })

  it('displays notification statistics', () => {
    renderDashboardNotifications()
    
    expect(screen.getByText(/total notifications/i)).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText(/^unread$/i)).toBeInTheDocument()
  })

  it('allows toggling notification settings', () => {
    renderDashboardNotifications()
    
    const checkboxes = screen.getAllByRole('checkbox')
    const firstCheckbox = checkboxes[0]
    
    expect(firstCheckbox).toBeChecked()
    fireEvent.click(firstCheckbox)
    expect(firstCheckbox).not.toBeChecked()
  })

  it('has accessible structure', () => {
    const { container } = renderDashboardNotifications()
    expect(container.firstChild).toBeTruthy()
  })

  it('renders with DashboardShell wrapper', () => {
    renderDashboardNotifications()
    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument()
  })

  it('displays notification icons', () => {
    const { container } = renderDashboardNotifications()
    const icons = container.querySelectorAll('.dashboard-notifications__item-icon')
    expect(icons.length).toBeGreaterThan(0)
  })
})

// Made with Bob
