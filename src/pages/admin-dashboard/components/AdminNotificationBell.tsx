import { Bell, CheckCheck, Shield, UserPlus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { adminApi } from '../../../services/tslApi'
import './AdminNotificationBell.css'

type AdminNotification = {
  notificationId: string
  type: string
  subject: string
  message: string
  read: boolean
  createdAt: string
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMins = Math.floor((now.getTime() - d.getTime()) / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
}

function NotifIcon({ type }: { type: string }) {
  if (type === 'new_user') {
    return <span className="abn__icon abn__icon--user"><UserPlus size={16} /></span>
  }
  return <span className="abn__icon abn__icon--login"><Shield size={16} /></span>
}

export function AdminNotificationBell() {
  const [open, setOpen]   = useState(false)
  const [items, setItems] = useState<AdminNotification[]>([])
  const wrapperRef        = useRef<HTMLDivElement>(null)

  const unreadCount = items.filter(n => !n.read).length

  useEffect(() => {
    let active = true
    async function refresh() {
      const response = await adminApi.notifications()
      if (!active || !response.success) return
      const data = response.data as { notifications?: AdminNotification[] } | undefined
      setItems(Array.isArray(data?.notifications) ? data.notifications : [])
    }
    void refresh()
    const interval = window.setInterval(() => void refresh(), 10000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const dismiss = async (id: string) => {
    const response = await adminApi.markNotificationRead(id)
    if (response.success) setItems(current => current.map(n => n.notificationId === id ? { ...n, read: true } : n))
  }

  const markAllRead = async () => {
    const response = await adminApi.markAllNotificationsRead()
    if (response.success) setItems(current => current.map(n => ({ ...n, read: true })))
  }

  return (
    <div className="abn" ref={wrapperRef}>
      {/* Bell trigger */}
      <button
        type="button"
        className={`abn__trigger${open ? ' abn__trigger--active' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="abn__badge">{unreadCount}</span>
        )}
      </button>

      {/* Popup panel */}
      {open && (
        <div className="abn__panel" role="dialog" aria-label="Notifications">
          <div className="abn__panel-header">
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <button type="button" className="abn__mark-all" onClick={markAllRead}>
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="abn__filter-row">
            <span className="abn__filter-chip abn__filter-chip--active">All</span>
            {unreadCount > 0 && (
              <span className="abn__unread-label">Unread ({unreadCount})</span>
            )}
          </div>

          <ul className="abn__list">
            {items.length === 0 ? (
              <li className="abn__empty">No notifications yet. New user registrations will appear here.</li>
            ) : (
              items.map((n) => (
                <li key={n.notificationId} className={`abn__item${n.read ? '' : ' abn__item--unread'}`}>
                  <NotifIcon type={n.type} />
                  <div className="abn__item-body">
                    <div className="abn__item-title">
                      {n.subject}
                      {!n.read && <span className="abn__dot" />}
                    </div>
                    <div className="abn__item-msg">{n.message}</div>
                    <div className="abn__item-time">{fmtTime(n.createdAt)}</div>
                  </div>
                  {!n.read && (
                    <button
                      type="button"
                      className="abn__dismiss"
                      onClick={() => dismiss(n.notificationId)}
                      aria-label="Dismiss"
                    >
                      <X size={13} />
                    </button>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
