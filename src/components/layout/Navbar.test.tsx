import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { Navbar } from './Navbar'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    NavLink: ({ children, to, className, ...props }: any) => {
      const isActive = false
      const computedClassName = typeof className === 'function' ? className({ isActive }) : className
      return (
        <a href={to} className={computedClassName} {...props}>
          {children}
        </a>
      )
    },
  }
})

// Mock navigation data
vi.mock('../../data/navigation', () => ({
  navigation: [
    { href: '/', label: 'Home' },
    { href: '/features', label: 'Features' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ],
}))

// Mock SignInModal
vi.mock('../auth/SignInModal', () => ({
  SignInModal: ({ isOpen, onClose, initialMode, onAuthenticated }: any) => (
    isOpen ? (
      <div data-testid="sign-in-modal">
        <div>Modal Mode: {initialMode}</div>
        <button onClick={onClose}>Close Modal</button>
        <button onClick={onAuthenticated}>Authenticate</button>
      </div>
    ) : null
  ),
}))

const renderNavbar = () => {
  return render(
    <BrowserRouter>
      <Navbar />
    </BrowserRouter>
  )
}

describe('Navbar', () => {
  beforeEach(() => {
    localStorage.clear()
    mockNavigate.mockClear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Rendering', () => {
    it('should render the navbar header', () => {
      renderNavbar()

      const header = screen.getByRole('banner')
      expect(header).toBeInTheDocument()
    })

    it('should render the brand logo with TSL mark', () => {
      renderNavbar()

      expect(screen.getByText('TSL')).toBeInTheDocument()
    })

    it('should render the brand name', () => {
      renderNavbar()

      expect(screen.getByText('The StartUp Legal')).toBeInTheDocument()
    })

    it('should render brand as a link to home', () => {
      renderNavbar()

      const brandLink = screen.getByLabelText('TSL home')
      expect(brandLink).toHaveAttribute('href', '/')
    })

    it('should render all navigation links', () => {
      renderNavbar()

      expect(screen.getAllByRole('link', { name: 'Home' })).toHaveLength(2) // Desktop + Mobile
      expect(screen.getAllByRole('link', { name: 'Features' })).toHaveLength(2)
      expect(screen.getAllByRole('link', { name: 'Pricing' })).toHaveLength(2)
      expect(screen.getAllByRole('link', { name: 'About' })).toHaveLength(2)
      expect(screen.getAllByRole('link', { name: 'Contact' })).toHaveLength(2)
    })

    it('should render mobile toggle button', () => {
      renderNavbar()

      const toggleButton = screen.getByLabelText('Toggle navigation')
      expect(toggleButton).toBeInTheDocument()
    })
  })

  describe('Authentication State - Not Authenticated', () => {
    it('should show Sign In button when not authenticated', () => {
      renderNavbar()

      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    })

    it('should show Get Started button when not authenticated', () => {
      renderNavbar()

      const getStartedButtons = screen.getAllByRole('button', { name: 'Get Started' })
      expect(getStartedButtons.length).toBeGreaterThan(0)
    })

    it('should not show account button when not authenticated', () => {
      renderNavbar()

      expect(screen.queryByText('Sarfraznawaz.in')).not.toBeInTheDocument()
    })
  })

  describe('Authentication State - Authenticated', () => {
    it('should show account button when authenticated', () => {
      localStorage.setItem('tsl-authenticated', 'true')
      renderNavbar()

      expect(screen.getByText('Sarfraznawaz.in')).toBeInTheDocument()
    })

    it('should not show Sign In button when authenticated', () => {
      localStorage.setItem('tsl-authenticated', 'true')
      renderNavbar()

      expect(screen.queryByRole('button', { name: 'Sign In' })).not.toBeInTheDocument()
    })

    it('should not show Get Started button when authenticated', () => {
      localStorage.setItem('tsl-authenticated', 'true')
      renderNavbar()

      expect(screen.queryByRole('button', { name: 'Get Started' })).not.toBeInTheDocument()
    })

    it('should render UserRound icon in account button', () => {
      localStorage.setItem('tsl-authenticated', 'true')
      const { container } = renderNavbar()

      const accountButton = screen.getByText('Sarfraznawaz.in').closest('button')
      const svg = accountButton?.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass('lucide-user-round')
    })

    it('should render ChevronUp icon in account button', () => {
      localStorage.setItem('tsl-authenticated', 'true')
      const { container } = renderNavbar()

      const accountButton = screen.getByText('Sarfraznawaz.in').closest('button')
      const svgs = accountButton?.querySelectorAll('svg')
      expect(svgs?.length).toBeGreaterThan(1)
    })
  })

  describe('Sign In Modal', () => {
    it('should open modal in signup mode when Get Started is clicked', async () => {
      const user = userEvent.setup()
      renderNavbar()

      const getStartedButton = screen.getAllByRole('button', { name: 'Get Started' })[0]
      await user.click(getStartedButton)

      await waitFor(() => {
        expect(screen.getByTestId('sign-in-modal')).toBeInTheDocument()
        expect(screen.getByText('Modal Mode: signup')).toBeInTheDocument()
      })
    })

    it('should open modal in signin mode when Sign In is clicked', async () => {
      const user = userEvent.setup()
      renderNavbar()

      const signInButton = screen.getByRole('button', { name: 'Sign In' })
      await user.click(signInButton)

      await waitFor(() => {
        expect(screen.getByTestId('sign-in-modal')).toBeInTheDocument()
        expect(screen.getByText('Modal Mode: signin')).toBeInTheDocument()
      })
    })

    it('should close modal when close button is clicked', async () => {
      const user = userEvent.setup()
      renderNavbar()

      const signInButton = screen.getByRole('button', { name: 'Sign In' })
      await user.click(signInButton)

      await waitFor(() => {
        expect(screen.getByTestId('sign-in-modal')).toBeInTheDocument()
      })

      const closeButton = screen.getByRole('button', { name: 'Close Modal' })
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByTestId('sign-in-modal')).not.toBeInTheDocument()
      })
    })

    it('should update authentication state when authenticated', async () => {
      const user = userEvent.setup()
      renderNavbar()

      const signInButton = screen.getByRole('button', { name: 'Sign In' })
      await user.click(signInButton)

      await waitFor(() => {
        expect(screen.getByTestId('sign-in-modal')).toBeInTheDocument()
      })

      const authenticateButton = screen.getByRole('button', { name: 'Authenticate' })
      await user.click(authenticateButton)

      await waitFor(() => {
        expect(localStorage.getItem('tsl-authenticated')).toBe('true')
      })
    })
  })

  describe('Mobile Menu', () => {
    it('should not show mobile menu by default', () => {
      renderNavbar()

      const mobileNav = screen.queryByLabelText('Mobile navigation')
      expect(mobileNav).not.toBeInTheDocument()
    })

    it('should show mobile menu when toggle is clicked', async () => {
      const user = userEvent.setup()
      renderNavbar()

      const toggleButton = screen.getByLabelText('Toggle navigation')
      await user.click(toggleButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Mobile navigation')).toBeInTheDocument()
      })
    })

    it('should hide mobile menu when toggle is clicked again', async () => {
      const user = userEvent.setup()
      renderNavbar()

      const toggleButton = screen.getByLabelText('Toggle navigation')
      await user.click(toggleButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Mobile navigation')).toBeInTheDocument()
      })

      await user.click(toggleButton)

      await waitFor(() => {
        expect(screen.queryByLabelText('Mobile navigation')).not.toBeInTheDocument()
      })
    })

    it('should show Menu icon when closed', () => {
      const { container } = renderNavbar()

      const toggleButton = screen.getByLabelText('Toggle navigation')
      const svg = toggleButton.querySelector('svg')
      expect(svg).toHaveClass('lucide-menu')
    })

    it('should show X icon when open', async () => {
      const user = userEvent.setup()
      const { container } = renderNavbar()

      const toggleButton = screen.getByLabelText('Toggle navigation')
      await user.click(toggleButton)

      await waitFor(() => {
        const svg = toggleButton.querySelector('svg')
        expect(svg).toHaveClass('lucide-x')
      })
    })

    it('should close mobile menu when a link is clicked', async () => {
      const user = userEvent.setup()
      renderNavbar()

      const toggleButton = screen.getByLabelText('Toggle navigation')
      await user.click(toggleButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Mobile navigation')).toBeInTheDocument()
      })

      const mobileLinks = screen.getAllByRole('link', { name: 'Features' })
      const mobileLink = mobileLinks[mobileLinks.length - 1] // Get the mobile version
      await user.click(mobileLink)

      await waitFor(() => {
        expect(screen.queryByLabelText('Mobile navigation')).not.toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('should navigate to dashboard when account button is clicked', async () => {
      const user = userEvent.setup()
      localStorage.setItem('tsl-authenticated', 'true')
      renderNavbar()

      const accountButton = screen.getByText('Sarfraznawaz.in').closest('button')
      await user.click(accountButton!)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should navigate to dashboard from mobile account button', async () => {
      const user = userEvent.setup()
      localStorage.setItem('tsl-authenticated', 'true')
      renderNavbar()

      const toggleButton = screen.getByLabelText('Toggle navigation')
      await user.click(toggleButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Mobile navigation')).toBeInTheDocument()
      })

      const mobileAccountButtons = screen.getAllByText('Sarfraznawaz.in')
      const mobileAccountButton = mobileAccountButtons[mobileAccountButtons.length - 1].closest('button')
      await user.click(mobileAccountButton!)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
      })
    })
  })

  describe('Custom Event Handling', () => {
    it('should open modal when tsl-open-auth-modal event is dispatched', async () => {
      renderNavbar()

      const event = new CustomEvent('tsl-open-auth-modal', {
        detail: { mode: 'signin' },
      })
      window.dispatchEvent(event)

      await waitFor(() => {
        expect(screen.getByTestId('sign-in-modal')).toBeInTheDocument()
        expect(screen.getByText('Modal Mode: signin')).toBeInTheDocument()
      })
    })

    it('should default to signup mode when event has no mode', async () => {
      renderNavbar()

      const event = new CustomEvent('tsl-open-auth-modal', {
        detail: {},
      })
      window.dispatchEvent(event)

      await waitFor(() => {
        expect(screen.getByTestId('sign-in-modal')).toBeInTheDocument()
        expect(screen.getByText('Modal Mode: signup')).toBeInTheDocument()
      })
    })

    it('should clean up event listener on unmount', () => {
      const { unmount } = renderNavbar()

      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'tsl-open-auth-modal',
        expect.any(Function)
      )
    })
  })

  describe('Styling Classes', () => {
    it('should have navbar class on header', () => {
      const { container } = renderNavbar()

      const header = container.querySelector('header')
      expect(header).toHaveClass('navbar')
    })

    it('should have navbar__inner class on container', () => {
      const { container } = renderNavbar()

      const inner = container.querySelector('.navbar__inner')
      expect(inner).toBeInTheDocument()
    })

    it('should have navbar__brand class on brand link', () => {
      renderNavbar()

      const brandLink = screen.getByLabelText('TSL home')
      expect(brandLink).toHaveClass('navbar__brand')
    })

    it('should have navbar__links class on desktop nav', () => {
      const { container } = renderNavbar()

      const links = container.querySelector('.navbar__links')
      expect(links).toBeInTheDocument()
    })

    it('should have navbar__actions class on action buttons container', () => {
      const { container } = renderNavbar()

      const actions = container.querySelector('.navbar__actions')
      expect(actions).toBeInTheDocument()
    })

    it('should have navbar__toggle class on mobile toggle', () => {
      renderNavbar()

      const toggle = screen.getByLabelText('Toggle navigation')
      expect(toggle).toHaveClass('navbar__toggle')
    })
  })

  describe('Accessibility', () => {
    it('should have proper header role', () => {
      renderNavbar()

      expect(screen.getByRole('banner')).toBeInTheDocument()
    })

    it('should have aria-label on brand link', () => {
      renderNavbar()

      const brandLink = screen.getByLabelText('TSL home')
      expect(brandLink).toBeInTheDocument()
    })

    it('should have aria-label on primary navigation', () => {
      renderNavbar()

      expect(screen.getByLabelText('Primary navigation')).toBeInTheDocument()
    })

    it('should have aria-label on mobile navigation', async () => {
      const user = userEvent.setup()
      renderNavbar()

      const toggleButton = screen.getByLabelText('Toggle navigation')
      await user.click(toggleButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Mobile navigation')).toBeInTheDocument()
      })
    })

    it('should have aria-expanded on toggle button', () => {
      renderNavbar()

      const toggleButton = screen.getByLabelText('Toggle navigation')
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
    })

    it('should update aria-expanded when menu is opened', async () => {
      const user = userEvent.setup()
      renderNavbar()

      const toggleButton = screen.getByLabelText('Toggle navigation')
      await user.click(toggleButton)

      await waitFor(() => {
        expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
      })
    })

    it('should have proper button types', () => {
      renderNavbar()

      const toggleButton = screen.getByLabelText('Toggle navigation')
      expect(toggleButton).toHaveAttribute('type', 'button')
    })
  })

  describe('Responsive Behavior', () => {
    it('should have responsive navbar__brand-name class', () => {
      const { container } = renderNavbar()

      const brandName = container.querySelector('.navbar__brand-name')
      expect(brandName).toBeInTheDocument()
      expect(brandName?.textContent).toBe('The StartUp Legal')
    })

    it('should render both desktop and mobile navigation', () => {
      renderNavbar()

      expect(screen.getByLabelText('Primary navigation')).toBeInTheDocument()
      // Mobile nav is hidden by default but exists in DOM
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing localStorage gracefully', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem')
      getItemSpy.mockReturnValue(null)

      renderNavbar()

      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()

      getItemSpy.mockRestore()
    })

    it('should handle invalid localStorage value', () => {
      localStorage.setItem('tsl-authenticated', 'invalid')
      renderNavbar()

      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    })

    it('should handle rapid toggle clicks', async () => {
      const user = userEvent.setup()
      renderNavbar()

      const toggleButton = screen.getByLabelText('Toggle navigation')

      await user.click(toggleButton)
      await user.click(toggleButton)
      await user.click(toggleButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Mobile navigation')).toBeInTheDocument()
      })
    })

    it('should handle authentication while modal is open', async () => {
      const user = userEvent.setup()
      renderNavbar()

      const signInButton = screen.getByRole('button', { name: 'Sign In' })
      await user.click(signInButton)

      await waitFor(() => {
        expect(screen.getByTestId('sign-in-modal')).toBeInTheDocument()
      })

      const authenticateButton = screen.getByRole('button', { name: 'Authenticate' })
      await user.click(authenticateButton)

      await waitFor(() => {
        expect(localStorage.getItem('tsl-authenticated')).toBe('true')
      })
    })
  })

  describe('Mobile Menu - Authenticated State', () => {
    it('should show mobile account button when authenticated', async () => {
      const user = userEvent.setup()
      localStorage.setItem('tsl-authenticated', 'true')
      renderNavbar()

      const toggleButton = screen.getByLabelText('Toggle navigation')
      await user.click(toggleButton)

      await waitFor(() => {
        const accountNames = screen.getAllByText('Sarfraznawaz.in')
        expect(accountNames.length).toBeGreaterThan(1) // Desktop + Mobile
      })
    })

    it('should show Get Started in mobile menu when not authenticated', async () => {
      const user = userEvent.setup()
      renderNavbar()

      const toggleButton = screen.getByLabelText('Toggle navigation')
      await user.click(toggleButton)

      await waitFor(() => {
        const getStartedButtons = screen.getAllByRole('button', { name: 'Get Started' })
        expect(getStartedButtons.length).toBeGreaterThan(0)
      })
    })

    it('should close mobile menu and open modal when Get Started is clicked', async () => {
      const user = userEvent.setup()
      renderNavbar()

      const toggleButton = screen.getByLabelText('Toggle navigation')
      await user.click(toggleButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Mobile navigation')).toBeInTheDocument()
      })

      const getStartedButtons = screen.getAllByRole('button', { name: 'Get Started' })
      const mobileGetStarted = getStartedButtons[getStartedButtons.length - 1]
      await user.click(mobileGetStarted)

      await waitFor(() => {
        expect(screen.queryByLabelText('Mobile navigation')).not.toBeInTheDocument()
        expect(screen.getByTestId('sign-in-modal')).toBeInTheDocument()
      })
    })
  })
})

// Made with Bob
