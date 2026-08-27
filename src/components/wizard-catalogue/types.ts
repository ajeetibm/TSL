import type React from 'react'
import type { LucideIcon } from 'lucide-react'

export interface WizardItem {
  title: string
  description: string
  time: string
  credits: string
  audience: string
  included: string[]
  icon: LucideIcon
  svgIcon?: React.ReactNode
  popular: boolean
  detailNote?: string
}
