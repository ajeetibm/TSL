import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import DashboardProfile from './DashboardProfile'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('../../components/dashboard/DashboardShell', () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-shell">{children}</div>
  ),
}))

vi.mock('../../services/metadata', () => ({
  setPageMetadata: vi.fn(),
}))

const mockProfileGet = vi.fn().mockResolvedValue({ success: false })
const mockProfileUpdate = vi.fn().mockResolvedValue({ success: true, message: 'Profile saved successfully.' })
const mockAuthChangePassword = vi.fn().mockResolvedValue({ success: true, message: 'Password changed successfully.' })

vi.mock('../../services/tslApi', () => ({
  profileApi: {
    get: (...args: unknown[]) => mockProfileGet(...args),
    update: (...args: unknown[]) => mockProfileUpdate(...args),
  },
  authApi: {
    changePassword: (...args: unknown[]) => mockAuthChangePassword(...args),
  },
}))

const mockProfile = {
  companyName: 'FibreGents (Pty) Ltd',
  registrationNumber: '2025/123456/07',
  email: 'info@fibregents.co.za',
  phone: '+27 11 234 5678',
  physicalAddress: '10 Sandton Drive, Sandton, 2196',
  contactPerson: 'Thabo Molefe',
}

const mockUpdateProfile = vi.fn()

