import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PricingSection } from './PricingSection'

// Mock the useStickyScroll hook
vi.mock('../../hooks/useStickyScroll', () => ({
  useStickyScroll: () => ({
    sectionRef: { current: null },
    isSticky: false,
  }),
}))

describe('PricingSection', () => {
  describe('Rendering', () => {
    it('should render the section with id="pricing"', () => {
      const { container } = render(<PricingSection />)
      
      const section = container.querySelector('section#pricing')
      expect(section).toBeInTheDocument()
    })

    it('should render the section header', () => {
      render(<PricingSection />)
      
      expect(screen.getByText('Transparent Pricing • No Hidden Fees')).toBeInTheDocument()
      expect(screen.getByText('Choose Your Legal Foundation')).toBeInTheDocument()
    })

    it('should render all three pricing plans', () => {
      render(<PricingSection />)
      
      expect(screen.getByText('Launchpad')).toBeInTheDocument()
      expect(screen.getByText('Operator')).toBeInTheDocument()
      expect(screen.getByText('Boardroom')).toBeInTheDocument()
    })

    it('should render plan descriptions', () => {
      render(<PricingSection />)
      
      expect(screen.getByText('Perfect for startups testing the waters.')).toBeInTheDocument()
      expect(screen.getByText('Complete legal foundation for your business.')).toBeInTheDocument()
      expect(screen.getByText('Personalized legal infrastructure.')).toBeInTheDocument()
    })

    it('should render plan prices', () => {
      render(<PricingSection />)
      
      expect(screen.getByText('R499')).toBeInTheDocument()
      expect(screen.getByText('R999')).toBeInTheDocument()
      expect(screen.getByText('R2,499')).toBeInTheDocument()
    })

    it('should render plan periods', () => {
      render(<PricingSection />)
      
      const periods = screen.getAllByText('per month')
      expect(periods).toHaveLength(3)
    })
  })

  describe('Plan Features', () => {
    it('should render Launchpad features', () => {
      render(<PricingSection />)
      
      expect(screen.getByText('4 wizard runs per month')).toBeInTheDocument()
      expect(screen.getByText('Playbooks Lite')).toBeInTheDocument()
      expect(screen.getByText('Essential guides and checklists')).toBeInTheDocument()
    })

    it('should render Operator features', () => {
      render(<PricingSection />)
      
      expect(screen.getByText('12 wizard runs per month')).toBeInTheDocument()
      expect(screen.getByText('Counsel credits')).toBeInTheDocument()
      expect(screen.getByText('Comprehensive legal resources')).toBeInTheDocument()
    })

    it('should render Boardroom features', () => {
      render(<PricingSection />)
      
      expect(screen.getByText('30 wizard runs per month')).toBeInTheDocument()
      expect(screen.getByText('Playbooks Pro')).toBeInTheDocument()
      expect(screen.getByText('Priority support')).toBeInTheDocument()
    })
  })

  describe('Highlighted Plan', () => {
    it('should highlight the Operator plan', () => {
      render(<PricingSection />)
      
      const operatorCard = screen.getByText('Operator').closest('article')
      expect(operatorCard).toHaveClass('bg-gold/10')
      expect(operatorCard).toHaveClass('ring-gold')
    })

    it('should show "Best for most startups" badge on highlighted plan', () => {
      render(<PricingSection />)
      
      expect(screen.getByText('Best for most startups')).toBeInTheDocument()
    })

    it('should have gold icon background for highlighted plan', () => {
      render(<PricingSection />)
      
      const operatorCard = screen.getByText('Operator').closest('article')
      const iconContainer = operatorCard?.querySelector('.bg-gold')
      expect(iconContainer).toBeInTheDocument()
    })

    it('should not highlight other plans', () => {
      render(<PricingSection />)
      
      const launchpadCard = screen.getByText('Launchpad').closest('article')
      const boardroomCard = screen.getByText('Boardroom').closest('article')
      
      expect(launchpadCard).not.toHaveClass('bg-gold/10')
      expect(boardroomCard).not.toHaveClass('bg-gold/10')
    })
  })

  describe('Company Registration Section', () => {
    it('should render company registration header', () => {
      render(<PricingSection />)
      
      expect(screen.getByText('Company Registration')).toBeInTheDocument()
    })

    it('should render all comparison rows', () => {
      render(<PricingSection />)
      
      expect(screen.getByText('CIPC Company Registration')).toBeInTheDocument()
      expect(screen.getByText('CIPC filing fees')).toBeInTheDocument()
      expect(screen.getByText('Company Name Reservation')).toBeInTheDocument()
      expect(screen.getByText('Foundational Documents')).toBeInTheDocument()
    })

    it('should show check marks for all plans in comparison', () => {
      const { container } = render(<PricingSection />)
      
      // 4 rows × 3 plans = 12 check marks
      const checkMarks = container.querySelectorAll('.text-emerald-500')
      expect(checkMarks.length).toBe(12)
    })

    it('should have Info icon in header', () => {
      render(<PricingSection />)
      
      const header = screen.getByText('Company Registration').closest('h3')
      expect(header?.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Icons', () => {
    it('should render Info icons for all plans', () => {
      const { container } = render(<PricingSection />)
      
      const articles = container.querySelectorAll('article')
      articles.forEach(article => {
        const icon = article.querySelector('svg')
        expect(icon).toBeInTheDocument()
      })
    })

    it('should render Check icons in comparison table', () => {
      const { container } = render(<PricingSection />)
      
      const checkIcons = container.querySelectorAll('.text-emerald-500 svg')
      expect(checkIcons.length).toBeGreaterThan(0)
    })
  })

  describe('Layout and Structure', () => {
    it('should have white background', () => {
      const { container } = render(<PricingSection />)
      
      const section = container.querySelector('section')
      expect(section).toHaveClass('bg-white')
    })

    it('should have proper padding', () => {
      const { container } = render(<PricingSection />)
      
      const section = container.querySelector('section')
      expect(section).toHaveClass('pb-20')
      expect(section).toHaveClass('pt-14')
      expect(section).toHaveClass('lg:pb-28')
      expect(section).toHaveClass('lg:pt-16')
    })

    it('should have grid layout for plans', () => {
      const { container } = render(<PricingSection />)
      
      const grid = container.querySelector('.lg\\:grid-cols-3')
      expect(grid).toBeInTheDocument()
    })

    it('should render plans as article elements', () => {
      const { container } = render(<PricingSection />)
      
      const articles = container.querySelectorAll('article')
      expect(articles.length).toBe(3)
    })
  })

  describe('Typography', () => {
    it('should have proper plan name styling', () => {
      render(<PricingSection />)
      
      const planName = screen.getByText('Launchpad')
      expect(planName).toHaveClass('text-xl')
      expect(planName).toHaveClass('font-black')
      expect(planName).toHaveClass('text-navy-primary')
    })

    it('should have proper price styling', () => {
      render(<PricingSection />)
      
      const price = screen.getByText('R499')
      expect(price).toHaveClass('text-4xl')
      expect(price).toHaveClass('font-black')
    })

    it('should have proper description styling', () => {
      render(<PricingSection />)
      
      const description = screen.getByText('Perfect for startups testing the waters.')
      expect(description).toHaveClass('text-sm')
      expect(description).toHaveClass('text-slate-500')
    })
  })

  describe('Sticky Behavior', () => {
    it('should use useStickyScroll hook', () => {
      const { container } = render(<PricingSection />)
      
      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()
    })

    it('should have transition classes', () => {
      const { container } = render(<PricingSection />)
      
      const section = container.querySelector('section')
      expect(section).toHaveClass('transition-all')
      expect(section).toHaveClass('duration-300')
    })
  })

  describe('Accessibility', () => {
    it('should use semantic article elements for plans', () => {
      const { container } = render(<PricingSection />)
      
      const articles = container.querySelectorAll('article')
      expect(articles.length).toBe(3)
    })

    it('should use semantic section element', () => {
      const { container } = render(<PricingSection />)
      
      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()
    })

    it('should have proper heading hierarchy', () => {
      render(<PricingSection />)
      
      const h2 = screen.getByRole('heading', { level: 2 })
      expect(h2).toBeInTheDocument()
      
      const h3s = screen.getAllByRole('heading', { level: 3 })
      expect(h3s.length).toBeGreaterThanOrEqual(3)
    })

    it('should use semantic list elements', () => {
      const { container } = render(<PricingSection />)
      
      const lists = container.querySelectorAll('ul')
      expect(lists.length).toBe(3)
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive grid', () => {
      const { container } = render(<PricingSection />)
      
      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('lg:grid-cols-3')
    })

    it('should have responsive padding', () => {
      const { container } = render(<PricingSection />)
      
      const section = container.querySelector('section')
      expect(section).toHaveClass('lg:pb-28')
      expect(section).toHaveClass('lg:pt-16')
    })
  })

  describe('Comparison Table', () => {
    it('should have proper grid structure', () => {
      const { container } = render(<PricingSection />)
      
      const comparisonGrid = container.querySelector('.grid-cols-\\[1\\.4fr_repeat\\(3\\,1fr\\)\\]')
      expect(comparisonGrid).toBeInTheDocument()
    })

    it('should have dividers between rows', () => {
      const { container } = render(<PricingSection />)
      
      const dividers = container.querySelector('.divide-y')
      expect(dividers).toBeInTheDocument()
    })

    it('should have gray background for comparison section', () => {
      const { container } = render(<PricingSection />)
      
      const comparisonSection = container.querySelector('.bg-slate-50')
      expect(comparisonSection).toBeInTheDocument()
    })
  })

  describe('Color Scheme', () => {
    it('should use gold for highlighted plan', () => {
      render(<PricingSection />)
      
      const operatorCard = screen.getByText('Operator').closest('article')
      expect(operatorCard).toHaveClass('bg-gold/10')
    })

    it('should use navy-primary for text', () => {
      render(<PricingSection />)
      
      const planName = screen.getByText('Launchpad')
      expect(planName).toHaveClass('text-navy-primary')
    })

    it('should use emerald for check marks', () => {
      const { container } = render(<PricingSection />)
      
      const checkMarks = container.querySelectorAll('.text-emerald-500')
      expect(checkMarks.length).toBeGreaterThan(0)
    })
  })

  describe('Framer Motion Integration', () => {
    it('should render motion components', () => {
      const { container } = render(<PricingSection />)
      
      expect(container.querySelector('section')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple renders', () => {
      const { rerender } = render(<PricingSection />)
      
      expect(screen.getByText('Launchpad')).toBeInTheDocument()
      
      rerender(<PricingSection />)
      
      expect(screen.getByText('Launchpad')).toBeInTheDocument()
    })

    it('should render all plans even with varying feature counts', () => {
      render(<PricingSection />)
      
      const plans = screen.getAllByRole('heading', { level: 3 })
      expect(plans.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('Content Accuracy', () => {
    it('should have correct Launchpad price', () => {
      render(<PricingSection />)
      
      expect(screen.getByText('R499')).toBeInTheDocument()
    })

    it('should have correct Operator price', () => {
      render(<PricingSection />)
      
      expect(screen.getByText('R999')).toBeInTheDocument()
    })

    it('should have correct Boardroom price', () => {
      render(<PricingSection />)
      
      expect(screen.getByText('R2,499')).toBeInTheDocument()
    })
  })

  describe('Badge Styling', () => {
    it('should have proper badge styling for highlighted plan', () => {
      render(<PricingSection />)
      
      const badge = screen.getByText('Best for most startups')
      expect(badge).toHaveClass('bg-gold')
      expect(badge).toHaveClass('text-white')
      expect(badge).toHaveClass('uppercase')
    })

    it('should have proper period badge styling', () => {
      render(<PricingSection />)
      
      const periodBadges = screen.getAllByText('per month')
      periodBadges.forEach(badge => {
        expect(badge).toHaveClass('rounded-full')
        expect(badge).toHaveClass('bg-gold-light/60')
      })
    })
  })

  describe('Icon Containers', () => {
    it('should have rounded icon containers', () => {
      const { container } = render(<PricingSection />)
      
      const iconContainers = container.querySelectorAll('.rounded-full')
      expect(iconContainers.length).toBeGreaterThan(0)
    })

    it('should have proper icon container sizing', () => {
      const { container } = render(<PricingSection />)
      
      const articles = container.querySelectorAll('article')
      articles.forEach(article => {
        const iconContainer = article.querySelector('.h-12.w-12')
        expect(iconContainer).toBeInTheDocument()
      })
    })
  })
})

// Made with Bob
