import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WizardCatalogueHeader } from './WizardCatalogueHeader'

describe('WizardCatalogueHeader', () => {
  describe('Rendering', () => {
    it('should render the header', () => {
      const { container } = render(<WizardCatalogueHeader totalItems={0} selectedWizardCount={0} />)

      const header = container.querySelector('.wizard-catalogue-header')
      expect(header).toBeInTheDocument()
    })

    it('should render the title', () => {
      render(<WizardCatalogueHeader totalItems={0} selectedWizardCount={0} />)

      expect(screen.getByRole('heading', { name: 'Available Wizards' })).toBeInTheDocument()
    })

    it('should render the description', () => {
      render(<WizardCatalogueHeader totalItems={0} selectedWizardCount={0} />)

      expect(
        screen.getByText(/Add workflows to your cart—you can add the same wizard multiple times/i)
      ).toBeInTheDocument()
    })

    it('should render popular workflows indicator', () => {
      render(<WizardCatalogueHeader totalItems={0} selectedWizardCount={0} />)

      expect(screen.getByText('Popular workflows marked')).toBeInTheDocument()
    })
  })

  describe('Cart Badge', () => {
    it('should show cart badge when totalItems > 0', () => {
      render(<WizardCatalogueHeader totalItems={5} selectedWizardCount={3} />)

      expect(screen.getByText(/5 items \(3 wizards\)/i)).toBeInTheDocument()
    })

    it('should not show cart badge when totalItems is 0', () => {
      render(<WizardCatalogueHeader totalItems={0} selectedWizardCount={0} />)

      expect(screen.queryByText(/items/i)).not.toBeInTheDocument()
    })

    it('should display correct item count', () => {
      render(<WizardCatalogueHeader totalItems={10} selectedWizardCount={5} />)

      expect(screen.getByText(/10 items/i)).toBeInTheDocument()
    })

    it('should display correct wizard count', () => {
      render(<WizardCatalogueHeader totalItems={10} selectedWizardCount={5} />)

      expect(screen.getByText(/5 wizards/i)).toBeInTheDocument()
    })

    it('should update when counts change', () => {
      const { rerender } = render(<WizardCatalogueHeader totalItems={5} selectedWizardCount={3} />)

      expect(screen.getByText(/5 items \(3 wizards\)/i)).toBeInTheDocument()

      rerender(<WizardCatalogueHeader totalItems={10} selectedWizardCount={7} />)

      expect(screen.getByText(/10 items \(7 wizards\)/i)).toBeInTheDocument()
    })

    it('should handle single item and wizard', () => {
      render(<WizardCatalogueHeader totalItems={1} selectedWizardCount={1} />)

      expect(screen.getByText(/1 items \(1 wizards\)/i)).toBeInTheDocument()
    })
  })

  describe('Icons', () => {
    it('should render ShoppingCart icon in cart badge', () => {
      const { container } = render(<WizardCatalogueHeader totalItems={5} selectedWizardCount={3} />)

      const cartBadge = container.querySelector('.wizard-catalogue-header__cart')
      const svg = cartBadge?.querySelector('svg')
      expect(svg).toHaveClass('lucide-shopping-cart')
    })

    it('should render Star icon in popular indicator', () => {
      const { container } = render(<WizardCatalogueHeader totalItems={0} selectedWizardCount={0} />)

      const popularIndicator = container.querySelector('.wizard-catalogue-header__popular')
      const svg = popularIndicator?.querySelector('svg')
      expect(svg).toHaveClass('lucide-star')
    })

    it('should have proper icon sizes', () => {
      const { container } = render(<WizardCatalogueHeader totalItems={5} selectedWizardCount={3} />)

      const icons = container.querySelectorAll('svg')
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute('width', '16')
        expect(icon).toHaveAttribute('height', '16')
      })
    })
  })

  describe('Styling Classes', () => {
    it('should have wizard-catalogue-header class', () => {
      const { container } = render(<WizardCatalogueHeader totalItems={0} selectedWizardCount={0} />)

      const header = container.querySelector('.wizard-catalogue-header')
      expect(header).toHaveClass('wizard-catalogue-header')
    })

    it('should have wizard-catalogue-header__title class', () => {
      const { container } = render(<WizardCatalogueHeader totalItems={0} selectedWizardCount={0} />)

      const title = container.querySelector('.wizard-catalogue-header__title')
      expect(title).toBeInTheDocument()
    })

    it('should have wizard-catalogue-header__copy class', () => {
      const { container } = render(<WizardCatalogueHeader totalItems={0} selectedWizardCount={0} />)

      const copy = container.querySelector('.wizard-catalogue-header__copy')
      expect(copy).toBeInTheDocument()
    })

    it('should have wizard-catalogue-header__meta class', () => {
      const { container } = render(<WizardCatalogueHeader totalItems={0} selectedWizardCount={0} />)

      const meta = container.querySelector('.wizard-catalogue-header__meta')
      expect(meta).toBeInTheDocument()
    })

    it('should have wizard-catalogue-header__cart class when items exist', () => {
      const { container } = render(<WizardCatalogueHeader totalItems={5} selectedWizardCount={3} />)

      const cart = container.querySelector('.wizard-catalogue-header__cart')
      expect(cart).toHaveClass('wizard-catalogue-header__cart')
    })

    it('should have wizard-catalogue-header__popular class', () => {
      const { container } = render(<WizardCatalogueHeader totalItems={0} selectedWizardCount={0} />)

      const popular = container.querySelector('.wizard-catalogue-header__popular')
      expect(popular).toHaveClass('wizard-catalogue-header__popular')
    })
  })

  describe('Layout Structure', () => {
    it('should have proper container hierarchy', () => {
      const { container } = render(<WizardCatalogueHeader totalItems={0} selectedWizardCount={0} />)

      const header = container.querySelector('.wizard-catalogue-header')
      const meta = header?.querySelector('.wizard-catalogue-header__meta')

      expect(header).toBeInTheDocument()
      expect(meta).toBeInTheDocument()
    })

    it('should have title and copy in first section', () => {
      const { container } = render(<WizardCatalogueHeader totalItems={0} selectedWizardCount={0} />)

      const title = container.querySelector('.wizard-catalogue-header__title')
      const copy = container.querySelector('.wizard-catalogue-header__copy')

      expect(title).toBeInTheDocument()
      expect(copy).toBeInTheDocument()
    })

    it('should have meta section with indicators', () => {
      const { container } = render(<WizardCatalogueHeader totalItems={5} selectedWizardCount={3} />)

      const meta = container.querySelector('.wizard-catalogue-header__meta')
      const cart = meta?.querySelector('.wizard-catalogue-header__cart')
      const popular = meta?.querySelector('.wizard-catalogue-header__popular')

      expect(cart).toBeInTheDocument()
      expect(popular).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<WizardCatalogueHeader totalItems={0} selectedWizardCount={0} />)

      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveTextContent('Available Wizards')
    })

    it('should use semantic HTML', () => {
      const { container } = render(<WizardCatalogueHeader totalItems={0} selectedWizardCount={0} />)

      expect(container.querySelector('h2')).toBeInTheDocument()
      expect(container.querySelector('p')).toBeInTheDocument()
    })

    it('should have descriptive text content', () => {
      render(<WizardCatalogueHeader totalItems={5} selectedWizardCount={3} />)

      expect(screen.getByText(/5 items \(3 wizards\)/i)).toBeInTheDocument()
      expect(screen.getByText('Popular workflows marked')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should maintain structure across viewports', () => {
      const viewports = [320, 768, 1024]

      viewports.forEach((width) => {
        window.innerWidth = width
        window.dispatchEvent(new Event('resize'))

        const { container } = render(
          <WizardCatalogueHeader totalItems={5} selectedWizardCount={3} />
        )
        expect(container.querySelector('.wizard-catalogue-header')).toBeInTheDocument()
      })
    })

    it('should have responsive meta section', () => {
      const { container } = render(<WizardCatalogueHeader totalItems={5} selectedWizardCount={3} />)

      const meta = container.querySelector('.wizard-catalogue-header__meta')
      expect(meta).toHaveClass('wizard-catalogue-header__meta')
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero items', () => {
      render(<WizardCatalogueHeader totalItems={0} selectedWizardCount={0} />)

      expect(screen.queryByText(/items/i)).not.toBeInTheDocument()
    })

    it('should handle large numbers', () => {
      render(<WizardCatalogueHeader totalItems={999} selectedWizardCount={99} />)

      expect(screen.getByText(/999 items \(99 wizards\)/i)).toBeInTheDocument()
    })

    it('should handle mismatched counts', () => {
      render(<WizardCatalogueHeader totalItems={10} selectedWizardCount={3} />)

      expect(screen.getByText(/10 items \(3 wizards\)/i)).toBeInTheDocument()
    })

    it('should always show popular indicator regardless of cart state', () => {
      const { rerender } = render(<WizardCatalogueHeader totalItems={0} selectedWizardCount={0} />)

      expect(screen.getByText('Popular workflows marked')).toBeInTheDocument()

      rerender(<WizardCatalogueHeader totalItems={5} selectedWizardCount={3} />)

      expect(screen.getByText('Popular workflows marked')).toBeInTheDocument()
    })
  })

  describe('Dynamic Updates', () => {
    it('should show cart badge when items are added', () => {
      const { rerender } = render(<WizardCatalogueHeader totalItems={0} selectedWizardCount={0} />)

      expect(screen.queryByText(/items/i)).not.toBeInTheDocument()

      rerender(<WizardCatalogueHeader totalItems={3} selectedWizardCount={2} />)

      expect(screen.getByText(/3 items \(2 wizards\)/i)).toBeInTheDocument()
    })

    it('should hide cart badge when items are removed', () => {
      const { rerender } = render(<WizardCatalogueHeader totalItems={5} selectedWizardCount={3} />)

      expect(screen.getByText(/5 items \(3 wizards\)/i)).toBeInTheDocument()

      rerender(<WizardCatalogueHeader totalItems={0} selectedWizardCount={0} />)

      expect(screen.queryByText(/items/i)).not.toBeInTheDocument()
    })

    it('should update counts dynamically', () => {
      const { rerender } = render(<WizardCatalogueHeader totalItems={1} selectedWizardCount={1} />)

      expect(screen.getByText(/1 items \(1 wizards\)/i)).toBeInTheDocument()

      rerender(<WizardCatalogueHeader totalItems={5} selectedWizardCount={3} />)

      expect(screen.getByText(/5 items \(3 wizards\)/i)).toBeInTheDocument()

      rerender(<WizardCatalogueHeader totalItems={10} selectedWizardCount={7} />)

      expect(screen.getByText(/10 items \(7 wizards\)/i)).toBeInTheDocument()
    })
  })

  describe('Content Verification', () => {
    it('should render complete title text', () => {
      render(<WizardCatalogueHeader totalItems={0} selectedWizardCount={0} />)

      const title = screen.getByRole('heading', { name: 'Available Wizards' })
      expect(title.textContent).toBe('Available Wizards')
    })

    it('should render complete description text', () => {
      const { container } = render(<WizardCatalogueHeader totalItems={0} selectedWizardCount={0} />)

      const copy = container.querySelector('.wizard-catalogue-header__copy')
      expect(copy?.textContent).toBe(
        'Add workflows to your cart—you can add the same wizard multiple times'
      )
    })

    it('should render complete popular text', () => {
      render(<WizardCatalogueHeader totalItems={0} selectedWizardCount={0} />)

      expect(screen.getByText('Popular workflows marked')).toBeInTheDocument()
    })
  })

  describe('Typography', () => {
    it('should render title as h2', () => {
      render(<WizardCatalogueHeader totalItems={0} selectedWizardCount={0} />)

      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading.tagName).toBe('H2')
    })

    it('should render description in paragraph', () => {
      const { container } = render(<WizardCatalogueHeader totalItems={0} selectedWizardCount={0} />)

      const paragraph = container.querySelector('.wizard-catalogue-header__copy')
      expect(paragraph?.tagName).toBe('P')
    })

    it('should use span elements for badges', () => {
      const { container } = render(<WizardCatalogueHeader totalItems={5} selectedWizardCount={3} />)

      const cart = container.querySelector('.wizard-catalogue-header__cart')
      const popular = container.querySelector('.wizard-catalogue-header__popular')

      expect(cart?.tagName).toBe('SPAN')
      expect(popular?.tagName).toBe('SPAN')
    })
  })

  describe('Conditional Rendering', () => {
    it('should conditionally render cart badge based on totalItems', () => {
      const { container, rerender } = render(
        <WizardCatalogueHeader totalItems={0} selectedWizardCount={0} />
      )

      let cart = container.querySelector('.wizard-catalogue-header__cart')
      expect(cart).not.toBeInTheDocument()

      rerender(<WizardCatalogueHeader totalItems={1} selectedWizardCount={1} />)

      cart = container.querySelector('.wizard-catalogue-header__cart')
      expect(cart).toBeInTheDocument()
    })

    it('should always render popular indicator', () => {
      const { container } = render(<WizardCatalogueHeader totalItems={0} selectedWizardCount={0} />)

      const popular = container.querySelector('.wizard-catalogue-header__popular')
      expect(popular).toBeInTheDocument()
    })
  })
})

// Made with Bob
