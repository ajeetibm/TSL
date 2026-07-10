import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import CounselProfile from './CounselProfile'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../services/metadata', () => ({
  setPageMetadata: vi.fn(),
}))

const mockCounselPortalProfile = vi.fn().mockResolvedValue({ success: false })
const mockCounselPortalUpdateProfile = vi.fn().mockResolvedValue({ success: true, message: 'Profile saved successfully.' })
const mockCounselPortalChangePassword = vi.fn().mockResolvedValue({ success: true, message: 'Password changed successfully.' })
const mockClearAuthSession = vi.fn()

vi.mock('../../services/tslApi', () => ({
  counselPortalApi: {
    profile: (...args: unknown[]) => mockCounselPortalProfile(...args),
    updateProfile: (...args: unknown[]) => mockCounselPortalUpdateProfile(...args),
    changePassword: (...args: unknown[]) => mockCounselPortalChangePassword(...args),
  },
  clearAuthSession: () => mockClearAuthSession(),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderCounselProfile = () =>
  render(
    <MemoryRouter>
      <CounselProfile />
    </MemoryRouter>
  )

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CounselProfile — Counsel Profile Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockCounselPortalProfile.mockResolvedValue({ success: false })
    mockCounselPortalUpdateProfile.mockResolvedValue({ success: true, message: 'Profile saved successfully.' })
    mockCounselPortalChangePassword.mockResolvedValue({ success: true, message: 'Password changed successfully.' })
  })

  // --- Render ---------------------------------------------------------------

  it('renders without crashing', () => {
    renderCounselProfile()
    expect(screen.getByRole('heading', { name: /^profile$/i })).toBeInTheDocument()
  })

  it('renders the sidebar with navigation links', () => {
    renderCounselProfile()
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /my requests/i })).toBeInTheDocument()
  })

  it('renders the Sign Out button', () => {
    renderCounselProfile()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  // --- Status toggle --------------------------------------------------------

  it('shows Available status by default', () => {
    renderCounselProfile()
    expect(screen.getByText(/available/i)).toBeInTheDocument()
  })

  it('toggles availability to Unavailable when status button is clicked', () => {
    renderCounselProfile()
    const statusButton = screen.getByRole('button', { name: /status/i })
    fireEvent.click(statusButton)
    expect(screen.getAllByText(/unavailable/i).length).toBeGreaterThan(0)
  })

  it('shows unavailability notice banner when status is Unavailable', () => {
    renderCounselProfile()
    fireEvent.click(screen.getByRole('button', { name: /status/i }))
    expect(screen.getByText(/new requests will not be assigned/i)).toBeInTheDocument()
  })

  it('hides unavailability notice when Set Available is clicked', () => {
    renderCounselProfile()
    fireEvent.click(screen.getByRole('button', { name: /status/i }))
    fireEvent.click(screen.getByRole('button', { name: /set available/i }))
    expect(screen.queryByText(/new requests will not be assigned/i)).not.toBeInTheDocument()
  })

  // --- Tabs -----------------------------------------------------------------

  it('renders all three profile tabs', () => {
    renderCounselProfile()
    expect(screen.getByRole('button', { name: /profile information/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /security/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /preferences/i })).toBeInTheDocument()
  })

  it('shows the Profile Information tab by default', () => {
    renderCounselProfile()
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
  })

  it('switches to the Security tab on click', () => {
    renderCounselProfile()
    fireEvent.click(screen.getByRole('button', { name: /security/i }))
    expect(screen.getByText(/change password/i)).toBeInTheDocument()
  })

  it('switches to the Preferences tab on click', () => {
    renderCounselProfile()
    fireEvent.click(screen.getByRole('button', { name: /preferences/i }))
    expect(screen.getByText(/email preferences/i)).toBeInTheDocument()
  })

  // --- Profile Information tab – default values ----------------------------

  it('displays default profile field values from defaultProfileData', () => {
    renderCounselProfile()
    // firstName and lastName are both 'Thabo' in default data — use getAllByDisplayValue
    expect(screen.getAllByDisplayValue('Thabo').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByDisplayValue('s.nkosi@tsl.co.za')).toBeInTheDocument()
    expect(screen.getByDisplayValue('+27 11 234 5678')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Johannesburg, Gauteng')).toBeInTheDocument()
  })

  it('shows session-based data when counsel user is stored in localStorage', () => {
    localStorage.setItem(
      'tsl-auth-user',
      JSON.stringify({ email: 'advocate@tsl.co.za', fullName: 'Adv. Sipho Nkosi', portal: 'counsel' })
    )
    renderCounselProfile()
    expect(screen.getByDisplayValue('Sipho')).toBeInTheDocument()
    expect(screen.getByDisplayValue('advocate@tsl.co.za')).toBeInTheDocument()
  })

  it('ignores localStorage entry if portal is not counsel', () => {
    localStorage.setItem(
      'tsl-auth-user',
      JSON.stringify({ email: 'admin@tsl.co.za', fullName: 'Admin User', portal: 'admin' })
    )
    renderCounselProfile()
    // Falls back to defaults — firstName and lastName are both 'Thabo'
    expect(screen.getAllByDisplayValue('Thabo').length).toBeGreaterThanOrEqual(1)
  })

  // --- Profile Information tab – editing -----------------------------------

  it('allows editing the first name field', () => {
    renderCounselProfile()
    const input = screen.getByLabelText(/first name/i)
    fireEvent.change(input, { target: { value: 'Sipho' } })
    expect(screen.getByDisplayValue('Sipho')).toBeInTheDocument()
  })

  it('allows editing the last name field', () => {
    renderCounselProfile()
    const input = screen.getByLabelText(/last name/i)
    fireEvent.change(input, { target: { value: 'Dlamini' } })
    expect(screen.getByDisplayValue('Dlamini')).toBeInTheDocument()
  })

  it('allows editing the email field', () => {
    renderCounselProfile()
    const input = screen.getByLabelText(/email address/i)
    fireEvent.change(input, { target: { value: 'new@tsl.co.za' } })
    expect(screen.getByDisplayValue('new@tsl.co.za')).toBeInTheDocument()
  })

  it('allows editing the phone field', () => {
    renderCounselProfile()
    const input = screen.getByLabelText(/phone number/i)
    fireEvent.change(input, { target: { value: '+27 83 000 1111' } })
    expect(screen.getByDisplayValue('+27 83 000 1111')).toBeInTheDocument()
  })

  it('allows editing the location field', () => {
    renderCounselProfile()
    const input = screen.getByLabelText(/location/i)
    fireEvent.change(input, { target: { value: 'Cape Town, Western Cape' } })
    expect(screen.getByDisplayValue('Cape Town, Western Cape')).toBeInTheDocument()
  })

  // --- Cancel & Save --------------------------------------------------------

  it('resets form to baseline values when Cancel is clicked', () => {
    renderCounselProfile()
    const input = screen.getByLabelText(/first name/i)
    fireEvent.change(input, { target: { value: 'Changed' } })

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.getAllByDisplayValue('Thabo').length).toBeGreaterThanOrEqual(1)
  })

  it('calls counselPortalApi.updateProfile when Save Changes is clicked', async () => {
    renderCounselProfile()
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => expect(mockCounselPortalUpdateProfile).toHaveBeenCalledTimes(1))
  })

  it('shows success message after profile is saved', async () => {
    renderCounselProfile()
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => expect(screen.getByText(/profile saved successfully/i)).toBeInTheDocument())
  })

  it('shows error message when profile save fails', async () => {
    mockCounselPortalUpdateProfile.mockResolvedValueOnce({ success: false, message: 'Save failed.' })
    renderCounselProfile()
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => expect(screen.getByText(/save failed/i)).toBeInTheDocument())
  })

  // --- Security tab ---------------------------------------------------------

  it('renders password fields in the Security tab', () => {
    renderCounselProfile()
    fireEvent.click(screen.getByRole('button', { name: /security/i }))
    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument()
  })

  it('shows validation error when password fields are empty on submit', async () => {
    renderCounselProfile()
    fireEvent.click(screen.getByRole('button', { name: /security/i }))
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })

  it('shows error when new password and confirm password do not match', async () => {
    renderCounselProfile()
    fireEvent.click(screen.getByRole('button', { name: /security/i }))

    fireEvent.change(screen.getByPlaceholderText(/enter current password/i), { target: { value: 'oldpass123' } })
    fireEvent.change(screen.getByPlaceholderText(/enter new password/i), { target: { value: 'newpass123' } })
    fireEvent.change(screen.getByPlaceholderText(/confirm new password/i), { target: { value: 'different123' } })
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() => expect(screen.getByText(/must match/i)).toBeInTheDocument())
  })

  it('calls counselPortalApi.changePassword with correct payload', async () => {
    renderCounselProfile()
    fireEvent.click(screen.getByRole('button', { name: /security/i }))

    fireEvent.change(screen.getByPlaceholderText(/enter current password/i), { target: { value: 'oldpass' } })
    fireEvent.change(screen.getByPlaceholderText(/enter new password/i), { target: { value: 'newpass123' } })
    fireEvent.change(screen.getByPlaceholderText(/confirm new password/i), { target: { value: 'newpass123' } })
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() => expect(mockCounselPortalChangePassword).toHaveBeenCalledTimes(1))
    expect(mockCounselPortalChangePassword).toHaveBeenCalledWith(
      expect.objectContaining({
        currentPassword: 'oldpass',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123',
      })
    )
  })

  it('shows password change success message', async () => {
    renderCounselProfile()
    fireEvent.click(screen.getByRole('button', { name: /security/i }))

    fireEvent.change(screen.getByPlaceholderText(/enter current password/i), { target: { value: 'oldpass' } })
    fireEvent.change(screen.getByPlaceholderText(/enter new password/i), { target: { value: 'newpass123' } })
    fireEvent.change(screen.getByPlaceholderText(/confirm new password/i), { target: { value: 'newpass123' } })
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() => expect(screen.getByText(/password changed successfully/i)).toBeInTheDocument())
  })

  it('renders Two-Factor Authentication section in Security tab', () => {
    renderCounselProfile()
    fireEvent.click(screen.getByRole('button', { name: /security/i }))
    expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument()
  })

  it('renders Active Sessions section in Security tab', () => {
    renderCounselProfile()
    fireEvent.click(screen.getByRole('button', { name: /security/i }))
    expect(screen.getByText(/active sessions/i)).toBeInTheDocument()
  })

  // --- Preferences tab ------------------------------------------------------

  it('renders all three preference items in Preferences tab', () => {
    renderCounselProfile()
    fireEvent.click(screen.getByRole('button', { name: /preferences/i }))
    // Use heading role to be unambiguous — each item has an <h3> title
    expect(screen.getByRole('heading', { name: /^new requests$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^weekly summary$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^product updates$/i })).toBeInTheDocument()
  })

  it('toggles a preference when clicked', () => {
    renderCounselProfile()
    fireEvent.click(screen.getByRole('button', { name: /preferences/i }))

    // All buttons in preference list: 3 preference toggles + availability + tabs
    // Find the "New Requests" toggle — it has text 'New Requests' near it
    const allToggleButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.className.includes('counsel-profile__toggle'))

    const newRequestsToggle = allToggleButtons[0]
    const wasActive = newRequestsToggle.className.includes('--active')
    fireEvent.click(newRequestsToggle)
    expect(newRequestsToggle.className.includes('--active')).toBe(!wasActive)
  })

  // --- Sign out ------------------------------------------------------------

  it('calls clearAuthSession and navigates to / on Sign Out', () => {
    renderCounselProfile()
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))
    expect(mockClearAuthSession).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  // --- Accessible structure -------------------------------------------------

  it('has a non-empty root element', () => {
    const { container } = renderCounselProfile()
    expect(container.firstChild).toBeTruthy()
  })
})
