import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FeaturesSection } from './FeaturesSection'

describe('FeaturesSection', () => {
  describe('Rendering', () => {
    it('should render the section with id="features"', () => {
      const { container } = render(<FeaturesSection />)
      
      const section = container.querySelector('section#features')
      expect(section).toBeInTheDocument()
    })

    it('should render the section header', () => {
      render(<FeaturesSection />)
      
      expect(screen.getByText('How Our Platform Works')).toBeInTheDocument()
      expect(screen.getByText('Complete Legal Workflows, Not Just Templates')).toBeInTheDocument()
    })

    it('should render all three feature cards', () => {
      render(<FeaturesSection />)
      
      expect(screen.getByText('WIZARDS')).toBeInTheDocument()
      expect(screen.getByText('COUNSEL')).toBeInTheDocument()
      expect(screen.getByText('PLAYBOOKS & INSIGHTS')).toBeInTheDocument()
    })

    it('should render subtitles for each feature', () => {
      render(<FeaturesSection />)
      
      expect(screen.getByText('Completed Legal Jobs With Proof')).toBeInTheDocument()
      expect(screen.getAllByText('Strategic Guidance + Data')).toHaveLength(2)
    })

    it('should render descriptions for each feature', () => {
      render(<FeaturesSection />)
      
      expect(screen.getByText(/Every workflow handles data capture/i)).toBeInTheDocument()
      expect(screen.getByText(/Monthly attorney support available/i)).toBeInTheDocument()
      expect(screen.getByText(/Non-metered playbooks with checklists/i)).toBeInTheDocument()
    })

    it('should render the help text at bottom', () => {
      render(<FeaturesSection />)
      
      expect(screen.getByText('Not sure which option is right for you?')).toBeInTheDocument()
    })
  })

  describe('Feature Items', () => {
    it('should render all Wizards feature items', () => {
      render(<FeaturesSection />)
      
      expect(screen.getByText('Full track changes & clause alternatives')).toBeInTheDocument()
      expect(screen.getByText('Counterparty access via secure links')).toBeInTheDocument()
      expect(screen.getByText('QR-verified certification')).toBeInTheDocument()
      expect(screen.getByText('Automatic Company Snapshot sync')).toBeInTheDocument()
    })

    it('should render all Counsel feature items', () => {
      render(<FeaturesSection />)
      
      expect(screen.getByText('Standard & Partner Plans')).toBeInTheDocument()
      expect(screen.getByText('Included Attorney Hours')).toBeInTheDocument()
      expect(screen.getByText('Transparent Overflow Rates')).toBeInTheDocument()
      expect(screen.getByText('Review Gates & Quality Checks')).toBeInTheDocument()
    })

    it('should render all Playbooks feature items', () => {
      render(<FeaturesSection />)
      
      expect(screen.getByText('Playbook checklists & wizard links')).toBeInTheDocument()
      expect(screen.getByText('Usage dashboards (basic → executive)')).toBeInTheDocument()
      expect(screen.getByText('Document orchestration guides')).toBeInTheDocument()
      expect(screen.getByText('Quarterly compliance updates')).toBeInTheDocument()
    })

    it('should render check icons for all items', () => {
      const { container } = render(<FeaturesSection />)
      
      // Each feature has 4 items, so 12 total check icons
      const checkIcons = container.querySelectorAll('svg')
      expect(checkIcons.length).toBeGreaterThanOrEqual(12)
    })
  })

  describe('Icons', () => {
    it('should render FileText icon for Wizards', () => {
      render(<FeaturesSection />)
      
      const wizardsCard = screen.getByText('WIZARDS').closest('article')
      expect(wizardsCard?.querySelector('svg')).toBeInTheDocument()
    })

    it('should render Users icon for Counsel', () => {
      render(<FeaturesSection />)
      
      const counselCard = screen.getByText('COUNSEL').closest('article')
      expect(counselCard?.querySelector('svg')).toBeInTheDocument()
    })

    it('should render BookOpen icon for Playbooks', () => {
      render(<FeaturesSection />)
      
      const playbooksCard = screen.getByText('PLAYBOOKS & INSIGHTS').closest('article')
      expect(playbooksCard?.querySelector('svg')).toBeInTheDocument()
    })

    it('should render Zap icon in section header', () => {
      const { container } = render(<FeaturesSection />)
      
      const header = screen.getByText('How Our Platform Works').closest('span')
      expect(header?.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Buttons', () => {
    it('should render all CTA buttons', () => {
      render(<FeaturesSection />)
      
      expect(screen.getByRole('link', { name: /Start a Wizard/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Learn About Counsel/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /View Playbooks/i })).toBeInTheDocument()
    })

    it('should link CTAs to the right destination', () => {
      render(<FeaturesSection />)

      expect(screen.getByRole('link', { name: /Start a Wizard/i })).toHaveAttribute('href', '/wizard-catalogue')
      expect(screen.getByRole('link', { name: /Learn About Counsel/i })).toHaveAttribute('href', '#pricing')
      expect(screen.getByRole('link', { name: /View Playbooks/i })).toHaveAttribute('href', '#pricing')
    })

    it('should have arrow icons in buttons', () => {
      render(<FeaturesSection />)
      
      const buttons = screen.getAllByRole('link')
      buttons.forEach(button => {
        expect(button).toHaveTextContent('→')
      })
    })

    it('should have proper button styling', () => {
      render(<FeaturesSection />)
      
      const wizardButton = screen.getByRole('link', { name: /Start a Wizard/i })
      expect(wizardButton).toHaveClass('rounded-full')
      expect(wizardButton).toHaveClass('bg-navy-primary')
    })
  })

  describe('Card Structure', () => {
    it('should render cards as article elements', () => {
      const { container } = render(<FeaturesSection />)
      
      const articles = container.querySelectorAll('article')
      expect(articles.length).toBe(3)
    })

    it('should have decorative rail on each card', () => {
      const { container } = render(<FeaturesSection />)
      
      const rails = container.querySelectorAll('[aria-hidden="true"]')
      expect(rails.length).toBeGreaterThanOrEqual(3)
    })

    it('should have proper card styling', () => {
      render(<FeaturesSection />)
      
      const card = screen.getByText('WIZARDS').closest('article')
      expect(card).toHaveClass('rounded-[2rem]')
      expect(card).toHaveClass('bg-white')
    })

    it('should have icon containers with proper styling', () => {
      render(<FeaturesSection />)
      
      const wizardsCard = screen.getByText('WIZARDS').closest('article')
      const iconContainer = wizardsCard?.querySelector('.bg-navy-primary')
      expect(iconContainer).toBeInTheDocument()
      expect(iconContainer).toHaveClass('rounded-full')
    })
  })

  describe('Layout and Structure', () => {
    it('should have gray background', () => {
      const { container } = render(<FeaturesSection />)
      
      const section = container.querySelector('section')
      expect(section).toHaveClass('bg-[#F5F5F5]')
    })

    it('should have proper padding', () => {
      const { container } = render(<FeaturesSection />)
      
      const section = container.querySelector('section')
      expect(section).toHaveClass('py-20')
      expect(section).toHaveClass('lg:py-28')
    })

    it('should have grid layout for cards', () => {
      const { container } = render(<FeaturesSection />)
      
      const grid = container.querySelector('.lg\\:grid-cols-3')
      expect(grid).toBeInTheDocument()
    })

    it('should have proper gap between cards', () => {
      const { container } = render(<FeaturesSection />)
      
      const grid = container.querySelector('.gap-8')
      expect(grid).toBeInTheDocument()
    })
  })

  describe('Typography', () => {
    it('should have uppercase feature titles', () => {
      render(<FeaturesSection />)
      
      const title = screen.getByText('WIZARDS')
      expect(title).toHaveClass('uppercase')
      expect(title).toHaveClass('font-black')
    })

    it('should have proper title styling', () => {
      render(<FeaturesSection />)
      
      const title = screen.getByText('WIZARDS')
      expect(title).toHaveClass('text-2xl')
      expect(title).toHaveClass('text-navy-primary')
    })

    it('should have proper subtitle styling', () => {
      render(<FeaturesSection />)
      
      const subtitle = screen.getByText('Completed Legal Jobs With Proof')
      expect(subtitle).toHaveClass('text-base')
      expect(subtitle).toHaveClass('font-bold')
    })

    it('should have proper description styling', () => {
      render(<FeaturesSection />)
      
      const description = screen.getByText(/Every workflow handles data capture/i)
      expect(description).toHaveClass('text-lg')
      expect(description).toHaveClass('leading-8')
    })
  })

  describe('Color Scheme', () => {
    it('should use navy-primary for Wizards', () => {
      render(<FeaturesSection />)
      
      const card = screen.getByText('WIZARDS').closest('article')
      const iconContainer = card?.querySelector('.bg-navy-primary')
      expect(iconContainer).toBeInTheDocument()
    })

    it('should use gold for Counsel', () => {
      render(<FeaturesSection />)
      
      const card = screen.getByText('COUNSEL').closest('article')
      const iconContainer = card?.querySelector('.bg-gold')
      expect(iconContainer).toBeInTheDocument()
    })

    it('should use dark gray for Playbooks', () => {
      render(<FeaturesSection />)
      
      const card = screen.getByText('PLAYBOOKS & INSIGHTS').closest('article')
      const iconContainer = card?.querySelector('.bg-\\[\\#303030\\]')
      expect(iconContainer).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should use semantic article elements for cards', () => {
      const { container } = render(<FeaturesSection />)
      
      const articles = container.querySelectorAll('article')
      expect(articles.length).toBe(3)
    })

    it('should use semantic section element', () => {
      const { container } = render(<FeaturesSection />)
      
      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()
    })

    it('should have proper heading hierarchy', () => {
      render(<FeaturesSection />)
      
      const h2 = screen.getByRole('heading', { level: 2 })
      expect(h2).toBeInTheDocument()
      
      const h3s = screen.getAllByRole('heading', { level: 3 })
      expect(h3s).toHaveLength(3)
    })

    it('should use semantic list elements', () => {
      const { container } = render(<FeaturesSection />)
      
      const lists = container.querySelectorAll('ul')
      expect(lists.length).toBe(3)
    })

    it('should have accessible links', () => {
      render(<FeaturesSection />)
      
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveAttribute('href', '#pricing')
      })
    })

    it('should hide decorative arrows from screen readers', () => {
      render(<FeaturesSection />)
      
      const buttons = screen.getAllByRole('link')
      buttons.forEach(button => {
        const arrow = button.querySelector('[aria-hidden="true"]')
        expect(arrow).toBeInTheDocument()
      })
    })

    it('should hide decorative rails from screen readers', () => {
      const { container } = render(<FeaturesSection />)
      
      const rails = container.querySelectorAll('[aria-hidden="true"]')
      expect(rails.length).toBeGreaterThan(0)
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive grid', () => {
      const { container } = render(<FeaturesSection />)
      
      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('lg:grid-cols-3')
    })

    it('should have responsive padding', () => {
      const { container } = render(<FeaturesSection />)
      
      const section = container.querySelector('section')
      expect(section).toHaveClass('lg:py-28')
    })

    it('should have responsive card padding', () => {
      render(<FeaturesSection />)
      
      const card = screen.getByText('WIZARDS').closest('article')
      expect(card).toHaveClass('md:p-9')
    })
  })

  describe('Framer Motion Integration', () => {
    it('should render motion components', () => {
      const { container } = render(<FeaturesSection />)
      
      expect(container.querySelector('section')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple renders', () => {
      const { rerender } = render(<FeaturesSection />)
      
      expect(screen.getByText('WIZARDS')).toBeInTheDocument()
      
      rerender(<FeaturesSection />)
      
      expect(screen.getByText('WIZARDS')).toBeInTheDocument()
    })

    it('should render all cards even with varying content lengths', () => {
      render(<FeaturesSection />)
      
      const cards = screen.getAllByRole('heading', { level: 3 })
      expect(cards).toHaveLength(3)
    })
  })

  describe('Content Accuracy', () => {
    it('should have correct Wizards description', () => {
      render(<FeaturesSection />)
      
      expect(screen.getByText(/Every workflow handles data capture/i)).toBeInTheDocument()
    })

    it('should have correct Counsel description', () => {
      render(<FeaturesSection />)
      
      expect(screen.getByText(/Monthly attorney support available/i)).toBeInTheDocument()
    })

    it('should have correct Playbooks description', () => {
      render(<FeaturesSection />)
      
      expect(screen.getByText(/Non-metered playbooks with checklists/i)).toBeInTheDocument()
    })
  })

  describe('List Items', () => {
    it('should render all list items with check icons', () => {
      const { container } = render(<FeaturesSection />)
      
      const listItems = container.querySelectorAll('li')
      expect(listItems.length).toBe(12) // 4 items per feature × 3 features
    })

    it('should have proper list item structure', () => {
      render(<FeaturesSection />)
      
      const firstItem = screen.getByText('Full track changes & clause alternatives').closest('li')
      expect(firstItem).toHaveClass('flex')
      expect(firstItem).toHaveClass('items-center')
    })
  })
})

// Made with Bob
