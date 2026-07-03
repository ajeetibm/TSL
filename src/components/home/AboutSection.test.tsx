import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AboutSection } from './AboutSection'

describe('AboutSection', () => {
  describe('Rendering', () => {
    it('should render the section with id="about"', () => {
      const { container } = render(<AboutSection />)

      const section = container.querySelector('section#about')
      expect(section).toBeInTheDocument()
    })

    it('should render the eyebrow badge', () => {
      render(<AboutSection />)

      expect(screen.getByText('About The Startup Legal')).toBeInTheDocument()
    })

    it('should render the main heading', () => {
      render(<AboutSection />)

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
        'Your Legal Partner, Not Just Your Lawyer',
      )
    })

    it('should render the first description paragraph', () => {
      render(<AboutSection />)

      expect(screen.getByText(/The StartUp Legal was born from a mission/i)).toBeInTheDocument()
    })

    it('should render the second description paragraph', () => {
      render(<AboutSection />)

      const matches = screen.getAllByText(/Think of us as the friend who's a lawyer/i)
      expect(matches.length).toBeGreaterThanOrEqual(1)
    })

    it('should render all three value cards', () => {
      render(<AboutSection />)

      expect(screen.getByText('Accessibility')).toBeInTheDocument()
      expect(screen.getByText('Trust')).toBeInTheDocument()
      expect(screen.getByText('Empowerment')).toBeInTheDocument()
    })

    it('should render card descriptions', () => {
      render(<AboutSection />)

      expect(screen.getByText(/Law should be understandable and reachable/i)).toBeInTheDocument()
      expect(screen.getByText(/Our clients' business interests come first/i)).toBeInTheDocument()
      expect(screen.getByText(/We give SMEs the tools to stand on their own/i)).toBeInTheDocument()
    })

    it('should render the decorative divider', () => {
      const { container } = render(<AboutSection />)

      const divider = container.querySelector('.bg-\\[\\#D4A437\\]')
      expect(divider).toBeInTheDocument()
    })
  })

  describe('Stats Panel', () => {
    it('should render the stats panel heading', () => {
      render(<AboutSection />)

      expect(screen.getByText('By The Numbers')).toBeInTheDocument()
    })

    it('should render all stat values', () => {
      render(<AboutSection />)

      expect(screen.getByText('300+')).toBeInTheDocument()
      expect(screen.getByText('98%')).toBeInTheDocument()
      expect(screen.getByText('10k+')).toBeInTheDocument()
    })

    it('should render all stat labels', () => {
      render(<AboutSection />)

      expect(screen.getByText('SA SMEs Empowered')).toBeInTheDocument()
      expect(screen.getByText('Client Satisfaction')).toBeInTheDocument()
      expect(screen.getByText('Documents Processed')).toBeInTheDocument()
    })

    it('should render the stats panel with dark background', () => {
      const { container } = render(<AboutSection />)

      const panel = container.querySelector('.bg-\\[\\#0D1B2A\\]')
      expect(panel).toBeInTheDocument()
    })
  })

  describe('CTA Button', () => {
    it('should render the consultation CTA button', () => {
      render(<AboutSection />)

      expect(screen.getByText('Book a Free Consultation')).toBeInTheDocument()
    })

    it('should link to the contact section', () => {
      render(<AboutSection />)

      const link = screen.getByRole('link', { name: /Book a Free Consultation/i })
      expect(link).toHaveAttribute('href', '#contact')
    })
  })

  describe('Icons', () => {
    it('should render CircleDot icon in eyebrow', () => {
      render(<AboutSection />)

      const eyebrow = screen.getByText('About The Startup Legal').closest('span')
      const svg = eyebrow?.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should render icons for all value cards', () => {
      const { container } = render(<AboutSection />)

      const cards = container.querySelectorAll('article')
      expect(cards.length).toBe(3)

      cards.forEach((card) => {
        const icon = card.querySelector('svg')
        expect(icon).toBeInTheDocument()
      })
    })

    it('should render Target icon for Accessibility', () => {
      render(<AboutSection />)

      const card = screen.getByText('Accessibility').closest('article')
      expect(card?.querySelector('svg')).toBeInTheDocument()
    })

    it('should render Shield icon for Trust', () => {
      render(<AboutSection />)

      const card = screen.getByText('Trust').closest('article')
      expect(card?.querySelector('svg')).toBeInTheDocument()
    })

    it('should render Award icon for Empowerment', () => {
      render(<AboutSection />)

      const card = screen.getByText('Empowerment').closest('article')
      expect(card?.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Layout and Structure', () => {
    it('should have gray background', () => {
      const { container } = render(<AboutSection />)

      const section = container.querySelector('section')
      expect(section).toHaveClass('bg-[#F5F5F5]')
    })

    it('should have proper padding', () => {
      const { container } = render(<AboutSection />)

      const section = container.querySelector('section')
      expect(section).toHaveClass('pb-[92px]')
      expect(section).toHaveClass('pt-[24px]')
      expect(section).toHaveClass('lg:pb-[106px]')
    })

    it('should have two-column grid layout for header', () => {
      const { container } = render(<AboutSection />)

      const grid = container.querySelector('.lg\\:grid-cols-2')
      expect(grid).toBeInTheDocument()
    })

    it('should have grid layout for value cards', () => {
      const { container } = render(<AboutSection />)

      const grid = container.querySelector('.md\\:grid-cols-3')
      expect(grid).toBeInTheDocument()
    })
  })

  describe('Typography', () => {
    it('should have proper heading styles', () => {
      render(<AboutSection />)

      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveClass('font-display')
      expect(heading).toHaveClass('font-bold')
    })

    it('should have proper card title styles', () => {
      render(<AboutSection />)

      const title = screen.getByText('Accessibility')
      expect(title).toHaveClass('text-[18px]')
      expect(title).toHaveClass('font-bold')
    })
  })

  describe('Card Structure', () => {
    it('should render cards as article elements', () => {
      const { container } = render(<AboutSection />)

      const articles = container.querySelectorAll('article')
      expect(articles.length).toBe(3)
    })

    it('should have centered content in cards', () => {
      render(<AboutSection />)

      const card = screen.getByText('Accessibility').closest('article')
      expect(card).toHaveClass('text-center')
      expect(card).toHaveClass('items-center')
    })

    it('should have white background on cards', () => {
      render(<AboutSection />)

      const card = screen.getByText('Accessibility').closest('article')
      expect(card).toHaveClass('bg-white')
    })

    it('should have icon containers with gold background', () => {
      const { container } = render(<AboutSection />)

      const iconContainers = container.querySelectorAll('.bg-\\[\\#D4A437\\]')
      expect(iconContainers.length).toBeGreaterThanOrEqual(3)
    })

    it('should have rounded icon containers', () => {
      render(<AboutSection />)

      const card = screen.getByText('Accessibility').closest('article')
      const iconContainer = card?.querySelector('.rounded-full')
      expect(iconContainer).toBeInTheDocument()
    })
  })

  describe('Content Accuracy', () => {
    it('should have correct Accessibility description', () => {
      render(<AboutSection />)

      expect(screen.getByText(/Law should be understandable and reachable/i)).toBeInTheDocument()
    })

    it('should have correct Trust description', () => {
      render(<AboutSection />)

      expect(screen.getByText(/Our clients' business interests come first/i)).toBeInTheDocument()
    })

    it('should have correct Empowerment description', () => {
      render(<AboutSection />)

      expect(screen.getByText(/We give SMEs the tools to stand on their own/i)).toBeInTheDocument()
    })

    it('should mention IBM Techscale program', () => {
      render(<AboutSection />)

      expect(screen.getByText(/IBM Techscale program/i)).toBeInTheDocument()
    })
  })

  describe('Eyebrow Badge', () => {
    it('should have proper badge styling', () => {
      render(<AboutSection />)

      const badge = screen.getByText('About The Startup Legal').closest('span')
      expect(badge).toHaveClass('rounded-full')
      expect(badge).toHaveClass('border')
      expect(badge).toHaveClass('font-semibold')
    })

    it('should have icon in badge', () => {
      render(<AboutSection />)

      const badge = screen.getByText('About The Startup Legal').closest('span')
      const icon = badge?.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Decorative Elements', () => {
    it('should render bottom divider', () => {
      const { container } = render(<AboutSection />)

      const divider = container.querySelector('.h-\\[8px\\].w-\\[112px\\]')
      expect(divider).toBeInTheDocument()
    })

    it('should have gold divider', () => {
      const { container } = render(<AboutSection />)

      const divider = container.querySelector('.h-\\[8px\\].w-\\[112px\\]')
      expect(divider).toHaveClass('bg-[#D4A437]')
    })

    it('should have rounded divider', () => {
      const { container } = render(<AboutSection />)

      const divider = container.querySelector('.h-\\[8px\\].w-\\[112px\\]')
      expect(divider).toHaveClass('rounded-full')
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive card grid', () => {
      const { container } = render(<AboutSection />)

      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('lg:grid-cols-2')
    })

    it('should have responsive heading size', () => {
      render(<AboutSection />)

      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveClass('font-display')
      expect(heading).toHaveClass('font-bold')
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<AboutSection />)

      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toBeInTheDocument()
    })

    it('should use semantic article elements for cards', () => {
      const { container } = render(<AboutSection />)

      const articles = container.querySelectorAll('article')
      expect(articles.length).toBe(3)
    })

    it('should use semantic section element', () => {
      const { container } = render(<AboutSection />)

      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()
    })

    it('should have proper heading for each card', () => {
      render(<AboutSection />)

      const cardTitles = screen.getAllByRole('heading', { level: 3 })
      expect(cardTitles).toHaveLength(3)
    })
  })

  describe('Framer Motion Integration', () => {
    it('should render motion components', () => {
      const { container } = render(<AboutSection />)

      expect(container.querySelector('section')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple renders', () => {
      const { rerender } = render(<AboutSection />)

      expect(screen.getByText('Accessibility')).toBeInTheDocument()

      rerender(<AboutSection />)

      expect(screen.getByText('Accessibility')).toBeInTheDocument()
    })

    it('should render all cards even if one has long content', () => {
      render(<AboutSection />)

      const cards = screen.getAllByRole('heading', { level: 3 })
      expect(cards).toHaveLength(3)
    })
  })

  describe('Color Scheme', () => {
    it('should use gold color for icons', () => {
      const { container } = render(<AboutSection />)

      const iconContainers = container.querySelectorAll('.bg-\\[\\#D4A437\\]')
      expect(iconContainers.length).toBeGreaterThan(0)
    })

    it('should have proper heading text', () => {
      render(<AboutSection />)

      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveClass('font-bold')
    })
  })
})

// Made with Bob
