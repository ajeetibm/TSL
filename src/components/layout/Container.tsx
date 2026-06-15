import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'
import './Container.css'

interface ContainerProps {
  children: ReactNode
  className?: string
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn('layout-container', className)}>
      {children}
    </div>
  )
}
