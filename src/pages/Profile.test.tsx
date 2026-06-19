import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import Profile from './Profile'

// Mock DashboardShell
vi.mock('../components/dashboard/DashboardShell', () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-shell">{children}</div>
  ),
}))

vi.mock('../services/metadata', () => ({
  setPageMetadata: vi.fn(),
}))

const renderProfile = () => {
  return render(
    <BrowserRouter>
      <Profile />
    </BrowserRouter>
  )
}

describe('Profile Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    renderProfile()
    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument()
  })

  it('displays profile header with title', () => {
    renderProfile()
    expect(screen.getByRole('heading', { name: /profile/i })).toBeInTheDocument()
  })

  it('displays member and plan badges', () => {
    renderProfile()
    expect(screen.getByText(/member/i)).toBeInTheDocument()
    expect(screen.getByText(/operator plan/i)).toBeInTheDocument()
  })

  it('displays account active status', () => {
    renderProfile()
    expect(screen.getByText(/account active/i)).toBeInTheDocument()
  })

  it('displays all three tabs', () => {
    renderProfile()
    
    expect(screen.getByRole('button', { name: /profile information/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /security/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /preferences/i })).toBeInTheDocument()
  })

  it('shows Profile Information tab by default', () => {
    renderProfile()
    expect(screen.getByDisplayValue(/fibregents/i)).toBeInTheDocument()
  })

  it('displays company form fields with default values', () => {
    renderProfile()
    
    expect(screen.getByDisplayValue('FibreGents (Pty) Ltd')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2023/123456/07')).toBeInTheDocument()
    expect(screen.getByDisplayValue('contact@fibregents.co.za')).toBeInTheDocument()
    expect(screen.getByDisplayValue('+27 11 234 5678')).toBeInTheDocument()
    expect(screen.getByDisplayValue(/business park/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('John Smith')).toBeInTheDocument()
  })

  it('switches to Security tab when clicked', () => {
    renderProfile()
    
    const securityTab = screen.getByRole('button', { name: /security/i })
    fireEvent.click(securityTab)
    
    expect(screen.getByText(/security settings/i)).toBeInTheDocument()
  })

  it('switches to Preferences tab when clicked', () => {
    renderProfile()
    
    const preferencesTab = screen.getByRole('button', { name: /preferences/i })
    fireEvent.click(preferencesTab)
    
    expect(screen.getByRole('heading', { name: /preferences/i })).toBeInTheDocument()
  })

  it('allows editing company name', () => {
    renderProfile()
    
    const companyNameInput = screen.getByLabelText(/company name/i)
    fireEvent.change(companyNameInput, { target: { value: 'New Company' } })
    
    expect(screen.getByDisplayValue('New Company')).toBeInTheDocument()
  })

  it('allows editing email', () => {
    renderProfile()
    
    const emailInput = screen.getByLabelText(/email address/i)
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } })
    
    expect(screen.getByDisplayValue('new@example.com')).toBeInTheDocument()
  })

  it('allows editing phone number', () => {
    renderProfile()
    
    const phoneInput = screen.getByLabelText(/phone number/i)
    fireEvent.change(phoneInput, { target: { value: '+27 12 345 6789' } })
    
    expect(screen.getByDisplayValue('+27 12 345 6789')).toBeInTheDocument()
  })

  it('resets form when Cancel button is clicked', () => {
    renderProfile()
    
    const companyNameInput = screen.getByLabelText(/company name/i)
    fireEvent.change(companyNameInput, { target: { value: 'Changed' } })
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)
    
    expect(screen.getByDisplayValue('FibreGents (Pty) Ltd')).toBeInTheDocument()
  })

  it('calls handleSave when Save Changes button is clicked', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    renderProfile()
    
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

  it('displays Save and Cancel buttons', () => {
    renderProfile()
    
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('has accessible form labels', () => {
    renderProfile()
    
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/registration number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/physical address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contact person/i)).toBeInTheDocument()
  })

  it('has accessible structure', () => {
    const { container } = renderProfile()
    expect(container.firstChild).toBeTruthy()
  })

  it('renders with DashboardShell wrapper', () => {
    renderProfile()
    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument()
  })
})

// Made with Bob
