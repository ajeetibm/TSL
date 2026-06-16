import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContactSection } from './ContactSection'

describe('ContactSection', () => {
  describe('Rendering', () => {
    it('should render the section with id="contact"', () => {
      const { container } = render(<ContactSection />)
      
      const section = container.querySelector('section#contact')
      expect(section).toBeInTheDocument()
    })

    it('should render the section header', () => {
      render(<ContactSection />)
      
      expect(screen.getByText('Get In Touch')).toBeInTheDocument()
      expect(screen.getByText("Let's Start Your Legal Journey")).toBeInTheDocument()
    })

    it('should render the subtitle', () => {
      render(<ContactSection />)
      
      expect(screen.getByText(/Book your free 15-minute consultation/i)).toBeInTheDocument()
    })

    it('should render all contact cards', () => {
      render(<ContactSection />)
      
      expect(screen.getByText('Phone')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Office')).toBeInTheDocument()
      expect(screen.getByText('Hours')).toBeInTheDocument()
    })

    it('should render contact information', () => {
      render(<ContactSection />)
      
      expect(screen.getByText('+27 (0) 11 123 4567')).toBeInTheDocument()
      expect(screen.getByText('hello@thestartuplegal.co.za')).toBeInTheDocument()
      expect(screen.getByText('Sandton, Johannesburg, South Africa')).toBeInTheDocument()
      expect(screen.getByText('Mon - Fri: 8:00 AM - 6:00 PM')).toBeInTheDocument()
    })

    it('should render Quick Response card', () => {
      render(<ContactSection />)
      
      expect(screen.getByText('Quick Response')).toBeInTheDocument()
      expect(screen.getByText(/Our team typically responds within 2-4 hours/i)).toBeInTheDocument()
      expect(screen.getByText('Available Now')).toBeInTheDocument()
    })
  })

  describe('Form Fields', () => {
    it('should render all form fields', () => {
      render(<ContactSection />)
      
      expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Company Name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Message/i)).toBeInTheDocument()
    })

    it('should mark required fields', () => {
      render(<ContactSection />)
      
      expect(screen.getByText(/Full Name \*/i)).toBeInTheDocument()
      expect(screen.getByText(/Email Address \*/i)).toBeInTheDocument()
      expect(screen.getByText(/Message \*/i)).toBeInTheDocument()
    })

    it('should have proper input types', () => {
      render(<ContactSection />)
      
      const emailInput = screen.getByLabelText(/Email Address/i)
      const phoneInput = screen.getByLabelText(/Phone Number/i)
      
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(phoneInput).toHaveAttribute('type', 'tel')
    })

    it('should have placeholders', () => {
      render(<ContactSection />)
      
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('john@example.com')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('+27 82 123 4567')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Your Company (Pty) Ltd')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Tell us about your legal needs...')).toBeInTheDocument()
    })

    it('should render textarea for message', () => {
      render(<ContactSection />)
      
      const messageField = screen.getByLabelText(/Message/i)
      expect(messageField.tagName).toBe('TEXTAREA')
    })
  })

  describe('Form Interactions', () => {
    it('should allow typing in form fields', async () => {
      const user = userEvent.setup()
      render(<ContactSection />)
      
      const nameInput = screen.getByLabelText(/Full Name/i) as HTMLInputElement
      const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement
      
      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')
      
      expect(nameInput.value).toBe('John Doe')
      expect(emailInput.value).toBe('john@example.com')
    })

    it('should allow typing in textarea', async () => {
      const user = userEvent.setup()
      render(<ContactSection />)
      
      const messageField = screen.getByLabelText(/Message/i) as HTMLTextAreaElement
      await user.type(messageField, 'Test message')
      
      expect(messageField.value).toBe('Test message')
    })
  })

  describe('Submit Button', () => {
    it('should render submit button', () => {
      render(<ContactSection />)
      
      const button = screen.getByRole('button', { name: /Send Message/i })
      expect(button).toBeInTheDocument()
    })

    it('should have Send icon', () => {
      render(<ContactSection />)
      
      const button = screen.getByRole('button', { name: /Send Message/i })
      expect(button.querySelector('svg')).toBeInTheDocument()
    })

    it('should be clickable', async () => {
      const user = userEvent.setup()
      render(<ContactSection />)
      
      const button = screen.getByRole('button', { name: /Send Message/i })
      await user.click(button)
      
      // Button should remain in document after click
      expect(button).toBeInTheDocument()
    })

    it('should have type="button"', () => {
      render(<ContactSection />)
      
      const button = screen.getByRole('button', { name: /Send Message/i })
      expect(button).toHaveAttribute('type', 'button')
    })
  })

  describe('Contact Cards', () => {
    it('should render all contact cards as articles', () => {
      const { container } = render(<ContactSection />)
      
      const articles = container.querySelectorAll('article')
      expect(articles.length).toBeGreaterThanOrEqual(4)
    })

    it('should have icons for all contact cards', () => {
      render(<ContactSection />)
      
      const phoneCard = screen.getByText('Phone').closest('article')
      const emailCard = screen.getByText('Email').closest('article')
      const officeCard = screen.getByText('Office').closest('article')
      const hoursCard = screen.getByText('Hours').closest('article')
      
      expect(phoneCard?.querySelector('svg')).toBeInTheDocument()
      expect(emailCard?.querySelector('svg')).toBeInTheDocument()
      expect(officeCard?.querySelector('svg')).toBeInTheDocument()
      expect(hoursCard?.querySelector('svg')).toBeInTheDocument()
    })

    it('should have gold icon backgrounds', () => {
      render(<ContactSection />)
      
      const phoneCard = screen.getByText('Phone').closest('article')
      const iconContainer = phoneCard?.querySelector('.bg-gold')
      expect(iconContainer).toBeInTheDocument()
    })
  })

  describe('Layout and Structure', () => {
    it('should have navy-primary background', () => {
      const { container } = render(<ContactSection />)
      
      const section = container.querySelector('section')
      expect(section).toHaveClass('bg-navy-primary')
    })

    it('should have white text', () => {
      const { container } = render(<ContactSection />)
      
      const section = container.querySelector('section')
      expect(section).toHaveClass('text-white')
    })

    it('should have proper padding', () => {
      const { container } = render(<ContactSection />)
      
      const section = container.querySelector('section')
      expect(section).toHaveClass('py-20')
      expect(section).toHaveClass('lg:py-24')
    })

    it('should have grid layout', () => {
      const { container } = render(<ContactSection />)
      
      const grid = container.querySelector('.lg\\:grid-cols-\\[1fr_0\\.48fr\\]')
      expect(grid).toBeInTheDocument()
    })
  })

  describe('Form Styling', () => {
    it('should have proper form styling', () => {
      const { container } = render(<ContactSection />)
      
      const form = container.querySelector('form')
      expect(form).toHaveClass('rounded-[24px]')
      expect(form).toHaveClass('bg-[#253342]')
      expect(form).toHaveClass('border')
    })

    it('should have proper input styling', () => {
      render(<ContactSection />)
      
      const input = screen.getByLabelText(/Full Name/i)
      expect(input).toHaveClass('rounded-[22px]')
      expect(input).toHaveClass('bg-white/10')
      expect(input).toHaveClass('border')
    })

    it('should have focus styles on inputs', () => {
      render(<ContactSection />)
      
      const input = screen.getByLabelText(/Full Name/i)
      expect(input).toHaveClass('focus:border-gold')
    })
  })

  describe('Privacy Notice', () => {
    it('should render privacy notice', () => {
      render(<ContactSection />)
      
      expect(screen.getByText(/By submitting this form/i)).toBeInTheDocument()
    })

    it('should mention Privacy Policy and Terms of Service', () => {
      render(<ContactSection />)
      
      const notice = screen.getByText(/Privacy Policy and Terms of Service/i)
      expect(notice).toBeInTheDocument()
    })
  })

  describe('Quick Response Card', () => {
    it('should have proper styling', () => {
      render(<ContactSection />)
      
      const card = screen.getByText('Quick Response').closest('article')
      expect(card).toHaveClass('rounded-[24px]')
      expect(card).toHaveClass('bg-[#253342]')
    })

    it('should have CheckCircle2 icon', () => {
      render(<ContactSection />)
      
      const availableNow = screen.getByText('Available Now')
      const icon = availableNow.closest('p')?.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should have green color for Available Now', () => {
      render(<ContactSection />)
      
      const availableNow = screen.getByText('Available Now')
      expect(availableNow).toHaveClass('text-[#2ee56f]')
    })
  })

  describe('Background Effects', () => {
    it('should have gradient overlay', () => {
      const { container } = render(<ContactSection />)
      
      const gradient = container.querySelector('[class*="radial-gradient"]')
      expect(gradient).toBeInTheDocument()
    })

    it('should have blur effects', () => {
      const { container } = render(<ContactSection />)
      
      const blurElements = container.querySelectorAll('[class*="blur"]')
      expect(blurElements.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('should use semantic section element', () => {
      const { container } = render(<ContactSection />)
      
      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()
    })

    it('should use semantic form element', () => {
      const { container } = render(<ContactSection />)
      
      const form = container.querySelector('form')
      expect(form).toBeInTheDocument()
    })

    it('should use semantic aside element', () => {
      const { container } = render(<ContactSection />)
      
      const aside = container.querySelector('aside')
      expect(aside).toBeInTheDocument()
    })

    it('should have proper heading hierarchy', () => {
      render(<ContactSection />)
      
      const h2 = screen.getByRole('heading', { level: 2 })
      expect(h2).toBeInTheDocument()
      
      const h3s = screen.getAllByRole('heading', { level: 3 })
      expect(h3s.length).toBeGreaterThan(0)
    })

    it('should have labels for all form fields', () => {
      render(<ContactSection />)
      
      expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Company Name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Message/i)).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive grid', () => {
      const { container } = render(<ContactSection />)
      
      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('lg:grid-cols-[1fr_0.48fr]')
    })

    it('should have responsive padding', () => {
      const { container } = render(<ContactSection />)
      
      const section = container.querySelector('section')
      expect(section).toHaveClass('lg:py-24')
    })

    it('should have responsive form padding', () => {
      const { container } = render(<ContactSection />)
      
      const form = container.querySelector('form')
      expect(form).toHaveClass('md:p-12')
    })

    it('should have responsive form grid', () => {
      const { container } = render(<ContactSection />)
      
      const formGrid = container.querySelector('.md\\:grid-cols-2')
      expect(formGrid).toBeInTheDocument()
    })
  })

  describe('Framer Motion Integration', () => {
    it('should render motion components', () => {
      const { container } = render(<ContactSection />)
      
      expect(container.querySelector('section')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple renders', () => {
      const { rerender } = render(<ContactSection />)
      
      expect(screen.getByText('Get In Touch')).toBeInTheDocument()
      
      rerender(<ContactSection />)
      
      expect(screen.getByText('Get In Touch')).toBeInTheDocument()
    })

    it('should handle empty form submission', async () => {
      const user = userEvent.setup()
      render(<ContactSection />)
      
      const button = screen.getByRole('button', { name: /Send Message/i })
      
      // Should not throw error
      await expect(user.click(button)).resolves.not.toThrow()
    })
  })

  describe('Typography', () => {
    it('should have proper heading styles', () => {
      render(<ContactSection />)
      
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveClass('font-display')
      expect(heading).toHaveClass('font-bold')
    })

    it('should have proper label styles', () => {
      render(<ContactSection />)
      
      const label = screen.getByText(/Full Name \*/i)
      expect(label).toHaveClass('text-sm')
      expect(label).toHaveClass('font-semibold')
    })
  })

  describe('Color Scheme', () => {
    it('should use gold for icon backgrounds', () => {
      const { container } = render(<ContactSection />)
      
      const iconContainers = container.querySelectorAll('.bg-gold')
      expect(iconContainers.length).toBeGreaterThan(0)
    })

    it('should use white text', () => {
      render(<ContactSection />)
      
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveClass('text-white')
    })

    it('should use dark background for form', () => {
      const { container } = render(<ContactSection />)
      
      const form = container.querySelector('form')
      expect(form).toHaveClass('bg-[#253342]')
    })
  })
})

// Made with Bob
