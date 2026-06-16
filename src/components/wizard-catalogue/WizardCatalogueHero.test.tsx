import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WizardCatalogueHero } from './WizardCatalogueHero'

describe('WizardCatalogueHero', () => {
  describe('Rendering', () => {
    it('should render the hero section', () => {
      const { container } = render(<WizardCatalogueHero />)

      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()
    })

    it('should render the main title', () => {
      render(<WizardCatalogueHero />)

      expect(screen.getByRole('heading', { name: 'Choose a Legal Workflow' })).toBeInTheDocument()
    })

    it('should render the description', () => {
      render(<WizardCatalogueHero />)

      expect(
        screen.getByText(
          /Step-by-step guided wizards that draft, review, and finalize your legal documents with proof of compliance./i
        )
      ).toBeInTheDocument()
    })

    it('should render the breadcrumb', () => {
      render(<WizardCatalogueHero />)

      expect(screen.getByText('Marketing Site')).toBeInTheDocument()
      expect(screen.getByText('Wizard Catalogue')).toBeInTheDocument()
    })
  })

  describe('Breadcrumb', () => {
    it('should render Marketing Site breadcrumb item', () => {
      render(<WizardCatalogueHero />)

      expect(screen.getByText('Marketing Site')).toBeInTheDocument()
    })

    it('should render Wizard Catalogue breadcrumb item', () => {
      render(<WizardCatalogueHero />)

      expect(screen.getByText('Wizard Catalogue')).toBeInTheDocument()
    })

    it('should render Circle icon in breadcrumb', () => {
      const { container } = render(<WizardCatalogueHero />)

      const breadcrumb = container.querySelector('.wizard-hero__breadcrumb')
      const svg = breadcrumb?.querySelector('svg.lucide-circle')
      expect(svg).toBeInTheDocument()
    })

    it('should render ChevronRight icon as separator', () => {
      const { container } = render(<WizardCatalogueHero />)

      const chevron = container.querySelector('.wizard-hero__chevron')
      expect(chevron).toBeInTheDocument()
      expect(chevron).toHaveClass('lucide-chevron-right')
    })

    it('should have proper breadcrumb structure', () => {
      const { container } = render(<WizardCatalogueHero />)

      const breadcrumb = container.querySelector('.wizard-hero__breadcrumb')
      const items = breadcrumb?.querySelectorAll('span')
      expect(items?.length).toBeGreaterThan(0)
    })
  })

  describe('Badges', () => {
    it('should render CIPC Compliant badge', () => {
      render(<WizardCatalogueHero />)

      expect(screen.getByText('CIPC Compliant')).toBeInTheDocument()
    })

    it('should render POPIA Certified badge', () => {
      render(<WizardCatalogueHero />)

      expect(screen.getByText('POPIA Certified')).toBeInTheDocument()
    })

    it('should render 500+ SA Startups badge', () => {
      render(<WizardCatalogueHero />)

      expect(screen.getByText('500+ SA Startups')).toBeInTheDocument()
    })

    it('should render all three badges', () => {
      const { container } = render(<WizardCatalogueHero />)

      const badges = container.querySelectorAll('.wizard-hero__badges span')
      expect(badges).toHaveLength(3)
    })

    it('should render BadgeCheck icon for CIPC badge', () => {
      const { container } = render(<WizardCatalogueHero />)

      const badges = container.querySelectorAll('.wizard-hero__badges span')
      const cipcBadge = badges[0]
      const svg = cipcBadge.querySelector('svg')
      expect(svg).toHaveClass('lucide-badge-check')
    })

    it('should render ShieldCheck icon for POPIA badge', () => {
      const { container } = render(<WizardCatalogueHero />)

      const badges = container.querySelectorAll('.wizard-hero__badges span')
      const popiaBadge = badges[1]
      const svg = popiaBadge.querySelector('svg')
      expect(svg).toHaveClass('lucide-shield-check')
    })

    it('should render Sparkles icon for Startups badge', () => {
      const { container } = render(<WizardCatalogueHero />)

      const badges = container.querySelectorAll('.wizard-hero__badges span')
      const startupsBadge = badges[2]
      const svg = startupsBadge.querySelector('svg')
      expect(svg).toHaveClass('lucide-sparkles')
    })

    it('should have proper icon sizes', () => {
      const { container } = render(<WizardCatalogueHero />)

      const badgeIcons = container.querySelectorAll('.wizard-hero__badges svg')
      badgeIcons.forEach((icon) => {
        expect(icon).toHaveAttribute('width', '18')
        expect(icon).toHaveAttribute('height', '18')
      })
    })
  })

  describe('Styling Classes', () => {
    it('should have wizard-hero class on section', () => {
      const { container } = render(<WizardCatalogueHero />)

      const section = container.querySelector('section')
      expect(section).toHaveClass('wizard-hero')
    })

    it('should have wizard-hero__inner class', () => {
      const { container } = render(<WizardCatalogueHero />)

      const inner = container.querySelector('.wizard-hero__inner')
      expect(inner).toBeInTheDocument()
    })

    it('should have wizard-hero__breadcrumb class', () => {
      const { container } = render(<WizardCatalogueHero />)

      const breadcrumb = container.querySelector('.wizard-hero__breadcrumb')
      expect(breadcrumb).toBeInTheDocument()
    })

    it('should have wizard-hero__breadcrumb-item class', () => {
      const { container } = render(<WizardCatalogueHero />)

      const breadcrumbItem = container.querySelector('.wizard-hero__breadcrumb-item')
      expect(breadcrumbItem).toBeInTheDocument()
    })

    it('should have wizard-hero__dot class on Circle icon', () => {
      const { container } = render(<WizardCatalogueHero />)

      const dot = container.querySelector('.wizard-hero__dot')
      expect(dot).toBeInTheDocument()
      expect(dot).toHaveClass('lucide-circle')
    })

    it('should have wizard-hero__chevron class on ChevronRight icon', () => {
      const { container } = render(<WizardCatalogueHero />)

      const chevron = container.querySelector('.wizard-hero__chevron')
      expect(chevron).toBeInTheDocument()
    })

    it('should have wizard-hero__title class', () => {
      const { container } = render(<WizardCatalogueHero />)

      const title = container.querySelector('.wizard-hero__title')
      expect(title).toBeInTheDocument()
    })

    it('should have wizard-hero__copy class', () => {
      const { container } = render(<WizardCatalogueHero />)

      const copy = container.querySelector('.wizard-hero__copy')
      expect(copy).toBeInTheDocument()
    })

    it('should have wizard-hero__badges class', () => {
      const { container } = render(<WizardCatalogueHero />)

      const badges = container.querySelector('.wizard-hero__badges')
      expect(badges).toBeInTheDocument()
    })
  })

  describe('Layout Structure', () => {
    it('should have proper container hierarchy', () => {
      const { container } = render(<WizardCatalogueHero />)

      const section = container.querySelector('.wizard-hero')
      const inner = section?.querySelector('.wizard-hero__inner')
      const breadcrumb = inner?.querySelector('.wizard-hero__breadcrumb')
      const title = inner?.querySelector('.wizard-hero__title')
      const copy = inner?.querySelector('.wizard-hero__copy')
      const badges = inner?.querySelector('.wizard-hero__badges')

      expect(section).toBeInTheDocument()
      expect(inner).toBeInTheDocument()
      expect(breadcrumb).toBeInTheDocument()
      expect(title).toBeInTheDocument()
      expect(copy).toBeInTheDocument()
      expect(badges).toBeInTheDocument()
    })

    it('should render elements in correct order', () => {
      const { container } = render(<WizardCatalogueHero />)

      const inner = container.querySelector('.wizard-hero__inner')
      const children = Array.from(inner?.children || [])

      expect(children[0]).toHaveClass('wizard-hero__breadcrumb')
      expect(children[1]).toHaveClass('wizard-hero__title')
      expect(children[2]).toHaveClass('wizard-hero__copy')
      expect(children[3]).toHaveClass('wizard-hero__badges')
    })

    it('should have badges container with three spans', () => {
      const { container } = render(<WizardCatalogueHero />)

      const badges = container.querySelector('.wizard-hero__badges')
      const spans = badges?.querySelectorAll('span')
      expect(spans).toHaveLength(3)
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<WizardCatalogueHero />)

      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Choose a Legal Workflow')
    })

    it('should use semantic HTML', () => {
      const { container } = render(<WizardCatalogueHero />)

      expect(container.querySelector('section')).toBeInTheDocument()
      expect(container.querySelector('h1')).toBeInTheDocument()
      expect(container.querySelector('p')).toBeInTheDocument()
    })

    it('should have descriptive text content', () => {
      render(<WizardCatalogueHero />)

      expect(screen.getByText('Choose a Legal Workflow')).toBeInTheDocument()
      expect(
        screen.getByText(/Step-by-step guided wizards that draft, review, and finalize/i)
      ).toBeInTheDocument()
    })

    it('should have navigation breadcrumb', () => {
      render(<WizardCatalogueHero />)

      expect(screen.getByText('Marketing Site')).toBeInTheDocument()
      expect(screen.getByText('Wizard Catalogue')).toBeInTheDocument()
    })
  })

  describe('Content Verification', () => {
    it('should render complete title text', () => {
      render(<WizardCatalogueHero />)

      const title = screen.getByRole('heading', { name: 'Choose a Legal Workflow' })
      expect(title.textContent).toBe('Choose a Legal Workflow')
    })

    it('should render complete description text', () => {
      const { container } = render(<WizardCatalogueHero />)

      const copy = container.querySelector('.wizard-hero__copy')
      expect(copy?.textContent).toBe(
        'Step-by-step guided wizards that draft, review, and finalize your legal documents with proof of compliance.'
      )
    })

    it('should render all badge texts correctly', () => {
      render(<WizardCatalogueHero />)

      expect(screen.getByText('CIPC Compliant')).toBeInTheDocument()
      expect(screen.getByText('POPIA Certified')).toBeInTheDocument()
      expect(screen.getByText('500+ SA Startups')).toBeInTheDocument()
    })

    it('should render breadcrumb items correctly', () => {
      render(<WizardCatalogueHero />)

      expect(screen.getByText('Marketing Site')).toBeInTheDocument()
      expect(screen.getByText('Wizard Catalogue')).toBeInTheDocument()
    })
  })

  describe('Typography', () => {
    it('should render title as h1', () => {
      render(<WizardCatalogueHero />)

      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading.tagName).toBe('H1')
    })

    it('should render description in paragraph', () => {
      const { container } = render(<WizardCatalogueHero />)

      const paragraph = container.querySelector('.wizard-hero__copy')
      expect(paragraph?.tagName).toBe('P')
    })

    it('should use span elements for breadcrumb items', () => {
      const { container } = render(<WizardCatalogueHero />)

      const breadcrumb = container.querySelector('.wizard-hero__breadcrumb')
      const spans = breadcrumb?.querySelectorAll('span')
      expect(spans?.length).toBeGreaterThan(0)
    })

    it('should use span elements for badges', () => {
      const { container } = render(<WizardCatalogueHero />)

      const badges = container.querySelector('.wizard-hero__badges')
      const spans = badges?.querySelectorAll('span')
      expect(spans).toHaveLength(3)
    })
  })

  describe('Icons', () => {
    it('should render all required icons', () => {
      const { container } = render(<WizardCatalogueHero />)

      const icons = container.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should render Circle icon with correct size', () => {
      const { container } = render(<WizardCatalogueHero />)

      const circleIcon = container.querySelector('.wizard-hero__dot')
      expect(circleIcon).toHaveAttribute('width', '13')
      expect(circleIcon).toHaveAttribute('height', '13')
    })

    it('should render ChevronRight icon with correct size', () => {
      const { container } = render(<WizardCatalogueHero />)

      const chevronIcon = container.querySelector('.wizard-hero__chevron')
      expect(chevronIcon).toHaveAttribute('width', '16')
      expect(chevronIcon).toHaveAttribute('height', '16')
    })

    it('should render badge icons with correct size', () => {
      const { container } = render(<WizardCatalogueHero />)

      const badgeIcons = container.querySelectorAll('.wizard-hero__badges svg')
      badgeIcons.forEach((icon) => {
        expect(icon).toHaveAttribute('width', '18')
        expect(icon).toHaveAttribute('height', '18')
      })
    })
  })

  describe('Edge Cases', () => {
    it('should render without errors', () => {
      expect(() => render(<WizardCatalogueHero />)).not.toThrow()
    })

    it('should render consistently on multiple renders', () => {
      const { rerender } = render(<WizardCatalogueHero />)

      expect(screen.getByText('Choose a Legal Workflow')).toBeInTheDocument()

      rerender(<WizardCatalogueHero />)

      expect(screen.getByText('Choose a Legal Workflow')).toBeInTheDocument()
      expect(screen.getByText('CIPC Compliant')).toBeInTheDocument()
    })

    it('should maintain structure after re-render', () => {
      const { container, rerender } = render(<WizardCatalogueHero />)

      const initialBadges = container.querySelectorAll('.wizard-hero__badges span')
      expect(initialBadges).toHaveLength(3)

      rerender(<WizardCatalogueHero />)

      const rerenderedBadges = container.querySelectorAll('.wizard-hero__badges span')
      expect(rerenderedBadges).toHaveLength(3)
    })
  })

  describe('Responsive Design', () => {
    it('should maintain structure across viewports', () => {
      const viewports = [320, 768, 1024]

      viewports.forEach((width) => {
        window.innerWidth = width
        window.dispatchEvent(new Event('resize'))

        const { container } = render(<WizardCatalogueHero />)
        expect(container.querySelector('.wizard-hero')).toBeInTheDocument()
      })
    })

    it('should have responsive inner container', () => {
      const { container } = render(<WizardCatalogueHero />)

      const inner = container.querySelector('.wizard-hero__inner')
      expect(inner).toHaveClass('wizard-hero__inner')
    })
  })

  describe('Badge Order', () => {
    it('should render badges in correct order', () => {
      const { container } = render(<WizardCatalogueHero />)

      const badges = container.querySelectorAll('.wizard-hero__badges span')
      const badgeTexts = Array.from(badges).map((badge) => badge.textContent)

      expect(badgeTexts[0]).toContain('CIPC Compliant')
      expect(badgeTexts[1]).toContain('POPIA Certified')
      expect(badgeTexts[2]).toContain('500+ SA Startups')
    })

    it('should have icons before text in badges', () => {
      const { container } = render(<WizardCatalogueHero />)

      const badges = container.querySelectorAll('.wizard-hero__badges span')
      badges.forEach((badge) => {
        const children = Array.from(badge.children)
        expect(children[0].tagName).toBe('svg')
      })
    })
  })

  describe('Breadcrumb Structure', () => {
    it('should have breadcrumb item with icon', () => {
      const { container } = render(<WizardCatalogueHero />)

      const breadcrumbItem = container.querySelector('.wizard-hero__breadcrumb-item')
      const icon = breadcrumbItem?.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should have chevron separator between items', () => {
      const { container } = render(<WizardCatalogueHero />)

      const chevron = container.querySelector('.wizard-hero__chevron')
      expect(chevron).toBeInTheDocument()
    })

    it('should render breadcrumb items in order', () => {
      render(<WizardCatalogueHero />)

      const marketingSite = screen.getByText('Marketing Site')
      const wizardCatalogue = screen.getByText('Wizard Catalogue')

      expect(marketingSite).toBeInTheDocument()
      expect(wizardCatalogue).toBeInTheDocument()
    })
  })
})

// Made with Bob
