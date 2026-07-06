import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { SignInModal } from './SignInModal'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Helper function to render with router
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe('SignInModal', () => {
  const mockOnClose = vi.fn()
  const mockOnAuthenticated = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      renderWithRouter(
        <SignInModal isOpen={false} onClose={mockOnClose} />
      )
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should render when isOpen is true', () => {
      renderWithRouter(
        <SignInModal isOpen={true} onClose={mockOnClose} />
      )
      expect(screen.getByText('Get Started with TSL')).toBeInTheDocument()
    })

    it('should render in signup mode by default', () => {
      renderWithRouter(
        <SignInModal isOpen={true} onClose={mockOnClose} />
      )
      expect(screen.getByText('Get Started with TSL')).toBeInTheDocument()
      expect(screen.getByText('Join thousands of South African entrepreneurs')).toBeInTheDocument()
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    })

    it('should render in signin mode when initialMode is signin', () => {
      renderWithRouter(
        <SignInModal isOpen={true} onClose={mockOnClose} initialMode="signin" />
      )
      expect(screen.getByText('Welcome Back to TSL')).toBeInTheDocument()
      expect(screen.getByText('Sign in to continue your legal journey')).toBeInTheDocument()
      expect(screen.queryByLabelText('Full Name')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Confirm Password')).not.toBeInTheDocument()
    })
  })

  describe('Form Fields', () => {
    it('should render all signup form fields', () => {
      renderWithRouter(
        <SignInModal isOpen={true} onClose={mockOnClose} initialMode="signup" />
      )
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    })

    it('should render signin form fields without full name and confirm password', () => {
      renderWithRouter(
        <SignInModal isOpen={true} onClose={mockOnClose} initialMode="signin" />
      )
      expect(screen.queryByLabelText('Full Name')).not.toBeInTheDocument()
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.queryByLabelText('Confirm Password')).not.toBeInTheDocument()
    })

    it('should show forgot password link in signin mode', () => {
      renderWithRouter(
        <SignInModal isOpen={true} onClose={mockOnClose} initialMode="signin" />
      )
      expect(screen.getByText('Forgot password?')).toBeInTheDocument()
    })

    it('should not show forgot password link in signup mode', () => {
      renderWithRouter(
        <SignInModal isOpen={true} onClose={mockOnClose} initialMode="signup" />
      )
      expect(screen.queryByText('Forgot password?')).not.toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should update form fields when user types', async () => {
      const user = userEvent.setup()
      renderWithRouter(
        <SignInModal isOpen={true} onClose={mockOnClose} initialMode="signup" />
      )

      const fullNameInput = screen.getByLabelText('Full Name') as HTMLInputElement
      const emailInput = screen.getByLabelText('Email Address') as HTMLInputElement
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement

      await user.type(fullNameInput, 'Thabo Molefe')
      await user.type(emailInput, 'thabo@company.co.za')
      await user.type(passwordInput, 'SecurePass123')

      expect(fullNameInput.value).toBe('Thabo Molefe')
      expect(emailInput.value).toBe('thabo@company.co.za')
      expect(passwordInput.value).toBe('SecurePass123')
    })

    it('should toggle password visibility when eye icon is clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter(
        <SignInModal isOpen={true} onClose={mockOnClose} initialMode="signin" />
      )

      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement
      const toggleButton = screen.getByLabelText('Show password')

      expect(passwordInput.type).toBe('password')

      await user.click(toggleButton)
      expect(passwordInput.type).toBe('text')

      await user.click(toggleButton)
      expect(passwordInput.type).toBe('password')
    })

    it('should toggle confirm password visibility in signup mode', async () => {
      const user = userEvent.setup()
      renderWithRouter(
        <SignInModal isOpen={true} onClose={mockOnClose} initialMode="signup" />
      )

      const confirmPasswordInput = screen.getByLabelText('Confirm Password') as HTMLInputElement
      const toggleButtons = screen.getAllByRole('button', { name: /password/i })
      const confirmToggleButton = toggleButtons[1] // Second toggle button is for confirm password

      expect(confirmPasswordInput.type).toBe('password')

      await user.click(confirmToggleButton)
      expect(confirmPasswordInput.type).toBe('text')
    })

    it('should close modal when close button is clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter(
        <SignInModal isOpen={true} onClose={mockOnClose} />
      )

      const closeButton = screen.getByLabelText('Close modal')
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should close modal when clicking outside the panel', async () => {
      const user = userEvent.setup()
      renderWithRouter(
        <SignInModal isOpen={true} onClose={mockOnClose} />
      )

      const backdrop = screen.getByText('Get Started with TSL').closest('.signin-modal')
      if (backdrop) {
        await user.click(backdrop)
        expect(mockOnClose).toHaveBeenCalledTimes(1)
      }
    })

    it('should not close modal when clicking inside the panel', async () => {
      const user = userEvent.setup()
      renderWithRouter(
        <SignInModal isOpen={true} onClose={mockOnClose} />
      )

      const panel = screen.getByText('Get Started with TSL').closest('.signin-modal__panel')
      if (panel) {
        await user.click(panel)
        expect(mockOnClose).not.toHaveBeenCalled()
      }
    })
  })

  describe('Mode Switching', () => {
    it('should switch from signup to signin mode', async () => {
      const user = userEvent.setup()
      renderWithRouter(
        <SignInModal isOpen={true} onClose={mockOnClose} initialMode="signup" />
      )

      expect(screen.getByText('Get Started with TSL')).toBeInTheDocument()
      
      const switchButton = screen.getByText('Sign In')
      await user.click(switchButton)

      expect(screen.getByText('Welcome Back to TSL')).toBeInTheDocument()
      expect(screen.queryByLabelText('Full Name')).not.toBeInTheDocument()
    })

    it('should switch from signin to signup mode', async () => {
      const user = userEvent.setup()
      renderWithRouter(
        <SignInModal isOpen={true} onClose={mockOnClose} initialMode="signin" />
      )

      expect(screen.getByText('Welcome Back to TSL')).toBeInTheDocument()
      
      const switchButton = screen.getByText('Get Started Today')
      await user.click(switchButton)

      expect(screen.getByText('Get Started with TSL')).toBeInTheDocument()
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
    })

    it('should reset form data when switching modes', async () => {
      const user = userEvent.setup()
      renderWithRouter(
        <SignInModal isOpen={true} onClose={mockOnClose} initialMode="signup" />
      )

      // Fill in form
      const emailInput = screen.getByLabelText('Email Address') as HTMLInputElement
      await user.type(emailInput, 'test@example.com')
      expect(emailInput.value).toBe('test@example.com')

      // Switch mode
      const switchButton = screen.getByText('Sign In')
      await user.click(switchButton)

      // Check form is reset
      const newEmailInput = screen.getByLabelText('Email Address') as HTMLInputElement
      expect(newEmailInput.value).toBe('')
    })

    it('should reset password visibility when switching modes', async () => {
      const user = userEvent.setup()
      renderWithRouter(
        <SignInModal isOpen={true} onClose={mockOnClose} initialMode="signin" />
      )

      // Show password
      const toggleButton = screen.getByLabelText('Show password')
      await user.click(toggleButton)
      
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement
      expect(passwordInput.type).toBe('text')

      // Switch mode
      const switchButton = screen.getByText('Get Started Today')
      await user.click(switchButton)

      // Password should be hidden again
      const newPasswordInput = screen.getByLabelText('Password') as HTMLInputElement
      expect(newPasswordInput.type).toBe('password')
    })
  })

  describe('Form Submission', () => {
    it('should call onAuthenticated and onClose on form submit', async () => {
      const user = userEvent.setup()
      renderWithRouter(
        <SignInModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onAuthenticated={mockOnAuthenticated}
          initialMode="signin"
        />
      )

      const emailInput = screen.getByLabelText('Email Address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByText('Sign In')

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnAuthenticated).toHaveBeenCalledTimes(1)
        expect(mockOnClose).toHaveBeenCalledTimes(1)
      })
    })

    it('should navigate to dashboard on successful submission', async () => {
      const user = userEvent.setup()
      renderWithRouter(
        <SignInModal 
          isOpen={true} 
          onClose={mockOnClose}
          initialMode="signin"
        />
      )

      const submitButton = screen.getByText('Sign In')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should prevent default form submission', async () => {
      renderWithRouter(
        <SignInModal isOpen={true} onClose={mockOnClose} />
      )

      const form = screen.getByText('Create Account').closest('form')
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
      const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault')
      
      form?.dispatchEvent(submitEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })

  describe('Google Sign In', () => {
    it('should render Google sign in button', () => {
      renderWithRouter(
        <SignInModal isOpen={true} onClose={mockOnClose} />
      )
      expect(screen.getByText('Continue with Google')).toBeInTheDocument()
    })

    it('should handle Google sign in click', async () => {
      const user = userEvent.setup()
      const consoleSpy = vi.spyOn(console, 'log')
      
      renderWithRouter(
        <SignInModal isOpen={true} onClose={mockOnClose} />
      )

      const googleButton = screen.getByText('Continue with Google')
      await user.click(googleButton)

      expect(consoleSpy).toHaveBeenCalledWith('Google sign in clicked')
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria labels for buttons', () => {
      renderWithRouter(
        <SignInModal isOpen={true} onClose={mockOnClose} />
      )

      expect(screen.getByLabelText('Close modal')).toBeInTheDocument()
      expect(screen.getByLabelText('Show password')).toBeInTheDocument()
    })

    it('should have proper form labels', () => {
      renderWithRouter(
        <SignInModal isOpen={true} onClose={mockOnClose} initialMode="signup" />
      )

      expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    })

    it('should have proper input placeholders', () => {
      renderWithRouter(
        <SignInModal isOpen={true} onClose={mockOnClose} initialMode="signup" />
      )

      expect(screen.getByPlaceholderText('e.g., Thabo Molefe')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('e.g., thabo@company.co.za')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Create a strong password')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Re-enter your password')).toBeInTheDocument()
    })
  })

  describe('Conditional Rendering', () => {
    it('should show correct button text based on mode', () => {
      const { rerender } = renderWithRouter(
        <SignInModal isOpen={true} onClose={mockOnClose} initialMode="signin" />
      )
      expect(screen.getByText('Sign In')).toBeInTheDocument()

      rerender(
        <BrowserRouter>
          <SignInModal isOpen={true} onClose={mockOnClose} initialMode="signup" />
        </BrowserRouter>
      )
      expect(screen.getByText('Create Account')).toBeInTheDocument()
    })

    it('should show correct mode switch text', () => {
      const { rerender } = renderWithRouter(
        <SignInModal isOpen={true} onClose={mockOnClose} initialMode="signin" />
      )
      expect(screen.getByText("Don't have an account?")).toBeInTheDocument()
      expect(screen.getByText('Get Started Today')).toBeInTheDocument()

      rerender(
        <BrowserRouter>
          <SignInModal isOpen={true} onClose={mockOnClose} initialMode="signup" />
        </BrowserRouter>
      )
      expect(screen.getByText('Already have an account?')).toBeInTheDocument()
      expect(screen.getByText('Sign In')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing onAuthenticated callback', async () => {
      const user = userEvent.setup()
      renderWithRouter(
        <SignInModal isOpen={true} onClose={mockOnClose} />
      )

      const submitButton = screen.getByText('Create Account')
      await user.click(submitButton)

      // Should not throw error
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('should render with portal to document.body', () => {
      renderWithRouter(
        <SignInModal isOpen={true} onClose={mockOnClose} />
      )

      const modal = document.querySelector('.signin-modal')
      expect(modal?.parentElement).toBe(document.body)
    })
  })
})

// Made with Bob
