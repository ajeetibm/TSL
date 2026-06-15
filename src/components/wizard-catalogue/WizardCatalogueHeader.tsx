import { ShoppingCart, Star } from 'lucide-react'
import './WizardCatalogueHeader.css'

interface WizardCatalogueHeaderProps {
  totalItems: number
  selectedWizardCount: number
}

export function WizardCatalogueHeader({ totalItems, selectedWizardCount }: WizardCatalogueHeaderProps) {
  return (
    <div className="wizard-catalogue-header">
      <div>
        <h2 className="wizard-catalogue-header__title">Available Wizards</h2>
        <p className="wizard-catalogue-header__copy">
          Add workflows to your cart—you can add the same wizard multiple times
        </p>
      </div>

      <div className="wizard-catalogue-header__meta">
        {totalItems > 0 && (
          <span className="wizard-catalogue-header__cart">
            <ShoppingCart size={16} />
            {totalItems} items ({selectedWizardCount} wizards)
          </span>
        )}
        <span className="wizard-catalogue-header__popular">
          <Star size={16} />
          Popular workflows marked
        </span>
      </div>
    </div>
  )
}
