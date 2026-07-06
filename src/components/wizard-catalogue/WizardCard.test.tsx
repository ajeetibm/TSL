import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileText } from 'lucide-react'
import { WizardCard } from './WizardCard'

const mockWizardProps = {
  title: 'Shareholders Agreement',
  description: 'Define ownership, rights, and responsibilities between shareholders',
  time: '15-20 min',
  audience: 'Startups with multiple founders',
  included: ['Ownership Structure', 'Voting Rights', 'Exit Clauses'],
  icon: FileText,
  popular: false,
  quantity: 0,
  onIncrement: vi.fn(),
  onDecrement: vi.fn(),
}

describe('WizardCard', () => {
  describe('Rendering', () => {
    it('should render the wizard card', () => {
      const { container } = render(<WizardCard {...mockWizardProps} />)

      const article = container.querySelector('article')
      expect(article).toBeInTheDocument()
    })

    it('should render the title', () => {
      render(<WizardCard {...mockWizardProps} />)

      expect(screen.getByRole('heading', { name: 'Shareholders Agreement' })).toBeInTheDocument()
    })

    it('should render the description', () => {
      render(<WizardCard {...mockWizardProps} />)

      expect(
        screen.getByText('Define ownership, rights, and responsibilities between shareholders')
      ).toBeInTheDocument()
    })

    it('should render the icon', () => {
      const { container } = render(<WizardCard {...mockWizardProps} />)

      const icon = container.querySelector('.wizard-card__icon')
      expect(icon).toBeInTheDocument()
      expect(icon?.querySelector('svg')).toBeInTheDocument()
    })

    it('should render Select button when quantity is 0', () => {
      render(<WizardCard {...mockWizardProps} />)

      expect(screen.getByRole('button', { name: /Select/i })).toBeInTheDocument()
    })
  })

  describe('Popular Badge', () => {
    it('should show popular badge when popular is true', () => {
      render(<WizardCard {...mockWizardProps} popular={true} />)

      expect(screen.getByText('Popular')).toBeInTheDocument()
    })

    it('should not show popular badge when popular is false', () => {
      render(<WizardCard {...mockWizardProps} popular={false} />)

      expect(screen.queryByText('Popular')).not.toBeInTheDocument()
    })

    it('should render Star icon in popular badge', () => {
      const { container } = render(<WizardCard {...mockWizardProps} popular={true} />)

      const popularBadge = container.querySelector('.wizard-card__popular')
      const svg = popularBadge?.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass('lucide-star')
    })

    it('should have proper styling class for popular badge', () => {
      const { container } = render(<WizardCard {...mockWizardProps} popular={true} />)

      const popularBadge = container.querySelector('.wizard-card__popular')
      expect(popularBadge).toHaveClass('wizard-card__popular')
    })
  })

  describe('Quantity Badge', () => {
    it('should show quantity badge when quantity > 0', () => {
      render(<WizardCard {...mockWizardProps} quantity={3} />)

      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should not show quantity badge when quantity is 0', () => {
      const { container } = render(<WizardCard {...mockWizardProps} quantity={0} />)

      const badge = container.querySelector('.wizard-card__count-badge')
      expect(badge).not.toBeInTheDocument()
    })

    it('should update badge when quantity changes', () => {
      const { rerender } = render(<WizardCard {...mockWizardProps} quantity={1} />)

      expect(screen.getByText('1')).toBeInTheDocument()

      rerender(<WizardCard {...mockWizardProps} quantity={5} />)

      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('should have proper styling class for quantity badge', () => {
      const { container } = render(<WizardCard {...mockWizardProps} quantity={2} />)

      const badge = container.querySelector('.wizard-card__count-badge')
      expect(badge).toHaveClass('wizard-card__count-badge')
    })
  })

  describe('Info Rows', () => {
    it('should render Time info row', () => {
      render(<WizardCard {...mockWizardProps} />)

      expect(screen.getByText('Time:')).toBeInTheDocument()
      expect(screen.getByText('15-20 min')).toBeInTheDocument()
    })

    it('should render Runs info row with singular form', () => {
      render(<WizardCard {...mockWizardProps} quantity={0} />)

      expect(screen.getByText('Runs:')).toBeInTheDocument()
      expect(screen.getByText('1 run')).toBeInTheDocument()
    })

    it('should render Runs info row with plural form', () => {
      render(<WizardCard {...mockWizardProps} quantity={3} />)

      expect(screen.getByText('Runs:')).toBeInTheDocument()
      expect(screen.getByText('3 runs')).toBeInTheDocument()
    })

    it('should render For (audience) info row', () => {
      render(<WizardCard {...mockWizardProps} />)

      expect(screen.getByText('For:')).toBeInTheDocument()
      expect(screen.getByText('Startups with multiple founders')).toBeInTheDocument()
    })

    it('should render Clock3 icon for Time', () => {
      const { container } = render(<WizardCard {...mockWizardProps} />)

      const factRows = container.querySelectorAll('.wizard-card__fact-row')
      const timeRow = factRows[0]
      const svg = timeRow.querySelector('svg')
      expect(svg).toHaveClass('lucide-clock-3')
    })

    it('should render ShoppingCart icon for Runs', () => {
      const { container } = render(<WizardCard {...mockWizardProps} />)

      const factRows = container.querySelectorAll('.wizard-card__fact-row')
      const runsRow = factRows[1]
      const svg = runsRow.querySelector('svg')
      expect(svg).toHaveClass('lucide-shopping-cart')
    })

    it('should render Gavel icon for For', () => {
      const { container } = render(<WizardCard {...mockWizardProps} />)

      const factRows = container.querySelectorAll('.wizard-card__fact-row')
      const forRow = factRows[2]
      const svg = forRow.querySelector('svg')
      expect(svg).toHaveClass('lucide-gavel')
    })
  })

  describe('Included Items', () => {
    it('should render "What\'s Included:" label', () => {
      render(<WizardCard {...mockWizardProps} />)

      expect(screen.getByText("What's Included:")).toBeInTheDocument()
    })

    it('should render all included items', () => {
      render(<WizardCard {...mockWizardProps} />)

      expect(screen.getByText('Ownership Structure')).toBeInTheDocument()
      expect(screen.getByText('Voting Rights')).toBeInTheDocument()
      expect(screen.getByText('Exit Clauses')).toBeInTheDocument()
    })

    it('should render included items as spans', () => {
      const { container } = render(<WizardCard {...mockWizardProps} />)

      const includedContainer = container.querySelector('.wizard-card__included div')
      const spans = includedContainer?.querySelectorAll('span')
      expect(spans).toHaveLength(3)
    })

    it('should handle empty included array', () => {
      render(<WizardCard {...mockWizardProps} included={[]} />)

      expect(screen.getByText("What's Included:")).toBeInTheDocument()
    })

    it('should handle single included item', () => {
      render(<WizardCard {...mockWizardProps} included={['Single Item']} />)

      expect(screen.getByText('Single Item')).toBeInTheDocument()
    })

    it('should handle many included items', () => {
      const manyItems = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5']
      render(<WizardCard {...mockWizardProps} included={manyItems} />)

      manyItems.forEach((item) => {
        expect(screen.getByText(item)).toBeInTheDocument()
      })
    })
  })

  describe('Select Button', () => {
    it('should render Select button when not selected', () => {
      render(<WizardCard {...mockWizardProps} quantity={0} />)

      const button = screen.getByRole('button', { name: /Select/i })
      expect(button).toBeInTheDocument()
    })

    it('should call onIncrement when Select button is clicked', async () => {
      const user = userEvent.setup()
      const onIncrement = vi.fn()

      render(<WizardCard {...mockWizardProps} quantity={0} onIncrement={onIncrement} />)

      const button = screen.getByRole('button', { name: /Select/i })
      await user.click(button)

      expect(onIncrement).toHaveBeenCalledTimes(1)
    })

    it('should render CheckCircle2 icon in Select button', () => {
      render(<WizardCard {...mockWizardProps} quantity={0} />)

      const button = screen.getByRole('button', { name: /Select/i })
      const svg = button.querySelector('svg')
      expect(svg).toHaveClass('lucide-check-circle-2')
    })

    it('should have proper styling class', () => {
      render(<WizardCard {...mockWizardProps} quantity={0} />)

      const button = screen.getByRole('button', { name: /Select/i })
      expect(button).toHaveClass('wizard-card__select')
    })
  })

  describe('Stepper Controls', () => {
    it('should render stepper when quantity > 0', () => {
      render(<WizardCard {...mockWizardProps} quantity={2} />)

      const stepper = screen.getByLabelText('Shareholders Agreement quantity')
      expect(stepper).toBeInTheDocument()
    })

    it('should not render stepper when quantity is 0', () => {
      render(<WizardCard {...mockWizardProps} quantity={0} />)

      const stepper = screen.queryByLabelText('Shareholders Agreement quantity')
      expect(stepper).not.toBeInTheDocument()
    })

    it('should render minus button', () => {
      const { container } = render(<WizardCard {...mockWizardProps} quantity={2} />)

      const minusButton = container.querySelector('.wizard-card__stepper-button--minus')
      expect(minusButton).toBeInTheDocument()
    })

    it('should render plus button', () => {
      const { container } = render(<WizardCard {...mockWizardProps} quantity={2} />)

      const plusButton = container.querySelector('.wizard-card__stepper-button--plus')
      expect(plusButton).toBeInTheDocument()
    })

    it('should display current quantity', () => {
      const { container } = render(<WizardCard {...mockWizardProps} quantity={5} />)

      const count = container.querySelector('.wizard-card__stepper-count')
      expect(count?.textContent).toBe('5')
    })

    it('should call onDecrement when minus button is clicked', async () => {
      const user = userEvent.setup()
      const onDecrement = vi.fn()
      const { container } = render(
        <WizardCard {...mockWizardProps} quantity={2} onDecrement={onDecrement} />
      )

      const minusButton = container.querySelector('.wizard-card__stepper-button--minus')
      await user.click(minusButton!)

      expect(onDecrement).toHaveBeenCalledTimes(1)
    })

    it('should call onIncrement when plus button is clicked', async () => {
      const user = userEvent.setup()
      const onIncrement = vi.fn()
      const { container } = render(
        <WizardCard {...mockWizardProps} quantity={2} onIncrement={onIncrement} />
      )

      const plusButton = container.querySelector('.wizard-card__stepper-button--plus')
      await user.click(plusButton!)

      expect(onIncrement).toHaveBeenCalledTimes(1)
    })

    it('should render Minus icon in minus button', () => {
      const { container } = render(<WizardCard {...mockWizardProps} quantity={2} />)

      const minusButton = container.querySelector('.wizard-card__stepper-button--minus')
      const svg = minusButton?.querySelector('svg')
      expect(svg).toHaveClass('lucide-minus')
    })

    it('should render Plus icon in plus button', () => {
      const { container } = render(<WizardCard {...mockWizardProps} quantity={2} />)

      const plusButton = container.querySelector('.wizard-card__stepper-button--plus')
      const svg = plusButton?.querySelector('svg')
      expect(svg).toHaveClass('lucide-plus')
    })
  })

  describe('Selected State', () => {
    it('should add selected class when quantity > 0', () => {
      const { container } = render(<WizardCard {...mockWizardProps} quantity={1} />)

      const article = container.querySelector('article')
      expect(article).toHaveClass('wizard-card--selected')
    })

    it('should not have selected class when quantity is 0', () => {
      const { container } = render(<WizardCard {...mockWizardProps} quantity={0} />)

      const article = container.querySelector('article')
      expect(article).not.toHaveClass('wizard-card--selected')
    })

    it('should toggle selected state based on quantity', () => {
      const { container, rerender } = render(<WizardCard {...mockWizardProps} quantity={0} />)

      let article = container.querySelector('article')
      expect(article).not.toHaveClass('wizard-card--selected')

      rerender(<WizardCard {...mockWizardProps} quantity={1} />)

      article = container.querySelector('article')
      expect(article).toHaveClass('wizard-card--selected')
    })
  })

  describe('Styling Classes', () => {
    it('should have wizard-card class', () => {
      const { container } = render(<WizardCard {...mockWizardProps} />)

      const article = container.querySelector('article')
      expect(article).toHaveClass('wizard-card')
    })

    it('should have wizard-card__icon class', () => {
      const { container } = render(<WizardCard {...mockWizardProps} />)

      const icon = container.querySelector('.wizard-card__icon')
      expect(icon).toBeInTheDocument()
    })

    it('should have wizard-card__intro class', () => {
      const { container } = render(<WizardCard {...mockWizardProps} />)

      const intro = container.querySelector('.wizard-card__intro')
      expect(intro).toBeInTheDocument()
    })

    it('should have wizard-card__title class', () => {
      const { container } = render(<WizardCard {...mockWizardProps} />)

      const title = container.querySelector('.wizard-card__title')
      expect(title).toBeInTheDocument()
    })

    it('should have wizard-card__description class', () => {
      const { container } = render(<WizardCard {...mockWizardProps} />)

      const description = container.querySelector('.wizard-card__description')
      expect(description).toBeInTheDocument()
    })

    it('should have wizard-card__facts class', () => {
      const { container } = render(<WizardCard {...mockWizardProps} />)

      const facts = container.querySelector('.wizard-card__facts')
      expect(facts).toBeInTheDocument()
    })

    it('should have wizard-card__included class', () => {
      const { container } = render(<WizardCard {...mockWizardProps} />)

      const included = container.querySelector('.wizard-card__included')
      expect(included).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should render as article element', () => {
      const { container } = render(<WizardCard {...mockWizardProps} />)

      const article = container.querySelector('article')
      expect(article).toBeInTheDocument()
    })

    it('should have proper heading hierarchy', () => {
      render(<WizardCard {...mockWizardProps} />)

      const heading = screen.getByRole('heading', { level: 3 })
      expect(heading).toHaveTextContent('Shareholders Agreement')
    })

    it('should have aria-label on stepper', () => {
      render(<WizardCard {...mockWizardProps} quantity={2} />)

      const stepper = screen.getByLabelText('Shareholders Agreement quantity')
      expect(stepper).toBeInTheDocument()
    })

    it('should have accessible button text', () => {
      render(<WizardCard {...mockWizardProps} quantity={0} />)

      const button = screen.getByRole('button', { name: /Select/i })
      expect(button.textContent).toContain('Select')
    })

    it('should have clickable buttons', () => {
      const { container } = render(<WizardCard {...mockWizardProps} quantity={2} />)

      const buttons = container.querySelectorAll('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle quantity of 1 with singular "run"', () => {
      render(<WizardCard {...mockWizardProps} quantity={1} />)

      expect(screen.getByText('1 run')).toBeInTheDocument()
    })

    it('should handle large quantities', () => {
      render(<WizardCard {...mockWizardProps} quantity={99} />)

      expect(screen.getByText('99')).toBeInTheDocument()
      expect(screen.getByText('99 runs')).toBeInTheDocument()
    })

    it('should handle empty title', () => {
      render(<WizardCard {...mockWizardProps} title="" />)

      const heading = screen.queryByRole('heading', { level: 3 })
      expect(heading).toBeInTheDocument()
    })

    it('should handle empty description', () => {
      render(<WizardCard {...mockWizardProps} description="" />)

      const { container } = render(<WizardCard {...mockWizardProps} description="" />)
      const description = container.querySelector('.wizard-card__description')
      expect(description).toBeInTheDocument()
    })

    it('should handle rapid button clicks', async () => {
      const user = userEvent.setup()
      const onIncrement = vi.fn()
      const { container } = render(
        <WizardCard {...mockWizardProps} quantity={2} onIncrement={onIncrement} />
      )

      const plusButton = container.querySelector('.wizard-card__stepper-button--plus')
      await user.click(plusButton!)
      await user.click(plusButton!)
      await user.click(plusButton!)

      expect(onIncrement).toHaveBeenCalledTimes(3)
    })
  })

  describe('Dynamic Content', () => {
    it('should update when props change', () => {
      const { rerender } = render(<WizardCard {...mockWizardProps} title="Original Title" />)

      expect(screen.getByText('Original Title')).toBeInTheDocument()

      rerender(<WizardCard {...mockWizardProps} title="Updated Title" />)

      expect(screen.getByText('Updated Title')).toBeInTheDocument()
      expect(screen.queryByText('Original Title')).not.toBeInTheDocument()
    })

    it('should update quantity display', () => {
      const { rerender } = render(<WizardCard {...mockWizardProps} quantity={1} />)

      expect(screen.getByText('1 run')).toBeInTheDocument()

      rerender(<WizardCard {...mockWizardProps} quantity={5} />)

      expect(screen.getByText('5 runs')).toBeInTheDocument()
    })

    it('should switch between Select button and stepper', () => {
      const { rerender } = render(<WizardCard {...mockWizardProps} quantity={0} />)

      expect(screen.getByRole('button', { name: /Select/i })).toBeInTheDocument()

      rerender(<WizardCard {...mockWizardProps} quantity={1} />)

      expect(screen.queryByRole('button', { name: /Select/i })).not.toBeInTheDocument()
      expect(screen.getByLabelText('Shareholders Agreement quantity')).toBeInTheDocument()
    })
  })

  describe('Icon Rendering', () => {
    it('should render custom icon component', () => {
      const { container } = render(<WizardCard {...mockWizardProps} icon={FileText} />)

      const iconContainer = container.querySelector('.wizard-card__icon')
      const svg = iconContainer?.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass('lucide-file-text')
    })

    it('should render icon with proper size', () => {
      const { container } = render(<WizardCard {...mockWizardProps} />)

      const iconContainer = container.querySelector('.wizard-card__icon')
      const svg = iconContainer?.querySelector('svg')
      expect(svg).toHaveAttribute('width', '27')
      expect(svg).toHaveAttribute('height', '27')
    })
  })
})

// Made with Bob
