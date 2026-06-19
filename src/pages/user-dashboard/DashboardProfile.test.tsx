import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import DashboardProfile from './DashboardProfile'

// Mock DashboardShell
vi.mock('../../components/dashboard/DashboardShell', () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-shell">{children}</div>
  ),
}))

vi.mock('../../services/metadata', () => ({
  setPageMetadata: vi.fn(),
}))

const renderDashboardProfile = () => {
  return render(
    <BrowserRouter>
      <DashboardProfile />
    </BrowserRouter>
  )
}

describe('DashboardProfile Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    renderDashboardProfile()
    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument()
  })

  it('displays profile header with title', () => {
    renderDashboardProfile()
    expect(screen.getByText(/profile/i)).toBeInTheDocument()
  })

  it('displays all three tabs', () => {
    renderDashboardProfile()
    
    expect(screen.getByRole('button', { name: /profile information/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /security/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /preferences/i })).toBeInTheDocument()
  })

  it('shows Profile Information tab by default', () => {
    renderDashboardProfile()
    
    expect(screen.getByText(/company information/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue(/fibregents/i)).toBeInTheDocument()
  })

  it('displays company form fields', () => {
    renderDashboardProfile()
    
    expect(screen.getByDisplayValue('FibreGents (Pty) Ltd')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2025/123456/07')).toBeInTheDocument()
    expect(screen.getByDisplayValue('info@fibregents.co.za')).toBeInTheDocument()
    expect(screen.getByDisplayValue('+27 11 234 5678')).toBeInTheDocument()
    expect(screen.getByDisplayValue(/sandton/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('Thabo Molefe')).toBeInTheDocument()
  })

  it('switches to Security tab when clicked', () => {
    renderDashboardProfile()
    
    const securityTab = screen.getByRole('button', { name: /security/i })
    fireEvent.click(securityTab)
    
    expect(screen.getByText(/change password/i)).toBeInTheDocument()
    expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument()
  })

  it('switches to Preferences tab when clicked', () => {
    renderDashboardProfile()
    
    const preferencesTab = screen.getByRole('button', { name: /preferences/i })
    fireEvent.click(preferencesTab)
    
    expect(screen.getByText(/email preferences/i)).toBeInTheDocument()
    expect(screen.getByText(/workflow updates/i)).toBeInTheDocument()
  })

  it('displays Security tab content', () => {
    renderDashboardProfile()
    
    fireEvent.click(screen.getByRole('button', { name: /security/i }))
    
    expect(screen.getByText(/change password/i)).toBeInTheDocument()
    expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument()
    expect(screen.getByText(/active sessions/i)).toBeInTheDocument()
  })

  it('displays Preferences tab content with toggles', () => {
    renderDashboardProfile()
    
    fireEvent.click(screen.getByRole('button', { name: /preferences/i }))
    
    expect(screen.getByText(/workflow updates/i)).toBeInTheDocument()
    expect(screen.getByText(/weekly summary/i)).toBeInTheDocument()
    expect(screen.getByText(/product updates/i)).toBeInTheDocument()
  })

  it('allows editing company name', () => {
    renderDashboardProfile()
    
    const companyNameInput = screen.getByDisplayValue('FibreGents (Pty) Ltd')
    fireEvent.change(companyNameInput, { target: { value: 'New Company Name' } })
    
    expect(screen.getByDisplayValue('New Company Name')).toBeInTheDocument()
  })

  it('allows editing email', () => {
    renderDashboardProfile()
    
    const emailInput = screen.getByDisplayValue('info@fibregents.co.za')
    fireEvent.change(emailInput, { target: { value: 'newemail@example.com' } })
    
    expect(screen.getByDisplayValue('newemail@example.com')).toBeInTheDocument()
  })

  it('resets form when Cancel button is clicked', () => {
    renderDashboardProfile()
    
    const companyNameInput = screen.getByDisplayValue('FibreGents (Pty) Ltd')
    fireEvent.change(companyNameInput, { target: { value: 'Changed Name' } })
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)
    
    expect(screen.getByDisplayValue('FibreGents (Pty) Ltd')).toBeInTheDocument()
  })

  it('calls handleSave when Save Changes button is clicked', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    renderDashboardProfile()
    
    const saveButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(saveButton)
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Saving profile data:',
      expect.objectContaining({
        companyName: 'FibreGents (Pty) Ltd',
      })
    )
    
    consoleSpy.mockRestore()
  })

  it('displays badges in header', () => {
    renderDashboardProfile()
    
    expect(screen.getByText(/member/i)).toBeInTheDocument()
    expect(screen.getByText(/operator plan/i)).toBeInTheDocument()
    expect(screen.getByText(/account active/i)).toBeInTheDocument()
  })

  it('has accessible structure', () => {
    const { container } = renderDashboardProfile()
    expect(container.firstChild).toBeTruthy()
  })

  it('renders with DashboardShell wrapper', () => {
    renderDashboardProfile()
    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument()
  })

  it('displays password fields in Security tab', () => {
    renderDashboardProfile()
    
    fireEvent.click(screen.getByRole('button', { name: /security/i }))
    
    const passwordInputs = screen.getAllByPlaceholderText(/password/i)
    expect(passwordInputs.length).toBeGreaterThan(0)
  })

  it('displays toggle switches in Preferences tab', () => {
    renderDashboardProfile()
    
    fireEvent.click(screen.getByRole('button', { name: /preferences/i }))
    
    const toggles = screen.getAllByRole('checkbox')
    expect(toggles.length).toBe(3) // Three preference toggles
  })
})

// Made with Bob
