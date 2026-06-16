import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DetailContactSection } from './DetailContactSection'

describe('DetailContactSection', () => {
  describe('Rendering', () => {
    it('should render the section', () => {
      const { container } = render(<DetailContactSection />)

      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()
    })

    it('should render the header badge', () => {
      render(<DetailContactSection />)

      expect(screen.getByText('Get In Touch')).toBeInTheDocument()
    })

    it('should render the main heading', () => {
      render(<DetailContactSection />)

      expect(screen.getByRole('heading', { name: "Let's Start Your Legal Journey" })).toBeInTheDocument()
    })

    it('should render the description', () => {
      render(<DetailContactSection />)

      expect(
        screen.getByText(/Book your free 15-minute consultation/i)
      ).toBeInTheDocument()
    })
  })

  describe('Contact Form', () => {
    it('should render all form fields', () => {
      render(<DetailContactSection />)

      expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Company Name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Message/i)).toBeInTheDocument()
    })

    it('should mark required fields', () => {
      render(<DetailContactSection />)

      expect(screen.getByText(/Full Name \*/i)).toBeInTheDocument()
      expect(screen.getByText(/Email Address \*/i)).toBeInTheDocument()
      expect(screen.getByText(/Message \*/i)).toBeInTheDocument()
    })

    it('should have proper placeholders', () => {
      render(<DetailContactSection />)

      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('john@example.com')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('+27 82 123 4567')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Your Company (Pty) Ltd')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Tell us about your legal needs...')).toBeInTheDocument()
    })

    it('should render submit button', () => {
      render(<DetailContactSection />)

      expect(screen.getByRole('button', { name: 'Send Message' })).toBeInTheDocument()
    })

    it('should render privacy notice', () => {
      render(<DetailContactSection />)

      expect(
        screen.getByText(/By submitting this form, you agree to our Privacy Policy/i)
      ).toBeInTheDocument()
    })

    it('should allow typing in form fields', async () => {
      const user = userEvent.setup()
      render(<DetailContactSection />)

      const nameInput = screen.getByPlaceholderText('John Doe')
      await user.type(nameInput, 'Test User')

      expect(nameInput).toHaveValue('Test User')
    })
  })

  describe('Contact Cards', () => {
    it('should render Phone contact card', () => {
      render(<DetailContactSection />)

      expect(screen.getByText('Phone')).toBeInTheDocument()
      expect(screen.getByText('+27 (0) 11 123 4567')).toBeInTheDocument()
    })

    it('should render Email contact card', () => {
      render(<DetailContactSection />)

      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('hello@thestartupalegal.co.za')).toBeInTheDocument()
    })

    it('should render Office contact card', () => {
      render(<DetailContactSection />)

      expect(screen.getByText('Office')).toBeInTheDocument()
      expect(screen.getByText('Sandton, Johannesburg, South Africa')).toBeInTheDocument()
    })

    it('should render Hours contact card', () => {
      render(<DetailContactSection />)

      expect(screen.getByText('Hours')).toBeInTheDocument()
      expect(screen.getByText('Mon - Fri: 8:00 AM - 6:00 PM')).toBeInTheDocument()
    })

    it('should render all four contact cards', () => {
      const { container } = render(<DetailContactSection />)

      const cards = container.querySelectorAll('.detail-contact__cards article')
      expect(cards).toHaveLength(5) // 4 contact cards + 1 response card
    })
  })

  describe('Quick Response Card', () => {
    it('should render Quick Response heading', () => {
      render(<DetailContactSection />)

      expect(screen.getByRole('heading', { name: 'Quick Response' })).toBeInTheDocument()
    })

    it('should render response time information', () => {
      render(<DetailContactSection />)

      expect(
        screen.getByText(/Our team typically responds within 2-4 hours/i)
      ).toBeInTheDocument()
    })

    it('should render Available Now status', () => {
      render(<DetailContactSection />)

      expect(screen.getByText('Available Now')).toBeInTheDocument()
    })

    it('should render Send icon', () => {
      const { container } = render(<DetailContactSection />)

      const responseCard = container.querySelector('.detail-contact__response')
      const svg = responseCard?.querySelector('svg')
      expect(svg).toHaveClass('lucide-send')
    })
  })

  describe('Icons', () => {
    it('should render Mail icon in header badge', () => {
      const { container } = render(<DetailContactSection />)

      const headerBadge = container.querySelector('.detail-contact__header span')
      const svg = headerBadge?.querySelector('svg')
      expect(svg).toHaveClass('lucide-mail')
    })

    it('should render Phone icon', () => {
      const { container } = render(<DetailContactSection />)

      const icons = container.querySelectorAll('svg.lucide-phone')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should render Mail icon in contact cards', () => {
      const { container } = render(<DetailContactSection />)

      const icons = container.querySelectorAll('svg.lucide-mail')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should render MapPin icon', () => {
      const { container } = render(<DetailContactSection />)

      const icons = container.querySelectorAll('svg.lucide-map-pin')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should render Clock3 icon', () => {
      const { container } = render(<DetailContactSection />)

      const icons = container.querySelectorAll('svg.lucide-clock-3')
      expect(icons.length).toBeGreaterThan(0)
    })
  })

  describe('Styling Classes', () => {
    it('should have detail-contact class', () => {
      const { container } = render(<DetailContactSection />)

      const section = container.querySelector('section')
      expect(section).toHaveClass('detail-contact')
    })

    it('should have detail-contact__inner class', () => {
      const { container } = render(<DetailContactSection />)

      const inner = container.querySelector('.detail-contact__inner')
      expect(inner).toBeInTheDocument()
    })

    it('should have detail-contact__header class', () => {
      const { container } = render(<DetailContactSection />)

      const header = container.querySelector('.detail-contact__header')
      expect(header).toBeInTheDocument()
    })

    it('should have detail-contact__content class', () => {
      const { container } = render(<DetailContactSection />)

      const content = container.querySelector('.detail-contact__content')
      expect(content).toBeInTheDocument()
    })

    it('should have detail-contact__form class', () => {
      const { container } = render(<DetailContactSection />)

      const form = container.querySelector('.detail-contact__form')
      expect(form).toBeInTheDocument()
    })

    it('should have detail-contact__cards class', () => {
      const { container } = render(<DetailContactSection />)

      const cards = container.querySelector('.detail-contact__cards')
      expect(cards).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<DetailContactSection />)

      const h2 = screen.getByRole('heading', { level: 2 })
      const h3 = screen.getByRole('heading', { level: 3 })

      expect(h2).toBeInTheDocument()
      expect(h3).toBeInTheDocument()
    })

    it('should have labels for form inputs', () => {
      render(<DetailContactSection />)

      expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Company Name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Message/i)).toBeInTheDocument()
    })

    it('should use semantic HTML', () => {
      const { container } = render(<DetailContactSection />)

      expect(container.querySelector('section')).toBeInTheDocument()
      expect(container.querySelector('header')).toBeInTheDocument()
      expect(container.querySelector('form')).toBeInTheDocument()
      expect(container.querySelector('aside')).toBeInTheDocument()
    })

    it('should have article elements for contact cards', () => {
      const { container } = render(<DetailContactSection />)

      const articles = container.querySelectorAll('article')
      expect(articles.length).toBeGreaterThan(0)
    })
  })

  describe('Form Structure', () => {
    it('should have form grid for inputs', () => {
      const { container } = render(<DetailContactSection />)

      const grid = container.querySelector('.detail-contact__form-grid')
      expect(grid).toBeInTheDocument()
    })

    it('should have message textarea separate from grid', () => {
      const { container } = render(<DetailContactSection />)

      const messageLabel = container.querySelector('.detail-contact__message')
      expect(messageLabel).toBeInTheDocument()
    })

    it('should render button with type button', () => {
      render(<DetailContactSection />)

      const button = screen.getByRole('button', { name: 'Send Message' })
      expect(button).toHaveAttribute('type', 'button')
    })
  })

  describe('Contact Card Structure', () => {
    it('should have icon span in each card', () => {
      const { container } = render(<DetailContactSection />)

      const cards = container.querySelectorAll('.detail-contact__cards article')
      cards.forEach((card) => {
        const iconSpan = card.querySelector('span')
        expect(iconSpan).toBeInTheDocument()
      })
    })

    it('should have small element for labels', () => {
      const { container } = render(<DetailContactSection />)

      const smalls = container.querySelectorAll('.detail-contact__cards small')
      expect(smalls.length).toBeGreaterThan(0)
    })

    it('should have strong element for values', () => {
      const { container } = render(<DetailContactSection />)

      const strongs = container.querySelectorAll('.detail-contact__cards strong')
      expect(strongs.length).toBeGreaterThan(0)
    })
  })

  describe('Responsive Design', () => {
    it('should maintain structure across viewports', () => {
      const viewports = [320, 720, 1050, 1280]

      viewports.forEach((width) => {
        window.innerWidth = width
        window.dispatchEvent(new Event('resize'))

        const { container } = render(<DetailContactSection />)
        expect(container.querySelector('.detail-contact')).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should render without errors', () => {
      expect(() => render(<DetailContactSection />)).not.toThrow()
    })

    it('should handle form submission', async () => {
      const user = userEvent.setup()
      render(<DetailContactSection />)

      const button = screen.getByRole('button', { name: 'Send Message' })
      await user.click(button)

      // Should not throw error
      expect(button).toBeInTheDocument()
    })
  })
})

// Made with Bob
