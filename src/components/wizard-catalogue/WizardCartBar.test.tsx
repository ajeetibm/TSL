import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { WizardCartBar } from './WizardCartBar'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockSelectedWizards = [
  { title: 'Shareholders Agreement', quantity: 2 },
  { title: 'Employment Contract', quantity: 1 },
  { title: 'NDA', quantity: 3 },
]

const renderCartBar = (props = {}) => {
  const defaultProps = {
    selectedWizards: mockSelectedWizards,
    totalItems: 6,
    onClear: vi.fn(),
    ...props,
  }

  return render(
    <BrowserRouter>
      <WizardCartBar {...defaultProps} />
    </BrowserRouter>
  )
}

describe('WizardCartBar', () => {
  describe('Rendering', () => {
    it('should render when totalItems > 0', () => {
      const { container } = renderCartBar()

      const cartBar = container.querySelector('.wizard-cart-bar')
      expect(cartBar).toBeInTheDocument()
    })

    it('should not render when totalItems is 0', () => {
      const { container } = renderCartBar({ totalItems: 0, selectedWizards: [] })

      const cartBar = container.querySelector('.wizard-cart-bar')
      expect(cartBar).not.toBeInTheDocument()
    })

    it('should render cart summary with total items', () => {
      renderCartBar()

      expect(screen.getByText(/Your Cart \(6 items\):/i)).toBeInTheDocument()
    })

    it('should render all selected wizard chips', () => {
      renderCartBar()

      expect(screen.getByText('Shareholders Agreement')).toBeInTheDocument()
      expect(screen.getByText('Employment Contract')).toBeInTheDocument()
      expect(screen.getByText('NDA')).toBeInTheDocument()
    })

    it('should render quantity badges for each wizard', () => {
      renderCartBar()

      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  describe('Action Buttons', () => {
    it('should render Clear Cart button', () => {
      renderCartBar()

      expect(screen.getByRole('button', { name: 'Clear Cart' })).toBeInTheDocument()
    })

    it('should render View Details button', () => {
      renderCartBar()

      expect(screen.getByRole('button', { name: /View Details/i })).toBeInTheDocument()
    })

    it('should call onClear when Clear Cart is clicked', async () => {
      const user = userEvent.setup()
      const onClear = vi.fn()

      renderCartBar({ onClear })

      const clearButton = screen.getByRole('button', { name: 'Clear Cart' })
      await user.click(clearButton)

      expect(onClear).toHaveBeenCalledTimes(1)
    })

    it('should navigate to wizard-details when View Details is clicked', async () => {
      const user = userEvent.setup()
      renderCartBar()

      const viewDetailsButton = screen.getByRole('button', { name: /View Details/i })
      await user.click(viewDetailsButton)

      expect(mockNavigate).toHaveBeenCalledWith('/wizard-details')
    })
  })

  describe('Icons', () => {
    it('should render ShoppingCart icon in View Details button', () => {
      const { container } = renderCartBar()

      const viewDetailsButton = screen.getByRole('button', { name: /View Details/i })
      const svg = viewDetailsButton.querySelector('svg.lucide-shopping-cart')
      expect(svg).toBeInTheDocument()
    })

    it('should render ChevronRight icon in View Details button', () => {
      const { container } = renderCartBar()

      const viewDetailsButton = screen.getByRole('button', { name: /View Details/i })
      const svg = viewDetailsButton.querySelector('svg.lucide-chevron-right')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('Wizard Chips', () => {
    it('should render wizard title in each chip', () => {
      const { container } = renderCartBar()

      const chips = container.querySelectorAll('.wizard-cart-bar__chips span')
      expect(chips).toHaveLength(3)

      expect(chips[0].textContent).toContain('Shareholders Agreement')
      expect(chips[1].textContent).toContain('Employment Contract')
      expect(chips[2].textContent).toContain('NDA')
    })

    it('should render quantity badge in each chip', () => {
      const { container } = renderCartBar()

      const badges = container.querySelectorAll('.wizard-cart-bar__chips b')
      expect(badges).toHaveLength(3)

      expect(badges[0].textContent).toBe('2')
      expect(badges[1].textContent).toBe('1')
      expect(badges[2].textContent).toBe('3')
    })

    it('should handle single wizard', () => {
      renderCartBar({
        selectedWizards: [{ title: 'Single Wizard', quantity: 1 }],
        totalItems: 1,
      })

      expect(screen.getByText('Single Wizard')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('should handle many wizards', () => {
      const manyWizards = [
        { title: 'Wizard 1', quantity: 1 },
        { title: 'Wizard 2', quantity: 2 },
        { title: 'Wizard 3', quantity: 3 },
        { title: 'Wizard 4', quantity: 4 },
        { title: 'Wizard 5', quantity: 5 },
      ]

      renderCartBar({
        selectedWizards: manyWizards,
        totalItems: 15,
      })

      manyWizards.forEach((wizard) => {
        expect(screen.getByText(wizard.title)).toBeInTheDocument()
      })
    })
  })

  describe('Styling Classes', () => {
    it('should have wizard-cart-bar class', () => {
      const { container } = renderCartBar()

      const cartBar = container.querySelector('.wizard-cart-bar')
      expect(cartBar).toHaveClass('wizard-cart-bar')
    })

    it('should have wizard-cart-bar__content class', () => {
      const { container } = renderCartBar()

      const content = container.querySelector('.wizard-cart-bar__content')
      expect(content).toBeInTheDocument()
    })

    it('should have wizard-cart-bar__summary class', () => {
      const { container } = renderCartBar()

      const summary = container.querySelector('.wizard-cart-bar__summary')
      expect(summary).toBeInTheDocument()
    })

    it('should have wizard-cart-bar__chips class', () => {
      const { container } = renderCartBar()

      const chips = container.querySelector('.wizard-cart-bar__chips')
      expect(chips).toBeInTheDocument()
    })

    it('should have wizard-cart-bar__actions class', () => {
      const { container } = renderCartBar()

      const actions = container.querySelector('.wizard-cart-bar__actions')
      expect(actions).toBeInTheDocument()
    })

    it('should have wizard-cart-bar__clear class on Clear button', () => {
      renderCartBar()

      const clearButton = screen.getByRole('button', { name: 'Clear Cart' })
      expect(clearButton).toHaveClass('wizard-cart-bar__clear')
    })

    it('should have wizard-cart-bar__details class on View Details button', () => {
      renderCartBar()

      const detailsButton = screen.getByRole('button', { name: /View Details/i })
      expect(detailsButton).toHaveClass('wizard-cart-bar__details')
    })
  })

  describe('Total Items Display', () => {
    it('should display correct total items count', () => {
      renderCartBar({ totalItems: 10 })

      expect(screen.getByText(/Your Cart \(10 items\):/i)).toBeInTheDocument()
    })

    it('should update when total items changes', () => {
      const { rerender } = render(
        <BrowserRouter>
          <WizardCartBar
            selectedWizards={mockSelectedWizards}
            totalItems={6}
            onClear={vi.fn()}
          />
        </BrowserRouter>
      )

      expect(screen.getByText(/Your Cart \(6 items\):/i)).toBeInTheDocument()

      rerender(
        <BrowserRouter>
          <WizardCartBar
            selectedWizards={mockSelectedWizards}
            totalItems={12}
            onClear={vi.fn()}
          />
        </BrowserRouter>
      )

      expect(screen.getByText(/Your Cart \(12 items\):/i)).toBeInTheDocument()
    })

    it('should handle singular item', () => {
      renderCartBar({ totalItems: 1, selectedWizards: [{ title: 'Test', quantity: 1 }] })

      expect(screen.getByText(/Your Cart \(1 items\):/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      renderCartBar()

      expect(screen.getByRole('button', { name: 'Clear Cart' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /View Details/i })).toBeInTheDocument()
    })

    it('should have clickable buttons', () => {
      renderCartBar()

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(2)

      buttons.forEach((button) => {
        expect(button).toBeEnabled()
      })
    })

    it('should use strong element for emphasis', () => {
      const { container } = renderCartBar()

      const strong = container.querySelector('strong')
      expect(strong).toBeInTheDocument()
      expect(strong?.textContent).toContain('Your Cart')
    })

    it('should use b element for quantity badges', () => {
      const { container } = renderCartBar()

      const badges = container.querySelectorAll('b')
      expect(badges.length).toBeGreaterThan(0)
    })
  })

  describe('Responsive Behavior', () => {
    it('should maintain structure across viewports', () => {
      const viewports = [320, 768, 900, 1024]

      viewports.forEach((width) => {
        window.innerWidth = width
        window.dispatchEvent(new Event('resize'))

        const { container } = renderCartBar()
        expect(container.querySelector('.wizard-cart-bar')).toBeInTheDocument()
      })
    })

    it('should have sticky positioning', () => {
      const { container } = renderCartBar()

      const cartBar = container.querySelector('.wizard-cart-bar')
      expect(cartBar).toHaveClass('wizard-cart-bar')
    })
  })

  describe('Edge Cases', () => {
    it('should return null when totalItems is 0', () => {
      const { container } = renderCartBar({ totalItems: 0, selectedWizards: [] })

      expect(container.firstChild).toBeNull()
    })

    it('should handle empty selectedWizards array', () => {
      const { container } = renderCartBar({ selectedWizards: [], totalItems: 0 })

      expect(container.firstChild).toBeNull()
    })

    it('should handle wizard with long title', () => {
      renderCartBar({
        selectedWizards: [
          {
            title: 'Very Long Wizard Title That Should Wrap Or Truncate Properly',
            quantity: 1,
          },
        ],
        totalItems: 1,
      })

      expect(
        screen.getByText('Very Long Wizard Title That Should Wrap Or Truncate Properly')
      ).toBeInTheDocument()
    })

    it('should handle large quantities', () => {
      renderCartBar({
        selectedWizards: [{ title: 'Test Wizard', quantity: 99 }],
        totalItems: 99,
      })

      expect(screen.getByText('99')).toBeInTheDocument()
    })

    it('should handle rapid button clicks', async () => {
      const user = userEvent.setup()
      const onClear = vi.fn()

      renderCartBar({ onClear })

      const clearButton = screen.getByRole('button', { name: 'Clear Cart' })
      await user.click(clearButton)
      await user.click(clearButton)
      await user.click(clearButton)

      expect(onClear).toHaveBeenCalledTimes(3)
    })
  })

  describe('Dynamic Updates', () => {
    it('should update when selectedWizards changes', () => {
      const { rerender } = render(
        <BrowserRouter>
          <WizardCartBar
            selectedWizards={[{ title: 'Wizard 1', quantity: 1 }]}
            totalItems={1}
            onClear={vi.fn()}
          />
        </BrowserRouter>
      )

      expect(screen.getByText('Wizard 1')).toBeInTheDocument()

      rerender(
        <BrowserRouter>
          <WizardCartBar
            selectedWizards={[{ title: 'Wizard 2', quantity: 2 }]}
            totalItems={2}
            onClear={vi.fn()}
          />
        </BrowserRouter>
      )

      expect(screen.queryByText('Wizard 1')).not.toBeInTheDocument()
      expect(screen.getByText('Wizard 2')).toBeInTheDocument()
    })

    it('should disappear when totalItems becomes 0', () => {
      const { container, rerender } = render(
        <BrowserRouter>
          <WizardCartBar
            selectedWizards={mockSelectedWizards}
            totalItems={6}
            onClear={vi.fn()}
          />
        </BrowserRouter>
      )

      expect(container.querySelector('.wizard-cart-bar')).toBeInTheDocument()

      rerender(
        <BrowserRouter>
          <WizardCartBar selectedWizards={[]} totalItems={0} onClear={vi.fn()} />
        </BrowserRouter>
      )

      expect(container.querySelector('.wizard-cart-bar')).not.toBeInTheDocument()
    })

    it('should appear when totalItems becomes > 0', () => {
      const { container, rerender } = render(
        <BrowserRouter>
          <WizardCartBar selectedWizards={[]} totalItems={0} onClear={vi.fn()} />
        </BrowserRouter>
      )

      expect(container.querySelector('.wizard-cart-bar')).not.toBeInTheDocument()

      rerender(
        <BrowserRouter>
          <WizardCartBar
            selectedWizards={[{ title: 'New Wizard', quantity: 1 }]}
            totalItems={1}
            onClear={vi.fn()}
          />
        </BrowserRouter>
      )

      expect(container.querySelector('.wizard-cart-bar')).toBeInTheDocument()
    })
  })

  describe('Layout Structure', () => {
    it('should have proper container hierarchy', () => {
      const { container } = renderCartBar()

      const cartBar = container.querySelector('.wizard-cart-bar')
      const content = cartBar?.querySelector('.wizard-cart-bar__content')
      const summary = content?.querySelector('.wizard-cart-bar__summary')
      const actions = content?.querySelector('.wizard-cart-bar__actions')

      expect(cartBar).toBeInTheDocument()
      expect(content).toBeInTheDocument()
      expect(summary).toBeInTheDocument()
      expect(actions).toBeInTheDocument()
    })

    it('should have chips container inside summary', () => {
      const { container } = renderCartBar()

      const summary = container.querySelector('.wizard-cart-bar__summary')
      const chips = summary?.querySelector('.wizard-cart-bar__chips')

      expect(chips).toBeInTheDocument()
    })

    it('should have both buttons in actions container', () => {
      const { container } = renderCartBar()

      const actions = container.querySelector('.wizard-cart-bar__actions')
      const buttons = actions?.querySelectorAll('button')

      expect(buttons).toHaveLength(2)
    })
  })

  describe('Button Interactions', () => {
    it('should not navigate when Clear Cart is clicked', async () => {
      const user = userEvent.setup()
      mockNavigate.mockClear()

      renderCartBar()

      const clearButton = screen.getByRole('button', { name: 'Clear Cart' })
      await user.click(clearButton)

      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should not call onClear when View Details is clicked', async () => {
      const user = userEvent.setup()
      const onClear = vi.fn()

      renderCartBar({ onClear })

      const viewDetailsButton = screen.getByRole('button', { name: /View Details/i })
      await user.click(viewDetailsButton)

      expect(onClear).not.toHaveBeenCalled()
    })
  })
})

// Made with Bob
