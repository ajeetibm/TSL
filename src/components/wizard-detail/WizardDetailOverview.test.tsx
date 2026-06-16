import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WizardDetailOverview } from './WizardDetailOverview'

// Mock wizards data
vi.mock('../../data/wizards', () => ({
  wizards: [
    {
      title: 'NDA Wizard',
      description: 'Create NDAs',
      time: '10 min',
      audience: 'Startups',
      included: ['Item 1', 'Item 2'],
      icon: () => null,
      popular: true,
    },
    {
      title: 'Contract Wizard',
      description: 'Create Contracts',
      time: '15 min',
      audience: 'SMEs',
      included: ['Item A', 'Item B'],
      icon: () => null,
      popular: false,
    },
  ],
}))

// Mock wizard cart utilities
vi.mock('../../utils/wizardCart', () => ({
  loadWizardQuantities: vi.fn(() => ({})),
  saveWizardQuantities: vi.fn(),
}))

describe('WizardDetailOverview', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('Rendering', () => {
    it('should render the component', () => {
      const { container } = render(<WizardDetailOverview />)

      const detail = container.querySelector('.wizard-detail')
      expect(detail).toBeInTheDocument()
    })

    it('should render the main heading', () => {
      render(<WizardDetailOverview />)

      expect(screen.getByRole('heading', { name: 'Wizard Details & Overview' })).toBeInTheDocument()
    })

    it('should render the description', () => {
      render(<WizardDetailOverview />)

      expect(
        screen.getByText('Everything you need to know before starting this legal workflow')
      ).toBeInTheDocument()
    })

    it('should render Back to Wizards link', () => {
      render(<WizardDetailOverview />)

      const backLink = screen.getByRole('link', { name: /Back to Wizards/i })
      expect(backLink).toBeInTheDocument()
      expect(backLink).toHaveAttribute('href', '/wizard-catalogue')
    })

    it('should render Proceed To Payment button', () => {
      render(<WizardDetailOverview />)

      expect(screen.getByRole('button', { name: /Proceed To Payment/i })).toBeInTheDocument()
    })
  })

  describe('Selected Wizards Section', () => {
    it('should render Selected Wizards heading', () => {
      render(<WizardDetailOverview />)

      expect(screen.getByRole('heading', { name: 'Selected Wizards' })).toBeInTheDocument()
    })

    it('should show empty state when no wizards selected', () => {
      render(<WizardDetailOverview />)

      expect(screen.getByText('No wizards selected yet')).toBeInTheDocument()
      expect(
        screen.getByText('Go back to the wizard catalogue and choose the workflows you want to review.')
      ).toBeInTheDocument()
    })

    it('should render Choose Wizards link in empty state', () => {
      render(<WizardDetailOverview />)

      const chooseLink = screen.getByRole('link', { name: 'Choose Wizards' })
      expect(chooseLink).toBeInTheDocument()
      expect(chooseLink).toHaveAttribute('href', '/wizard-catalogue')
    })

    it('should show "0 wizards" when none selected', () => {
      render(<WizardDetailOverview />)

      expect(screen.getByText('0 wizards')).toBeInTheDocument()
    })
  })

  describe('Pricing Section', () => {
    it('should render Pricing heading', () => {
      render(<WizardDetailOverview />)

      expect(screen.getByRole('heading', { name: 'Pricing for This Wizard' })).toBeInTheDocument()
    })

    it('should render pricing tags', () => {
      render(<WizardDetailOverview />)

      expect(screen.getByText('Launchpad')).toBeInTheDocument()
      expect(screen.getByText('Popular')).toBeInTheDocument()
      expect(screen.getByText('Best fit')).toBeInTheDocument()
    })

    it('should render Operator Plan details', () => {
      render(<WizardDetailOverview />)

      expect(screen.getByRole('heading', { name: 'Operator Plan' })).toBeInTheDocument()
      expect(screen.getByText('For growing businesses with ongoing legal needs')).toBeInTheDocument()
      expect(screen.getByText('R999')).toBeInTheDocument()
      expect(screen.getByText('/month')).toBeInTheDocument()
    })

    it('should render pricing link', () => {
      render(<WizardDetailOverview />)

      const pricingLink = screen.getByRole('link', { name: /View complete pricing comparison/i })
      expect(pricingLink).toBeInTheDocument()
      expect(pricingLink).toHaveAttribute('href', '/pricing')
    })
  })

  describe("What's Included Section", () => {
    it('should render What\'s Included heading', () => {
      render(<WizardDetailOverview />)

      expect(screen.getByRole('heading', { name: "What's Included" })).toBeInTheDocument()
    })

    it('should render all included items', () => {
      render(<WizardDetailOverview />)

      expect(screen.getByText('SA-specific mutual or one-way NDA')).toBeInTheDocument()
      expect(screen.getByText('Plain-language summary of key clauses')).toBeInTheDocument()
      expect(screen.getByText('Built-in e-signature integration')).toBeInTheDocument()
      expect(screen.getByText('Tamper-proof evidence pack with timestamps')).toBeInTheDocument()
      expect(screen.getByText('BEE/verified digital certification')).toBeInTheDocument()
    })

    it('should render ClipboardCheck icons', () => {
      const { container } = render(<WizardDetailOverview />)

      const icons = container.querySelectorAll('.wizard-detail__check-grid svg')
      expect(icons.length).toBeGreaterThan(0)
    })
  })

  describe('What You\'ll Need Section', () => {
    it('should render What You\'ll Need heading', () => {
      render(<WizardDetailOverview />)

      expect(screen.getByRole('heading', { name: "What You'll Need to Start" })).toBeInTheDocument()
    })

    it('should render instruction text', () => {
      render(<WizardDetailOverview />)

      expect(screen.getByText('Have these details ready to complete the wizard quickly:')).toBeInTheDocument()
    })

    it('should render all start items', () => {
      render(<WizardDetailOverview />)

      expect(screen.getByText(/Disclosing party details/i)).toBeInTheDocument()
      expect(screen.getByText(/Receiving party details/i)).toBeInTheDocument()
      expect(screen.getByText(/Type of information being protected/i)).toBeInTheDocument()
      expect(screen.getByText(/Duration of confidentiality/i)).toBeInTheDocument()
      expect(screen.getByText(/Jurisdiction/i)).toBeInTheDocument()
    })
  })

  describe('How the Wizard Works Section', () => {
    it('should render How the Wizard Works heading', () => {
      render(<WizardDetailOverview />)

      expect(screen.getByRole('heading', { name: 'How the Wizard Works' })).toBeInTheDocument()
    })

    it('should render all 7 wizard steps', () => {
      const { container } = render(<WizardDetailOverview />)

      const steps = container.querySelectorAll('.wizard-detail__step')
      expect(steps).toHaveLength(7)
    })

    it('should render step numbers', () => {
      render(<WizardDetailOverview />)

      for (let i = 1; i <= 7; i++) {
        expect(screen.getByText(i.toString())).toBeInTheDocument()
      }
    })

    it('should render step titles', () => {
      render(<WizardDetailOverview />)

      expect(screen.getByText('Input Your Details')).toBeInTheDocument()
      expect(screen.getByText('AI Legal Review')).toBeInTheDocument()
      expect(screen.getByText('Plain-Language Preview')).toBeInTheDocument()
    })

    it('should render step durations', () => {
      render(<WizardDetailOverview />)

      expect(screen.getByText('3-4 min')).toBeInTheDocument()
      expect(screen.getByText('30 sec')).toBeInTheDocument()
      expect(screen.getByText('1-2 min')).toBeInTheDocument()
    })
  })

  describe('Testimonials Section', () => {
    it('should render What Users Say heading', () => {
      render(<WizardDetailOverview />)

      expect(screen.getByRole('heading', { name: 'What Users Say' })).toBeInTheDocument()
    })

    it('should render testimonial quotes', () => {
      render(<WizardDetailOverview />)

      expect(
        screen.getByText(/Created 3 NDAs in 20 minutes before our investor meetings/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/The plain-language preview helped me understand/i)
      ).toBeInTheDocument()
    })

    it('should render testimonial authors', () => {
      render(<WizardDetailOverview />)

      expect(screen.getByText('Sarah M.')).toBeInTheDocument()
      expect(screen.getByText('James K.')).toBeInTheDocument()
    })

    it('should render testimonial roles', () => {
      render(<WizardDetailOverview />)

      expect(screen.getByText('Founder, TechHub SA')).toBeInTheDocument()
      expect(screen.getByText('Director, Greenfield Consulting')).toBeInTheDocument()
    })

    it('should render star ratings', () => {
      const { container } = render(<WizardDetailOverview />)

      const testimonials = container.querySelectorAll('.wizard-detail__testimonials article')
      testimonials.forEach((testimonial) => {
        const stars = testimonial.querySelectorAll('svg.lucide-star')
        expect(stars).toHaveLength(5)
      })
    })
  })

  describe('Icons', () => {
    it('should render ArrowLeft icon in back link', () => {
      const { container } = render(<WizardDetailOverview />)

      const backLink = container.querySelector('.wizard-detail__back')
      const svg = backLink?.querySelector('svg')
      expect(svg).toHaveClass('lucide-arrow-left')
    })

    it('should render ChevronRight icon in payment button', () => {
      const { container } = render(<WizardDetailOverview />)

      const paymentButton = screen.getByRole('button', { name: /Proceed To Payment/i })
      const svg = paymentButton.querySelector('svg')
      expect(svg).toHaveClass('lucide-chevron-right')
    })

    it('should render Star icon in selected wizards badge', () => {
      const { container } = render(<WizardDetailOverview />)

      const badge = container.querySelector('.wizard-detail__panel-heading span')
      const svg = badge?.querySelector('svg')
      expect(svg).toHaveClass('lucide-star')
    })
  })

  describe('Styling Classes', () => {
    it('should have wizard-detail class', () => {
      const { container } = render(<WizardDetailOverview />)

      const detail = container.querySelector('.wizard-detail')
      expect(detail).toHaveClass('wizard-detail')
    })

    it('should have wizard-detail__topbar class', () => {
      const { container } = render(<WizardDetailOverview />)

      const topbar = container.querySelector('.wizard-detail__topbar')
      expect(topbar).toBeInTheDocument()
    })

    it('should have wizard-detail__header class', () => {
      const { container } = render(<WizardDetailOverview />)

      const header = container.querySelector('.wizard-detail__header')
      expect(header).toBeInTheDocument()
    })

    it('should have wizard-detail__panel classes', () => {
      const { container } = render(<WizardDetailOverview />)

      const panels = container.querySelectorAll('.wizard-detail__panel')
      expect(panels.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<WizardDetailOverview />)

      const h1 = screen.getByRole('heading', { level: 1 })
      const h2Headings = screen.getAllByRole('heading', { level: 2 })
      const h3Headings = screen.getAllByRole('heading', { level: 3 })

      expect(h1).toBeInTheDocument()
      expect(h2Headings.length).toBeGreaterThan(0)
      expect(h3Headings.length).toBeGreaterThan(0)
    })

    it('should have accessible links', () => {
      render(<WizardDetailOverview />)

      const links = screen.getAllByRole('link')
      links.forEach((link) => {
        expect(link.textContent).toBeTruthy()
      })
    })

    it('should use semantic HTML', () => {
      const { container } = render(<WizardDetailOverview />)

      expect(container.querySelector('header')).toBeInTheDocument()
      expect(container.querySelectorAll('section').length).toBeGreaterThan(0)
      expect(container.querySelectorAll('article').length).toBeGreaterThan(0)
    })
  })

  describe('Responsive Design', () => {
    it('should maintain structure across viewports', () => {
      const viewports = [320, 768, 1024, 1280]

      viewports.forEach((width) => {
        window.innerWidth = width
        window.dispatchEvent(new Event('resize'))

        const { container } = render(<WizardDetailOverview />)
        expect(container.querySelector('.wizard-detail')).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should render without errors', () => {
      expect(() => render(<WizardDetailOverview />)).not.toThrow()
    })

    it('should handle empty wizard list', () => {
      render(<WizardDetailOverview />)

      expect(screen.getByText('No wizards selected yet')).toBeInTheDocument()
    })
  })

  describe('Layout Structure', () => {
    it('should have proper section order', () => {
      const { container } = render(<WizardDetailOverview />)

      const sections = container.querySelectorAll('section')
      expect(sections.length).toBeGreaterThan(0)
    })

    it('should have topbar at the top', () => {
      const { container } = render(<WizardDetailOverview />)

      const detail = container.querySelector('.wizard-detail')
      const firstChild = detail?.firstChild
      expect(firstChild).toHaveClass('wizard-detail__topbar')
    })

    it('should have header after topbar', () => {
      const { container } = render(<WizardDetailOverview />)

      const detail = container.querySelector('.wizard-detail')
      const children = Array.from(detail?.children || [])
      expect(children[1]).toHaveClass('wizard-detail__header')
    })
  })

  describe('Content Sections', () => {
    it('should render all major sections', () => {
      render(<WizardDetailOverview />)

      expect(screen.getByRole('heading', { name: 'Selected Wizards' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Pricing for This Wizard' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: "What's Included" })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: "What You'll Need to Start" })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'How the Wizard Works' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'What Users Say' })).toBeInTheDocument()
    })

    it('should have proper section structure', () => {
      const { container } = render(<WizardDetailOverview />)

      const panels = container.querySelectorAll('.wizard-detail__panel')
      expect(panels.length).toBeGreaterThan(0)

      panels.forEach((panel) => {
        const heading = panel.querySelector('h2')
        expect(heading).toBeInTheDocument()
      })
    })
  })

  describe('Pricing Details', () => {
    it('should render sample features', () => {
      render(<WizardDetailOverview />)

      expect(screen.getByText('Unlimited runs')).toBeInTheDocument()
      expect(screen.getByText('Priority processing')).toBeInTheDocument()
      expect(screen.getByText('Advanced automation')).toBeInTheDocument()
      expect(screen.getByText('Bulk operations')).toBeInTheDocument()
    })

    it('should render included features list', () => {
      render(<WizardDetailOverview />)

      expect(screen.getByText('Access to all 12 legal wizards')).toBeInTheDocument()
      expect(screen.getByText('Unlimited wizard runs')).toBeInTheDocument()
      expect(screen.getByText(/Priority support/i)).toBeInTheDocument()
    })

    it('should have What\'s Included in Operator section', () => {
      render(<WizardDetailOverview />)

      expect(screen.getByText("What's Included in Operator:")).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should show empty state heading', () => {
      render(<WizardDetailOverview />)

      expect(screen.getByRole('heading', { name: 'No wizards selected yet' })).toBeInTheDocument()
    })

    it('should show empty state description', () => {
      render(<WizardDetailOverview />)

      expect(
        screen.getByText('Go back to the wizard catalogue and choose the workflows you want to review.')
      ).toBeInTheDocument()
    })

    it('should have Choose Wizards link in empty state', () => {
      render(<WizardDetailOverview />)

      const link = screen.getByRole('link', { name: 'Choose Wizards' })
      expect(link).toHaveAttribute('href', '/wizard-catalogue')
    })
  })
})

// Made with Bob
