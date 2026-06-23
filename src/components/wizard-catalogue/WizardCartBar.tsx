import { ChevronRight, ShoppingCart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './WizardCartBar.css'

interface SelectedWizard {
  title: string
  quantity: number
}

interface WizardCartBarProps {
  selectedWizards: SelectedWizard[]
  totalItems: number
  onClear: () => void
}

export function WizardCartBar({ selectedWizards, totalItems, onClear }: WizardCartBarProps) {
  const navigate = useNavigate()

  if (totalItems === 0) return null

  const handleViewDetails = () => {
    if (localStorage.getItem('tsl-authenticated') === 'true') {
      navigate('/wizard-details')
      return
    }

    window.dispatchEvent(new CustomEvent('tsl-open-auth-modal', { detail: { mode: 'signup', redirectTo: '/wizard-details' } }))
  }

  return (
    <div className="wizard-cart-bar">
      <div className="wizard-cart-bar__content">
        <div className="wizard-cart-bar__summary">
          <strong>Your Cart ({totalItems} items):</strong>
          <div className="wizard-cart-bar__chips">
            {selectedWizards.map((wizard) => (
              <span key={wizard.title}>
                {wizard.title}
                <b>{wizard.quantity}</b>
              </span>
            ))}
          </div>
        </div>

        <div className="wizard-cart-bar__actions">
          <button className="wizard-cart-bar__clear" onClick={onClear}>
            Clear Cart
          </button>
          <button className="wizard-cart-bar__details" onClick={handleViewDetails}>
            <ShoppingCart size={16} />
            View Details
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
