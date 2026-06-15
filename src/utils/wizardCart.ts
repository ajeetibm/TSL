const WIZARD_CART_STORAGE_KEY = 'tsl-selected-wizards'

export type WizardQuantities = Record<string, number>

export function loadWizardQuantities(): WizardQuantities {
  if (typeof window === 'undefined') return {}

  try {
    const storedCart = window.localStorage.getItem(WIZARD_CART_STORAGE_KEY)
    if (!storedCart) return {}

    const parsedCart = JSON.parse(storedCart) as WizardQuantities

    return Object.entries(parsedCart).reduce<WizardQuantities>((cart, [title, quantity]) => {
      if (typeof title === 'string' && Number.isFinite(quantity) && quantity > 0) {
        cart[title] = Math.floor(quantity)
      }

      return cart
    }, {})
  } catch {
    return {}
  }
}

export function saveWizardQuantities(quantities: WizardQuantities) {
  if (typeof window === 'undefined') return

  const selectedQuantities = Object.entries(quantities).reduce<WizardQuantities>((cart, [title, quantity]) => {
    if (quantity > 0) {
      cart[title] = quantity
    }

    return cart
  }, {})

  window.localStorage.setItem(WIZARD_CART_STORAGE_KEY, JSON.stringify(selectedQuantities))
}
