import { ShoppingCart } from 'lucide-react'
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
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path fill="none" d="M2.66894 9.33377C2.54278 9.3342 2.41909 9.29882 2.31224 9.23175C2.20539 9.16468 2.11976 9.06867 2.06531 8.95487C2.01085 8.84107 1.9898 8.71416 2.00461 8.58887C2.01941 8.46359 2.06946 8.34507 2.14894 8.2471L8.74894 1.4471C8.79845 1.38996 8.86591 1.35134 8.94026 1.33759C9.01461 1.32384 9.09142 1.33578 9.15809 1.37144C9.22476 1.4071 9.27733 1.46437 9.30716 1.53384C9.337 1.60331 9.34233 1.68087 9.32227 1.75377L8.04227 5.7671C8.00453 5.86812 7.99185 5.97678 8.00533 6.08377C8.01881 6.19076 8.05805 6.29289 8.11967 6.38139C8.18129 6.46988 8.26346 6.54211 8.35912 6.59187C8.45479 6.64164 8.5611 6.66745 8.66894 6.6671H13.3356C13.4618 6.66667 13.5855 6.70205 13.6923 6.76912C13.7992 6.83619 13.8848 6.9322 13.9392 7.046C13.9937 7.1598 14.0147 7.28671 13.9999 7.412C13.9851 7.53728 13.9351 7.6558 13.8556 7.75377L7.25561 14.5538C7.2061 14.6109 7.13863 14.6495 7.06429 14.6633C6.98994 14.677 6.91312 14.6651 6.84645 14.6294C6.77978 14.5938 6.72722 14.5365 6.69738 14.467C6.66755 14.3976 6.66222 14.32 6.68227 14.2471L7.96227 10.2338C8.00002 10.1328 8.01269 10.0241 7.99921 9.9171C7.98573 9.81011 7.9465 9.70798 7.88488 9.61948C7.82326 9.53099 7.74109 9.45876 7.64542 9.40899C7.54976 9.35923 7.44344 9.33342 7.33561 9.33377H2.66894Z" stroke="#C79A3B" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Popular workflows marked
        </span>
      </div>
    </div>
  )
}
