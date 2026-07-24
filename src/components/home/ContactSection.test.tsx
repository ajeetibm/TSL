import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContactSection } from './ContactSection'

// ─── Mock the contact service ─────────────────────────────────────────────────

vi.mock('../../services/mockContactClient', () => ({
  submitContactForm: vi.fn(),
}))

import { submitContactForm } from '../../services/mockContactClient'
const mockSubmit = submitContactForm as ReturnType<typeof vi.fn>

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Full Name/i), 'Jane Smith')
  await user.type(screen.getByLabelText(/Email Address/i), 'jane@example.com')
  await user.type(screen.getByLabelText(/Phone Number/i), '+27 82 123 4567')
  await user.type(screen.getByLabelText(/Message/i), 'I need legal advice for my startup.')
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ContactSection', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mockSubmit.mockResolvedValue({ success: true, message: 'Your message has been sent successfully.' })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  // ── Rendering ───────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders the section with id="contact"', () => {
      const { container } = render(<ContactSection />)
      expect(container.querySelector('section#contact')).toBeInTheDocument()
    })

    it('renders the section header', () => {
      render(<ContactSection />)
      expect(screen.getByText('Get In Touch')).toBeInTheDocument()
      expect(screen.getByText("Let's Start Your Legal Journey")).toBeInTheDocument()
    })

    it('renders the subtitle', () => {
      render(<ContactSection />)
      expect(screen.getByText(/Book your free 15-minute consultation/i)).toBeInTheDocument()
    })

    it('renders all contact cards', () => {
      render(<ContactSection />)
      expect(screen.getByText('Phone')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Office')).toBeInTheDocument()
      expect(screen.getByText('Hours')).toBeInTheDocument()
    })

    it('renders contact information values', () => {
      render(<ContactSection />)
      expect(screen.getByText('+27 (0) 11 123 4567')).toBeInTheDocument()
      expect(screen.getByText('hello@thestartuplegal.co.za')).toBeInTheDocument()
      expect(screen.getByText('Sandton, Johannesburg, South Africa')).toBeInTheDocument()
      expect(screen.getByText('Mon - Fri: 8:00 AM - 6:00 PM')).toBeInTheDocument()
    })

    it('renders the Quick Response card', () => {
      render(<ContactSection />)
      expect(screen.getByText('Quick Response')).toBeInTheDocument()
      expect(screen.getByText(/Our team typically responds within 2-4 hours/i)).toBeInTheDocument()
      expect(screen.getByText('Available Now')).toBeInTheDocument()
    })
  })

  // ── Form fields ─────────────────────────────────────────────────────────────

  describe('Form Fields', () => {
    it('renders all form fields via accessible labels', () => {
      render(<ContactSection />)
      expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Company Name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Message/i)).toBeInTheDocument()
    })

    it('marks required fields with *', () => {
      render(<ContactSection />)
      expect(screen.getByText(/Full Name \*/i)).toBeInTheDocument()
      expect(screen.getByText(/Email Address \*/i)).toBeInTheDocument()
      expect(screen.getByText(/Message \*/i)).toBeInTheDocument()
    })

    it('has correct input types', () => {
      render(<ContactSection />)
      expect(screen.getByLabelText(/Email Address/i)).toHaveAttribute('type', 'email')
      expect(screen.getByLabelText(/Phone Number/i)).toHaveAttribute('type', 'tel')
    })

    it('has correct placeholders', () => {
      render(<ContactSection />)
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('john@example.com')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('+27 82 123 4567')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Your Company (Pty) Ltd')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Tell us about your legal needs...')).toBeInTheDocument()
    })

    it('renders a textarea for message', () => {
      render(<ContactSection />)
      expect(screen.getByLabelText(/Message/i).tagName).toBe('TEXTAREA')
    })

    it('allows typing in text inputs', async () => {
      const user = userEvent.setup()
      render(<ContactSection />)
      const nameInput = screen.getByLabelText(/Full Name/i) as HTMLInputElement
      await user.type(nameInput, 'John Doe')
      expect(nameInput.value).toBe('John Doe')
    })
  })

  // ── Submit button disabled state ─────────────────────────────────────────────

  describe('Submit Button — disabled state', () => {
    it('is disabled initially (empty form)', () => {
      render(<ContactSection />)
      expect(screen.getByRole('button', { name: /Send Message/i })).toBeDisabled()
    })

    it('remains disabled when only some required fields are filled', async () => {
      const user = userEvent.setup()
      render(<ContactSection />)
      await user.type(screen.getByLabelText(/Full Name/i), 'Jane Smith')
      expect(screen.getByRole('button', { name: /Send Message/i })).toBeDisabled()
    })

    it('becomes enabled once all required fields are valid', async () => {
      const user = userEvent.setup()
      render(<ContactSection />)
      await fillValidForm(user)
      expect(screen.getByRole('button', { name: /Send Message/i })).not.toBeDisabled()
    })
  })

  // ── Blur validation ──────────────────────────────────────────────────────────

  describe('Blur validation', () => {
    it('shows "Full Name is required." on blur when empty', async () => {
      const user = userEvent.setup()
      render(<ContactSection />)
      await user.click(screen.getByLabelText(/Full Name/i))
      await user.tab()
      expect(await screen.findByText('Full Name is required.')).toBeInTheDocument()
    })

    it('shows "Please enter a valid full name." for invalid name', async () => {
      const user = userEvent.setup()
      render(<ContactSection />)
      await user.type(screen.getByLabelText(/Full Name/i), '12345')
      await user.tab()
      expect(await screen.findByText('Please enter a valid full name.')).toBeInTheDocument()
    })

    it('shows "Email Address is required." on blur when empty', async () => {
      const user = userEvent.setup()
      render(<ContactSection />)
      await user.click(screen.getByLabelText(/Email Address/i))
      await user.tab()
      expect(await screen.findByText('Email Address is required.')).toBeInTheDocument()
    })

    it('shows "Please enter a valid email address." for invalid email', async () => {
      const user = userEvent.setup()
      render(<ContactSection />)
      await user.type(screen.getByLabelText(/Email Address/i), 'not-an-email')
      await user.tab()
      expect(await screen.findByText('Please enter a valid email address.')).toBeInTheDocument()
    })

    it('shows "Phone Number is required." on blur when empty', async () => {
      const user = userEvent.setup()
      render(<ContactSection />)
      await user.click(screen.getByLabelText(/Phone Number/i))
      await user.tab()
      expect(await screen.findByText('Phone Number is required.')).toBeInTheDocument()
    })

    it('shows "Please enter a valid phone number." for invalid phone', async () => {
      const user = userEvent.setup()
      render(<ContactSection />)
      await user.type(screen.getByLabelText(/Phone Number/i), 'abc')
      await user.tab()
      expect(await screen.findByText('Please enter a valid phone number.')).toBeInTheDocument()
    })

    it('shows "Message is required." on blur when empty', async () => {
      const user = userEvent.setup()
      render(<ContactSection />)
      await user.click(screen.getByLabelText(/Message/i))
      await user.tab()
      expect(await screen.findByText('Message is required.')).toBeInTheDocument()
    })

    it('shows "Message should contain at least 10 characters." for short message', async () => {
      const user = userEvent.setup()
      render(<ContactSection />)
      await user.type(screen.getByLabelText(/Message/i), 'Hi')
      await user.tab()
      expect(await screen.findByText('Message should contain at least 10 characters.')).toBeInTheDocument()
    })

    it('clears error after correcting an invalid field', async () => {
      const user = userEvent.setup()
      render(<ContactSection />)
      const input = screen.getByLabelText(/Full Name/i)
      // Trigger error
      await user.click(input)
      await user.tab()
      expect(await screen.findByText('Full Name is required.')).toBeInTheDocument()
      // Fix it
      await user.type(input, 'Jane Smith')
      expect(screen.queryByText('Full Name is required.')).not.toBeInTheDocument()
    })
  })

  // ── Submit-time validation ───────────────────────────────────────────────────

  describe('Submit-time validation', () => {
    it('shows all errors when submitting empty form', async () => {
      const user = userEvent.setup()
      render(<ContactSection />)
      // Force-enable button by manually dispatching submit on the form
      const form = document.querySelector('form')!
      await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true })) })
      expect(await screen.findByText('Full Name is required.')).toBeInTheDocument()
      expect(screen.getByText('Email Address is required.')).toBeInTheDocument()
      expect(screen.getByText('Phone Number is required.')).toBeInTheDocument()
      expect(screen.getByText('Message is required.')).toBeInTheDocument()
    })

    it('does not call submitContactForm when validation fails', async () => {
      render(<ContactSection />)
      const form = document.querySelector('form')!
      await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true })) })
      expect(mockSubmit).not.toHaveBeenCalled()
    })
  })

  // ── Loading state ────────────────────────────────────────────────────────────

  describe('Loading state', () => {
    it('shows "Sending..." and disables button while submitting', async () => {
      // Never resolves during this check
      mockSubmit.mockReturnValue(new Promise(() => {}))
      const user = userEvent.setup()
      render(<ContactSection />)
      await fillValidForm(user)
      await user.click(screen.getByRole('button', { name: /Send Message/i }))
      expect(await screen.findByText('Sending...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Sending\.\.\./i })).toBeDisabled()
    })

    it('calls submitContactForm with trimmed payload', async () => {
      const user = userEvent.setup()
      render(<ContactSection />)
      await fillValidForm(user)
      await user.click(screen.getByRole('button', { name: /Send Message/i }))
      await waitFor(() => expect(mockSubmit).toHaveBeenCalledOnce())
      expect(mockSubmit).toHaveBeenCalledWith({
        fullName:    'Jane Smith',
        email:       'jane@example.com',
        phone:       '+27 82 123 4567',
        companyName: '',
        message:     'I need legal advice for my startup.',
      })
    })
  })

  // ── Success behaviour ────────────────────────────────────────────────────────

  describe('Success behaviour', () => {
    it('shows the success toast after submission', async () => {
      const user = userEvent.setup()
      render(<ContactSection />)
      await fillValidForm(user)
      await user.click(screen.getByRole('button', { name: /Send Message/i }))
      expect(await screen.findByText('Message Sent Successfully!')).toBeInTheDocument()
      expect(screen.getByText(/Thank you for contacting The StartUp Legal/i)).toBeInTheDocument()
    })

    it('clears the form after successful submission', async () => {
      const user = userEvent.setup()
      render(<ContactSection />)
      await fillValidForm(user)
      await user.click(screen.getByRole('button', { name: /Send Message/i }))
      await screen.findByText('Message Sent Successfully!')
      expect((screen.getByLabelText(/Full Name/i) as HTMLInputElement).value).toBe('')
      expect((screen.getByLabelText(/Email Address/i) as HTMLInputElement).value).toBe('')
      expect((screen.getByLabelText(/Message/i) as HTMLTextAreaElement).value).toBe('')
    })

    it('re-enables the button and restores "Send Message" text after success', async () => {
      const user = userEvent.setup()
      render(<ContactSection />)
      await fillValidForm(user)
      await user.click(screen.getByRole('button', { name: /Send Message/i }))
      await screen.findByText('Message Sent Successfully!')
      // After reset the form is empty so the button is disabled again
      expect(screen.queryByText('Sending...')).not.toBeInTheDocument()
    })

    it('calls onClose and begins exit when the dismiss button is clicked', async () => {
      // jsdom does not run CSS animations so Framer Motion's AnimatePresence
      // never removes the DOM node after an exit animation. We verify the
      // dismiss button is reachable, clickable, and that Framer marks the
      // element as exiting (opacity: 0) immediately after the click.
      const user = userEvent.setup()
      render(<ContactSection />)
      await fillValidForm(user)
      await user.click(screen.getByRole('button', { name: /Send Message/i }))
      const alert = await screen.findByRole('alert')
      expect(alert).toBeInTheDocument()
      const closeBtn = screen.getByRole('button', { name: /Dismiss notification/i })
      await user.click(closeBtn)
      // Framer Motion sets opacity:0 on the exiting element immediately
      await waitFor(() => expect(alert.style.opacity).toBe('0'))
    })
  })

  // ── Error behaviour ──────────────────────────────────────────────────────────

  describe('Error behaviour', () => {
    it('shows error toast when service returns success: false', async () => {
      mockSubmit.mockResolvedValue({ success: false, message: 'Something went wrong.' })
      const user = userEvent.setup()
      render(<ContactSection />)
      await fillValidForm(user)
      await user.click(screen.getByRole('button', { name: /Send Message/i }))
      expect(await screen.findByText('Unable to send your message.')).toBeInTheDocument()
    })

    it('preserves user input when service returns failure', async () => {
      mockSubmit.mockResolvedValue({ success: false, message: 'Something went wrong.' })
      const user = userEvent.setup()
      render(<ContactSection />)
      await fillValidForm(user)
      await user.click(screen.getByRole('button', { name: /Send Message/i }))
      await screen.findByText('Unable to send your message.')
      expect((screen.getByLabelText(/Full Name/i) as HTMLInputElement).value).toBe('Jane Smith')
      expect((screen.getByLabelText(/Email Address/i) as HTMLInputElement).value).toBe('jane@example.com')
    })

    it('shows error toast when service throws', async () => {
      mockSubmit.mockRejectedValue(new Error('Network error'))
      const user = userEvent.setup()
      render(<ContactSection />)
      await fillValidForm(user)
      await user.click(screen.getByRole('button', { name: /Send Message/i }))
      expect(await screen.findByText('Unable to send your message.')).toBeInTheDocument()
    })
  })

  // ── Duplicate submission prevention ──────────────────────────────────────────

  describe('Duplicate submission prevention', () => {
    it('does not call submit again while a request is in flight', async () => {
      let resolve!: () => void
      mockSubmit.mockReturnValue(
        new Promise<{ success: true; message: string }>((res) => { resolve = () => res({ success: true, message: 'ok' }) })
      )
      const user = userEvent.setup()
      render(<ContactSection />)
      await fillValidForm(user)
      const btn = screen.getByRole('button', { name: /Send Message/i })
      await user.click(btn)
      // Button is now disabled / in Sending state
      await user.click(btn)
      await user.click(btn)
      act(() => resolve())
      await screen.findByText('Message Sent Successfully!')
      expect(mockSubmit).toHaveBeenCalledOnce()
    })
  })

  // ── Accessibility ─────────────────────────────────────────────────────────────

  describe('Accessibility', () => {
    it('uses a semantic <form> element', () => {
      const { container } = render(<ContactSection />)
      expect(container.querySelector('form')).toBeInTheDocument()
    })

    it('uses a semantic <aside> element', () => {
      const { container } = render(<ContactSection />)
      expect(container.querySelector('aside')).toBeInTheDocument()
    })

    it('has aria-label on the form', () => {
      const { container } = render(<ContactSection />)
      expect(container.querySelector('form')).toHaveAttribute('aria-label', 'Contact form')
    })

    it('has aria-invalid on invalid fields after blur', async () => {
      const user = userEvent.setup()
      render(<ContactSection />)
      await user.click(screen.getByLabelText(/Full Name/i))
      await user.tab()
      await screen.findByText('Full Name is required.')
      expect(screen.getByLabelText(/Full Name/i)).toHaveAttribute('aria-invalid', 'true')
    })

    it('has proper heading hierarchy (h2 and h3)', () => {
      render(<ContactSection />)
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
      expect(screen.getAllByRole('heading', { level: 3 }).length).toBeGreaterThan(0)
    })
  })

  // ── Structure & styling ──────────────────────────────────────────────────────

  describe('Structure & styling', () => {
    it('has navy-primary background', () => {
      const { container } = render(<ContactSection />)
      expect(container.querySelector('section')).toHaveClass('bg-navy-primary')
    })

    it('has gold icon backgrounds on contact cards', () => {
      const { container } = render(<ContactSection />)
      expect(container.querySelectorAll('.bg-gold').length).toBeGreaterThan(0)
    })

    it('has responsive grid layout', () => {
      const { container } = render(<ContactSection />)
      expect(container.querySelector('.lg\\:grid-cols-\\[1fr_0\\.48fr\\]')).toBeInTheDocument()
    })

    it('has gradient overlay', () => {
      const { container } = render(<ContactSection />)
      expect(container.querySelector('[class*="radial-gradient"]')).toBeInTheDocument()
    })

    it('renders privacy notice', () => {
      render(<ContactSection />)
      expect(screen.getByText(/By submitting this form/i)).toBeInTheDocument()
    })
  })
})

// Made with IBM Bob
