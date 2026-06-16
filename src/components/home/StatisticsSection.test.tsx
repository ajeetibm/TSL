import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatisticsSection } from './StatisticsSection'

describe('StatisticsSection', () => {
  describe('Rendering', () => {
    it('should render the main heading', () => {
      render(<StatisticsSection />)
      
      expect(screen.getByText('Proven Performance Metrics')).toBeInTheDocument()
    })

    it('should render the subtitle', () => {
      render(<StatisticsSection />)
      
      expect(screen.getByText(/Real data from thousands of legal workflows/i)).toBeInTheDocument()
    })

    it('should render all four metric cards', () => {
      render(<StatisticsSection />)
      
      expect(screen.getByText('2.4hrs')).toBeInTheDocument()
      expect(screen.getByText('94%')).toBeInTheDocument()
      expect(screen.getByText('67%')).toBeInTheDocument()
      expect(screen.getByText('89%')).toBeInTheDocument()
    })

    it('should render metric labels', () => {
      render(<StatisticsSection />)
      
      expect(screen.getByText('Median Time to Signature')).toBeInTheDocument()
      expect(screen.getByText('First-Time Acceptance')).toBeInTheDocument()
      expect(screen.getByText('Rework Reduction')).toBeInTheDocument()
      expect(screen.getByText('Complete Without Escalation')).toBeInTheDocument()
    })

    it('should render metric tags', () => {
      render(<StatisticsSection />)
      
      expect(screen.getByText('↗ For NDAs & Offers')).toBeInTheDocument()
      expect(screen.getByText('↗ By receivers')).toBeInTheDocument()
      expect(screen.getByText('↗ After switching')).toBeInTheDocument()
      expect(screen.getByText('↗ Automated workflows')).toBeInTheDocument()
    })
  })

  describe('Icons', () => {
    it('should render icons for all metric cards', () => {
      const { container } = render(<StatisticsSection />)
      
      const articles = container.querySelectorAll('article')
      expect(articles.length).toBe(4)
      
      articles.forEach(article => {
        const icon = article.querySelector('svg')
        expect(icon).toBeInTheDocument()
      })
    })
  })

  describe('Layout and Structure', () => {
    it('should have gradient background', () => {
      const { container } = render(<StatisticsSection />)
      
      const section = container.querySelector('section')
      expect(section).toHaveClass('bg-[linear-gradient(180deg,#041B36_0%,#03152B_100%)]')
    })

    it('should have white text', () => {
      const { container } = render(<StatisticsSection />)
      
      const section = container.querySelector('section')
      expect(section).toHaveClass('text-white')
    })

    it('should have proper padding', () => {
      const { container } = render(<StatisticsSection />)
      
      const section = container.querySelector('section')
      expect(section).toHaveClass('py-[96px]')
      expect(section).toHaveClass('lg:py-[104px]')
    })

    it('should have grid layout for metrics', () => {
      const { container } = render(<StatisticsSection />)
      
      const grid = container.querySelector('.md\\:grid-cols-2')
      expect(grid).toBeInTheDocument()
    })

    it('should render metrics as article elements', () => {
      const { container } = render(<StatisticsSection />)
      
      const articles = container.querySelectorAll('article')
      expect(articles.length).toBe(4)
    })
  })

  describe('Card Structure', () => {
    it('should have proper card styling', () => {
      render(<StatisticsSection />)
      
      const card = screen.getByText('2.4hrs').closest('article')
      expect(card).toHaveClass('rounded-[26px]')
      expect(card).toHaveClass('bg-[#2A3A4E]')
      expect(card).toHaveClass('border')
    })

    it('should have fixed height cards', () => {
      render(<StatisticsSection />)
      
      const card = screen.getByText('2.4hrs').closest('article')
      expect(card).toHaveClass('h-[205px]')
    })

    it('should have icon containers with gold background', () => {
      render(<StatisticsSection />)
      
      const card = screen.getByText('2.4hrs').closest('article')
      const iconContainer = card?.querySelector('.bg-\\[\\#D4A63C\\]')
      expect(iconContainer).toBeInTheDocument()
    })

    it('should have rounded icon containers', () => {
      render(<StatisticsSection />)
      
      const card = screen.getByText('2.4hrs').closest('article')
      const iconContainer = card?.querySelector('.rounded-full')
      expect(iconContainer).toBeInTheDocument()
    })
  })

  describe('Typography', () => {
    it('should have proper heading styles', () => {
      render(<StatisticsSection />)
      
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveClass('text-[34px]')
      expect(heading).toHaveClass('font-bold')
      expect(heading).toHaveClass('md:text-[42px]')
    })

    it('should have proper metric value styles', () => {
      render(<StatisticsSection />)
      
      const value = screen.getByText('2.4hrs')
      expect(value).toHaveClass('text-[30px]')
      expect(value).toHaveClass('font-bold')
      expect(value).toHaveClass('md:text-[34px]')
    })

    it('should have proper label styles', () => {
      render(<StatisticsSection />)
      
      const label = screen.getByText('Median Time to Signature')
      expect(label).toHaveClass('text-[15px]')
      expect(label).toHaveClass('md:text-[16px]')
    })
  })

  describe('Tags', () => {
    it('should have proper tag styling', () => {
      render(<StatisticsSection />)
      
      const tag = screen.getByText('↗ For NDAs & Offers')
      expect(tag).toHaveClass('rounded-full')
      expect(tag).toHaveClass('bg-[rgba(212,166,60,0.15)]')
    })

    it('should position tags at bottom of cards', () => {
      render(<StatisticsSection />)
      
      const tag = screen.getByText('↗ For NDAs & Offers')
      expect(tag).toHaveClass('absolute')
      expect(tag).toHaveClass('bottom-[20px]')
    })
  })

  describe('Accessibility', () => {
    it('should use semantic article elements for metrics', () => {
      const { container } = render(<StatisticsSection />)
      
      const articles = container.querySelectorAll('article')
      expect(articles.length).toBe(4)
    })

    it('should use semantic section element', () => {
      const { container } = render(<StatisticsSection />)
      
      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()
    })

    it('should have proper heading hierarchy', () => {
      render(<StatisticsSection />)
      
      const h2 = screen.getByRole('heading', { level: 2 })
      expect(h2).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive grid', () => {
      const { container } = render(<StatisticsSection />)
      
      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('md:grid-cols-2')
      expect(grid).toHaveClass('xl:grid-cols-4')
    })

    it('should have responsive heading size', () => {
      render(<StatisticsSection />)
      
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveClass('text-[34px]')
      expect(heading).toHaveClass('md:text-[42px]')
    })

    it('should have responsive padding', () => {
      const { container } = render(<StatisticsSection />)
      
      const section = container.querySelector('section')
      expect(section).toHaveClass('lg:py-[104px]')
    })
  })

  describe('Color Scheme', () => {
    it('should use gold for icon backgrounds', () => {
      const { container } = render(<StatisticsSection />)
      
      const iconContainers = container.querySelectorAll('.bg-\\[\\#D4A63C\\]')
      expect(iconContainers.length).toBe(4)
    })

    it('should use white text', () => {
      render(<StatisticsSection />)
      
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveClass('text-white')
    })

    it('should use dark background for cards', () => {
      const { container } = render(<StatisticsSection />)
      
      const cards = container.querySelectorAll('.bg-\\[\\#2A3A4E\\]')
      expect(cards.length).toBe(4)
    })
  })

  describe('Framer Motion Integration', () => {
    it('should render motion components', () => {
      const { container } = render(<StatisticsSection />)
      
      expect(container.querySelector('section')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple renders', () => {
      const { rerender } = render(<StatisticsSection />)
      
      expect(screen.getByText('2.4hrs')).toBeInTheDocument()
      
      rerender(<StatisticsSection />)
      
      expect(screen.getByText('2.4hrs')).toBeInTheDocument()
    })

    it('should render all metrics with consistent structure', () => {
      const { container } = render(<StatisticsSection />)
      
      const articles = container.querySelectorAll('article')
      expect(articles.length).toBe(4)
      
      articles.forEach(article => {
        expect(article.querySelector('strong')).toBeInTheDocument()
        expect(article.querySelector('p')).toBeInTheDocument()
        expect(article.querySelector('svg')).toBeInTheDocument()
        expect(article.querySelector('span.absolute')).toBeInTheDocument()
      })
    })
  })

  describe('Content Accuracy', () => {
    it('should have correct time metric', () => {
      render(<StatisticsSection />)
      
      expect(screen.getByText('2.4hrs')).toBeInTheDocument()
      expect(screen.getByText('Median Time to Signature')).toBeInTheDocument()
    })

    it('should have correct acceptance metric', () => {
      render(<StatisticsSection />)
      
      expect(screen.getByText('94%')).toBeInTheDocument()
      expect(screen.getByText('First-Time Acceptance')).toBeInTheDocument()
    })

    it('should have correct reduction metric', () => {
      render(<StatisticsSection />)
      
      expect(screen.getByText('67%')).toBeInTheDocument()
      expect(screen.getByText('Rework Reduction')).toBeInTheDocument()
    })

    it('should have correct completion metric', () => {
      render(<StatisticsSection />)
      
      expect(screen.getByText('89%')).toBeInTheDocument()
      expect(screen.getByText('Complete Without Escalation')).toBeInTheDocument()
    })
  })

  describe('Card Effects', () => {
    it('should have shadow effects on cards', () => {
      const { container } = render(<StatisticsSection />)
      
      const cards = container.querySelectorAll('article')
      cards.forEach(card => {
        expect(card.className).toContain('shadow')
      })
    })

    it('should have inset shadow effects', () => {
      const { container } = render(<StatisticsSection />)
      
      const cards = container.querySelectorAll('article')
      cards.forEach(card => {
        expect(card.className).toContain('inset')
      })
    })
  })
})

// Made with Bob
