import { ChevronRight } from 'lucide-react'
import { createPortal } from 'react-dom'
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
      // Authenticated users go straight to dashboard wizard details —
      // "Back to Wizards" should take them to the dashboard blueprints page.
      navigate('/dashboard/wizard-details', {
        state: { selectedWizards },
      })
      return
    }

    localStorage.setItem('tsl-selected-dashboard-wizards', JSON.stringify(selectedWizards))
    // The authenticated experience continues in the dashboard. Clear the
    // legacy return flag so a previous guest session cannot send the user
    // back to the public catalogue after signing in.
    localStorage.removeItem('tsl-from-catalogue')
    window.dispatchEvent(new CustomEvent('tsl-open-auth-modal', { detail: { mode: 'signup', redirectTo: '/dashboard/wizard-details' } }))
  }

  return createPortal(
    <div className="wizard-cart-bar">
      <div className="wizard-cart-bar__content">
        <div className="wizard-cart-bar__summary">
          <strong>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ flexShrink: 0 }}>
              <g clipPath="url(#clip0_308_16121)">
                <path d="M6 16.5C6.41421 16.5 6.75 16.1642 6.75 15.75C6.75 15.3358 6.41421 15 6 15C5.58579 15 5.25 15.3358 5.25 15.75C5.25 16.1642 5.58579 16.5 6 16.5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14.25 16.5C14.6642 16.5 15 16.1642 15 15.75C15 15.3358 14.6642 15 14.25 15C13.8358 15 13.5 15.3358 13.5 15.75C13.5 16.1642 13.8358 16.5 14.25 16.5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1.53906 1.53711H3.03906L5.03406 10.8521C5.10725 11.1933 5.29707 11.4982 5.57085 11.7145C5.84463 11.9308 6.18524 12.0449 6.53406 12.0371H13.8691C14.2104 12.0366 14.5414 11.9196 14.8073 11.7055C15.0732 11.4914 15.2582 11.193 15.3316 10.8596L16.5691 5.28711H3.84156" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
              <defs>
                <clipPath id="clip0_308_16121">
                  <rect width="18" height="18" fill="white"/>
                </clipPath>
              </defs>
            </svg>
            Your Cart ({totalItems} items):
          </strong>
          <div className="wizard-cart-bar__chips">
            {selectedWizards.map((wizard) => (
              <span key={wizard.title}>
                {wizard.title}
                <b>×{wizard.quantity}</b>
              </span>
            ))}
          </div>
        </div>

        <div className="wizard-cart-bar__actions">
          <button className="wizard-cart-bar__clear" onClick={onClear}>
            Clear Cart
          </button>
          <button className="wizard-cart-bar__details" onClick={handleViewDetails}>
            Get Start &amp; View Details
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
