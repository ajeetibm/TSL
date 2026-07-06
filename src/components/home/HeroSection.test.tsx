import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HeroSection } from './HeroSection'

describe('HeroSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the main heading', () => {
      render(<HeroSection />)
      
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Simplifying the Law for South African SMEs'
      )
    })

    it('should render the subtitle', () => {
      render(<HeroSection />)
      
      expect(screen.getByText(/We turn legal language into plain language/i)).toBeInTheDocument()
    })

    it('should render the tagline', () => {
      render(<HeroSection />)
      
      expect(screen.getByText(/Legal confidence starts here/i)).toBeInTheDocument()
    })

    it('should render the stats badge', () => {
      render(<HeroSection />)
      
      expect(screen.getByText('300+ SA SMEs Empowered')).toBeInTheDocument()
      expect(screen.getByText('Your legal partner, not just your lawyer')).toBeInTheDocument()
    })

    it('should render all feature tags', () => {
      render(<HeroSection />)
      
      expect(screen.getByText('Legal Templates')).toBeInTheDocument()
      expect(screen.getByText('SME Consulting')).toBeInTheDocument()
      expect(screen.getByText('Legal Education')).toBeInTheDocument()
      expect(screen.getByText('LegalTech Solutions')).toBeInTheDocument()
    })

    it('should render all benefit items', () => {
      render(<HeroSection />)
      
      expect(screen.getByText('Clear & Approachable')).toBeInTheDocument()
      expect(screen.getByText('Empowering Solutions')).toBeInTheDocument()
      expect(screen.getByText('Affordable Pricing')).toBeInTheDocument()
    })
  })

  describe('Call-to-Action Buttons', () => {
    it('should render Get Started button', () => {
      render(<HeroSection />)
      
      const button = screen.getByRole('button', { name: /Get Started Today/i })
      expect(button).toBeInTheDocument()
    })

    it('should render Learn More link', () => {
      render(<HeroSection />)
      
      const link = screen.getByRole('link', { name: /Learn More/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '#about')
    })

    it('should dispatch custom event when Get Started is clicked', async () => {
      const user = userEvent.setup()
      const eventSpy = vi.fn()
      
      window.addEventListener('tsl-open-auth-modal', eventSpy)
      
      render(<HeroSection />)
      
      const button = screen.getByRole('button', { name: /Get Started Today/i })
      await user.click(button)
      
      expect(eventSpy).toHaveBeenCalledTimes(1)
      expect(eventSpy.mock.calls[0][0]).toBeInstanceOf(CustomEvent)
      expect((eventSpy.mock.calls[0][0] as CustomEvent).detail).toEqual({ mode: 'signup' })
      
      window.removeEventListener('tsl-open-auth-modal', eventSpy)
    })
  })

  describe('Icons', () => {
    it('should render Scale icon in stats badge', () => {
      render(<HeroSection />)
      
      const badge = screen.getByText('300+ SA SMEs Empowered').closest('div')
      const svg = badge?.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should render icons for all feature tags', () => {
      const { container } = render(<HeroSection />)
      
      // Each tag should have an icon (4 tags)
      const tagIcons = container.querySelectorAll('svg')
      expect(tagIcons.length).toBeGreaterThanOrEqual(4)
    })

    it('should render Check icons for benefit items', () => {
      render(<HeroSection />)
      
      const benefits = ['Clear & Approachable', 'Empowering Solutions', 'Affordable Pricing']
      benefits.forEach(benefit => {
        const item = screen.getByText(benefit).closest('span')
        expect(item?.querySelector('svg')).toBeInTheDocument()
      })
    })

    it('should render ArrowRight icon in Get Started button', () => {
      render(<HeroSection />)
      
      const button = screen.getByRole('button', { name: /Get Started Today/i })
      expect(button.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Layout and Structure', () => {
    it('should have section with id="home"', () => {
      const { container } = render(<HeroSection />)
      
      const section = container.querySelector('section#home')
      expect(section).toBeInTheDocument()
    })

    it('should have navy-primary background', () => {
      const { container } = render(<HeroSection />)
      
      const section = container.querySelector('section')
      expect(section).toHaveClass('bg-navy-primary')
    })

    it('should have min-height of screen', () => {
      const { container } = render(<HeroSection />)
      
      const section = container.querySelector('section')
      expect(section).toHaveClass('min-h-screen')
    })

    it('should have text-white class', () => {
      const { container } = render(<HeroSection />)
      
      const section = container.querySelector('section')
      expect(section).toHaveClass('text-white')
    })

    it('should have centered text layout', () => {
      const { container } = render(<HeroSection />)
      
      const containerDiv = container.querySelector('.text-center')
      expect(containerDiv).toBeInTheDocument()
    })
  })

  describe('Typography', () => {
    it('should have proper heading styles', () => {
      render(<HeroSection />)
      
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveClass('font-black')
      expect(heading).toHaveClass('text-4xl')
      expect(heading).toHaveClass('sm:text-5xl')
      expect(heading).toHaveClass('lg:text-6xl')
    })

    it('should highlight "South African SMEs" in gold', () => {
      render(<HeroSection />)
      
      const goldText = screen.getByText('South African SMEs')
      expect(goldText).toHaveClass('text-gold')
    })

    it('should have italic tagline', () => {
      render(<HeroSection />)
      
      const tagline = screen.getByText(/Legal confidence starts here/i)
      expect(tagline).toHaveClass('italic')
      expect(tagline).toHaveClass('font-serif')
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive padding', () => {
      const { container } = render(<HeroSection />)
      
      const section = container.querySelector('section')
      expect(section).toHaveClass('pb-20')
      expect(section).toHaveClass('sm:pb-24')
      expect(section).toHaveClass('lg:pb-28')
    })

    it('should have responsive top padding', () => {
      const { container } = render(<HeroSection />)
      
      const section = container.querySelector('section')
      expect(section).toHaveClass('pt-28')
      expect(section).toHaveClass('sm:pt-32')
      expect(section).toHaveClass('lg:pt-36')
    })

    it('should have responsive button layout', () => {
      render(<HeroSection />)
      
      const buttonContainer = screen.getByRole('button', { name: /Get Started/i }).parentElement
      expect(buttonContainer).toHaveClass('flex-col')
      expect(buttonContainer).toHaveClass('sm:flex-row')
    })
  })

  describe('Background Effects', () => {
    it('should have gradient blur effects', () => {
      const { container } = render(<HeroSection />)
      
      const blurElements = container.querySelectorAll('[class*="blur"]')
      expect(blurElements.length).toBeGreaterThan(0)
    })

    it('should have radial gradient overlay', () => {
      const { container } = render(<HeroSection />)
      
      const radialGradient = container.querySelector('[class*="radial-gradient"]')
      expect(radialGradient).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<HeroSection />)
      
      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toBeInTheDocument()
    })

    it('should have semantic section element', () => {
      const { container } = render(<HeroSection />)
      
      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()
    })

    it('should have accessible link with href', () => {
      render(<HeroSection />)
      
      const link = screen.getByRole('link', { name: /Learn More/i })
      expect(link).toHaveAttribute('href', '#about')
    })

    it('should have button with type attribute', () => {
      render(<HeroSection />)
      
      const button = screen.getByRole('button', { name: /Get Started/i })
      expect(button).toHaveAttribute('type', 'button')
    })
  })

  describe('Stats Badge', () => {
    it('should render stats badge with proper structure', () => {
      render(<HeroSection />)
      
      const badge = screen.getByText('300+ SA SMEs Empowered').closest('div')
      expect(badge).toHaveClass('rounded-full')
      expect(badge).toHaveClass('bg-navy-secondary')
    })

    it('should have icon container in badge', () => {
      render(<HeroSection />)
      
      const badge = screen.getByText('300+ SA SMEs Empowered').closest('div')
      const iconContainer = badge?.querySelector('.bg-gold')
      expect(iconContainer).toBeInTheDocument()
    })
  })

  describe('Feature Tags', () => {
    it('should render all tags with icons', () => {
      render(<HeroSection />)
      
      const tags = ['Legal Templates', 'SME Consulting', 'Legal Education', 'LegalTech Solutions']
      
      tags.forEach(tag => {
        const tagElement = screen.getByText(tag)
        expect(tagElement).toBeInTheDocument()
        
        const container = tagElement.closest('span')
        expect(container?.querySelector('svg')).toBeInTheDocument()
      })
    })

    it('should have proper spacing between tags', () => {
      render(<HeroSection />)
      
      const tagsContainer = screen.getByText('Legal Templates').closest('div')
      expect(tagsContainer).toHaveClass('gap-x-9')
      expect(tagsContainer).toHaveClass('gap-y-4')
    })
  })

  describe('Button Styling', () => {
    it('should have gold background on Get Started button', () => {
      render(<HeroSection />)
      
      const button = screen.getByRole('button', { name: /Get Started/i })
      expect(button).toHaveClass('bg-gold')
    })

    it('should have border on Learn More link', () => {
      render(<HeroSection />)
      
      const link = screen.getByRole('link', { name: /Learn More/i })
      expect(link).toHaveClass('border')
      expect(link).toHaveClass('border-white/25')
    })

    it('should have rounded-full shape on buttons', () => {
      render(<HeroSection />)
      
      const button = screen.getByRole('button', { name: /Get Started/i })
      const link = screen.getByRole('link', { name: /Learn More/i })
      
      expect(button).toHaveClass('rounded-full')
      expect(link).toHaveClass('rounded-full')
    })
  })

  describe('Framer Motion Integration', () => {
    it('should render motion components', () => {
      const { container } = render(<HeroSection />)
      
      // Motion components render as regular HTML elements
      expect(container.querySelector('section')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple renders', () => {
      const { rerender } = render(<HeroSection />)
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      
      rerender(<HeroSection />)
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    it('should not throw error when event listener is not attached', async () => {
      const user = userEvent.setup()
      render(<HeroSection />)
      
      const button = screen.getByRole('button', { name: /Get Started/i })
      
      await expect(user.click(button)).resolves.not.toThrow()
    })
  })
})

// Made with Bob
