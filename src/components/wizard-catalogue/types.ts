import type { LucideIcon } from 'lucide-react'

export interface WizardItem {
  title: string
  description: string
  time: string
  audience: string
  included: string[]
  icon: LucideIcon
  popular: boolean
  detailNote?: string
}
