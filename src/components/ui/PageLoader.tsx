import './PageLoader.css'

interface PageLoaderProps {
  message?: string
}

export function PageLoader({ message = 'Loading…' }: PageLoaderProps) {
  return (
    <div className="page-loader" role="status" aria-live="polite" aria-label={message}>
      <div className="page-loader__spinner" aria-hidden="true" />
      <p className="page-loader__message">{message}</p>
    </div>
  )
}