vi.mock('../../context/UserProfileContext', () => ({
  useUserProfile: () => ({
    profile: mockProfile,
    updateProfile: mockUpdateProfile,
  }),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderDashboardProfile = () =>
  render(
    <BrowserRouter>
      <DashboardProfile />
    </BrowserRouter>
  )

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DashboardProfile — User Profile Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProfileGet.mockResolvedValue({ success: false })
    mockProfileUpdate.mockResolvedValue({ success: true, message: 'Profile saved successfully.' })
    mockAuthChangePassword.mockResolvedValue({ success: true, message: 'Password changed successfully.' })
  })

  // --- Render ---------------------------------------------------------------

  it('renders without crashing', () => {
    renderDashboardProfile()
    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument()
  })

  it('renders inside DashboardShell wrapper', () => {
    renderDashboardProfile()
    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument()
  })

  it('displays the Profile page heading', () => {
    renderDashboardProfile()
    expect(screen.getByRole('heading', { name: /^profile$/i })).toBeInTheDocument()
  })

  // --- Tabs -----------------------------------------------------------------

  it('renders all three tab buttons', () => {
    renderDashboardProfile()
    expect(screen.getByRole('button', { name: /profile information/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /security/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /preferences/i })).toBeInTheDocument()
  })

  it('shows the Profile Information tab by default', () => {
    renderDashboardProfile()
    // Company name field is visible only in Information tab
    expect(screen.getByDisplayValue('FibreGents (Pty) Ltd')).toBeInTheDocument()
  })

  it('switches to Security tab on click', () => {
    renderDashboardProfile()
    fireEvent.click(screen.getByRole('button', { name: /security/i }))
    expect(screen.getByText(/change password/i)).toBeInTheDocument()
    expect(screen.getAllByText(/two-factor authentication/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/active sessions/i).length).toBeGreaterThan(0)
  })

  it('switches to Preferences tab on click', () => {
    renderDashboardProfile()
    fireEvent.click(screen.getByRole('button', { name: /preferences/i }))
    expect(screen.getByText(/email preferences/i)).toBeInTheDocument()
    expect(screen.getByText(/workflow updates/i)).toBeInTheDocument()
  })

  // --- Profile Information tab fields --------------------------------------

  it('displays all profile form fields with correct initial values', () => {
    renderDashboardProfile()
    expect(screen.getByDisplayValue('FibreGents (Pty) Ltd')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2025/123456/07')).toBeInTheDocument()
    expect(screen.getByDisplayValue('info@fibregents.co.za')).toBeInTheDocument()
    expect(screen.getByDisplayValue('+27 11 234 5678')).toBeInTheDocument()
    expect(screen.getByDisplayValue(/sandton/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('Thabo Molefe')).toBeInTheDocument()
  })

  it('allows editing the company name field', () => {
    renderDashboardProfile()
    const input = screen.getByDisplayValue('FibreGents (Pty) Ltd')
    fireEvent.change(input, { target: { value: 'New Company Name' } })
    expect(screen.getByDisplayValue('New Company Name')).toBeInTheDocument()
  })

  it('allows editing the email field', () => {
    renderDashboardProfile()
    const input = screen.getByDisplayValue('info@fibregents.co.za')
    fireEvent.change(input, { target: { value: 'newemail@example.com' } })
    expect(screen.getByDisplayValue('newemail@example.com')).toBeInTheDocument()
  })

  it('allows editing the phone field', () => {
    renderDashboardProfile()
    const input = screen.getByDisplayValue('+27 11 234 5678')
    fireEvent.change(input, { target: { value: '+27 99 000 1111' } })
    expect(screen.getByDisplayValue('+27 99 000 1111')).toBeInTheDocument()
  })

  it('allows editing the contact person field', () => {
    renderDashboardProfile()
    const input = screen.getByDisplayValue('Thabo Molefe')
    fireEvent.change(input, { target: { value: 'Jane Doe' } })
    expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument()
  })

  // --- Cancel & Save --------------------------------------------------------

  it('resets form to original values when Cancel is clicked', () => {
    renderDashboardProfile()
    const input = screen.getByDisplayValue('FibreGents (Pty) Ltd')
    fireEvent.change(input, { target: { value: 'Changed Name' } })
    expect(screen.getByDisplayValue('Changed Name')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.getByDisplayValue('FibreGents (Pty) Ltd')).toBeInTheDocument()
  })

  it('calls profileApi.update when Save Changes is clicked', async () => {
    renderDashboardProfile()
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => expect(mockProfileUpdate).toHaveBeenCalledTimes(1))
    expect(mockProfileUpdate).toHaveBeenCalledWith(expect.objectContaining({ companyName: 'FibreGents (Pty) Ltd' }))
  })

  it('shows save success message after successful save', async () => {
    renderDashboardProfile()
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => expect(screen.getByText(/profile saved successfully/i)).toBeInTheDocument())
  })

  it('shows save error message when API returns failure', async () => {
    mockProfileUpdate.mockResolvedValueOnce({ success: false, message: 'Update failed.' })
    renderDashboardProfile()
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => expect(screen.getByText(/update failed/i)).toBeInTheDocument())
  })

  // --- Security tab ---------------------------------------------------------

  it('renders password input fields in the Security tab', () => {
    renderDashboardProfile()
    fireEvent.click(screen.getByRole('button', { name: /security/i }))
    const passwordInputs = screen.getAllByPlaceholderText(/password/i)
    expect(passwordInputs.length).toBeGreaterThanOrEqual(3)
  })

  it('shows validation error when password fields are empty on submit', async () => {
    renderDashboardProfile()
    fireEvent.click(screen.getByRole('button', { name: /security/i }))
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toBeInTheDocument()
    )
  })

  it('shows error when new password and confirm password do not match', async () => {
    renderDashboardProfile()
    fireEvent.click(screen.getByRole('button', { name: /security/i }))

    fireEvent.change(screen.getByPlaceholderText(/enter current password/i), { target: { value: 'oldpass123' } })
    fireEvent.change(screen.getByPlaceholderText(/enter new password/i), { target: { value: 'newpass123' } })
    fireEvent.change(screen.getByPlaceholderText(/confirm new password/i), { target: { value: 'different123' } })
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() => expect(screen.getByText(/must match/i)).toBeInTheDocument())
  })

  it('calls authApi.changePassword with correct payload on valid submit', async () => {
    renderDashboardProfile()
    fireEvent.click(screen.getByRole('button', { name: /security/i }))

    fireEvent.change(screen.getByPlaceholderText(/enter current password/i), { target: { value: 'oldpass123' } })
    fireEvent.change(screen.getByPlaceholderText(/enter new password/i), { target: { value: 'newpass456' } })
    fireEvent.change(screen.getByPlaceholderText(/confirm new password/i), { target: { value: 'newpass456' } })
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() => expect(mockAuthChangePassword).toHaveBeenCalledTimes(1))
    expect(mockAuthChangePassword).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'info@fibregents.co.za',
        currentPassword: 'oldpass123',
        newPassword: 'newpass456',
        confirmPassword: 'newpass456',
      })
    )
  })

  it('shows success message after password is changed', async () => {
    renderDashboardProfile()
    fireEvent.click(screen.getByRole('button', { name: /security/i }))

    fireEvent.change(screen.getByPlaceholderText(/enter current password/i), { target: { value: 'oldpass' } })
    fireEvent.change(screen.getByPlaceholderText(/enter new password/i), { target: { value: 'newpass123' } })
    fireEvent.change(screen.getByPlaceholderText(/confirm new password/i), { target: { value: 'newpass123' } })
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() => expect(screen.getByText(/password changed successfully/i)).toBeInTheDocument())
  })

  it('displays Two-Factor Authentication toggle in Security tab', () => {
    renderDashboardProfile()
    fireEvent.click(screen.getByRole('button', { name: /security/i }))
    expect(screen.getAllByText(/two-factor authentication/i).length).toBeGreaterThan(0)
  })

  it('displays Active Sessions section in Security tab', () => {
    renderDashboardProfile()
    fireEvent.click(screen.getByRole('button', { name: /security/i }))
    expect(screen.getAllByText(/active sessions/i).length).toBeGreaterThan(0)
  })

  // --- Preferences tab ------------------------------------------------------

  it('renders Preferences tab with all three email preference items', () => {
    renderDashboardProfile()
    fireEvent.click(screen.getByRole('button', { name: /preferences/i }))
    expect(screen.getByText(/workflow updates/i)).toBeInTheDocument()
    expect(screen.getByText(/weekly summary/i)).toBeInTheDocument()
    expect(screen.getByText(/product updates/i)).toBeInTheDocument()
  })

  it('renders three checkbox toggles in Preferences tab', () => {
    renderDashboardProfile()
    fireEvent.click(screen.getByRole('button', { name: /preferences/i }))
    const toggles = screen.getAllByRole('checkbox')
    expect(toggles).toHaveLength(3)
  })

  // --- Accessible structure -------------------------------------------------

  it('has a non-empty root element', () => {
    const { container } = renderDashboardProfile()
    expect(container.firstChild).toBeTruthy()
  })
})
