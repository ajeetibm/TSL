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
}
