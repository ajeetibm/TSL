import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface BackButtonProps {
  /** Path to navigate to. Defaults to -1 (browser back). */
  to?: string
  /** Override click behaviour entirely (e.g. for in-page SPA navigation). */
  onClick?: () => void
  /** Accessible label for the button. */
  label?: string
  className?: string
}

/**
 * Circular back-navigation button rendered at the top-left of a dashboard
 * page header — matches the gold-bordered chevron shown in the sidebar/content
 * boundary in the design.
 */
export function BackButton({ to, onClick, label = 'Go back', className = '' }: BackButtonProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (to) {
      navigate(to)
    } else {
      navigate(-1)
    }
  }

  return (
    <button
      type="button"
      className={`dashboard-back-btn${className ? ` ${className}` : ''}`}
      onClick={handleClick}
      aria-label={label}
    >
      <ChevronLeft size={16} strokeWidth={2.5} />
    </button>
  )
}
