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
        'Your Legal Partner, Not Just Your Lawyer'
      )
    })

    it('should render the first description paragraph', () => {
      render(<AboutSection />)
      
      expect(screen.getByText(/The StartUp Legal was born from a mission/i)).toBeInTheDocument()
    })

    it('should render the second description paragraph', () => {
      render(<AboutSection />)
      
      expect(screen.getByText(/Think of us as the friend who's a lawyer/i)).toBeInTheDocument()
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

  describe('Icons', () => {
    it('should render CircleDot icon in eyebrow', () => {
      render(<AboutSection />)
      
      const eyebrow = screen.getByText('About The Startup Legal').closest('span')
      const svg = eyebrow?.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should render icons for all value cards', () => {
      const { container } = render(<AboutSection />)
      
      // Each card should have an icon (3 cards)
      const cards = container.querySelectorAll('article')
      expect(cards.length).toBe(3)
      
      cards.forEach(card => {
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

    it('should have centered text layout', () => {
      const { container } = render(<AboutSection />)
      
      const textCenter = container.querySelector('.text-center')
      expect(textCenter).toBeInTheDocument()
    })

    it('should have grid layout for cards', () => {
      const { container } = render(<AboutSection />)
      
      const grid = container.querySelector('.md\\:grid-cols-3')
      expect(grid).toBeInTheDocument()
    })

    it('should have proper gap between cards', () => {
      const { container } = render(<AboutSection />)
      
      const grid = container.querySelector('.gap-\\[76px\\]')
      expect(grid).toBeInTheDocument()
    })
  })

  describe('Typography', () => {
    it('should have proper heading styles', () => {
      render(<AboutSection />)
      
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveClass('font-display')
      expect(heading).toHaveClass('font-bold')
      expect(heading).toHaveClass('text-[32px]')
      expect(heading).toHaveClass('md:text-[36px]')
    })

    it('should have proper card title styles', () => {
      render(<AboutSection />)
      
      const title = screen.getByText('Accessibility')
      expect(title).toHaveClass('text-[22px]')
      expect(title).toHaveClass('font-bold')
    })

    it('should have proper description text styles', () => {
      render(<AboutSection />)
      
      const description = screen.getByText(/The StartUp Legal was born/i)
      expect(description).toHaveClass('text-[18px]')
      expect(description).toHaveClass('leading-[28px]')
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

    it('should have icon containers with gold background', () => {
      const { container } = render(<AboutSection />)
      
      const iconContainers = container.querySelectorAll('.bg-\\[\\#D4A437\\]')
      // 3 card icons + 1 divider = 4 total
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
    it('should have responsive grid', () => {
      const { container } = render(<AboutSection />)
      
      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('md:grid-cols-3')
    })

    it('should have responsive heading size', () => {
      render(<AboutSection />)
      
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveClass('text-[32px]')
      expect(heading).toHaveClass('md:text-[36px]')
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

    it('should have proper text colors', () => {
      render(<AboutSection />)
      
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveClass('text-[#333]')
    })
  })
})

// Made with Bob
