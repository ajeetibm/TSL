export interface ServiceItem {
  title: string
  description: string
  icon: 'file' | 'users' | 'book' | 'bulb' | 'shield' | 'scale'
}

export interface PricingPlan {
  name: string
  price: string
  period: string
  description: string
  highlight?: boolean
  features: string[]
  tagline?: string
}

export interface PricingFeature {
  name: string
  launchpad: boolean | string
  operator: boolean | string
  boardroom: boolean | string
  exclusive?: boolean
}

export interface PricingCategory {
  title: string
  features: PricingFeature[]
}
