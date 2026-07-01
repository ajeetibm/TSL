import { createContext, useContext, useState, type ReactNode } from 'react'

type NotificationContextValue = {
  unreadCount: number | null
  /** Used by the Notifications page — always overwrites with the live count. */
  setUnreadCount: (count: number) => void
  /** Used by DashboardShell — writes only if no live count has been set yet. */
  seedUnreadCount: (count: number) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCountState] = useState<number | null>(null)

  function setUnreadCount(count: number) {
    setUnreadCountState(count > 0 ? count : 0)
  }

  function seedUnreadCount(count: number) {
    // Only write if the notifications page hasn't already set a live value.
    setUnreadCountState((prev) => (prev !== null ? prev : count > 0 ? count : 0))
  }

  return (
    <NotificationContext.Provider value={{ unreadCount, setUnreadCount, seedUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotificationCount() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotificationCount must be used within NotificationProvider')
  return ctx
}
