/**
 * AdminRevokeDialog — Confirmation dialog for revoking access OR cancelling a pending invite.
 * Controlled via the `variant` prop:
 *   "revoke"  → "Revoke Admin Access?" — for Active admins
 *   "cancel"  → "Cancel Invitation?"   — for Pending admins
 *
 * PRODUCTION: the service calls are in adminManagementService.ts — no changes here.
 */
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useState } from 'react'
import type { AdminRecord } from '../types/adminManagement'
import { cancelInvite, revokeAdmin } from '../services/adminManagementService'

interface AdminRevokeDialogProps {
  record:    AdminRecord
  variant:   'revoke' | 'cancel'
  onCancel:  () => void
  onRevoked: (id: string) => void
  onToast:   (msg: string, type: 'success' | 'error') => void
}

export default function AdminRevokeDialog({ record, variant, onCancel, onRevoked, onToast }: AdminRevokeDialogProps) {
  const [loading, setLoading] = useState(false)

  const isCancel = variant === 'cancel'

  const handleConfirm = async () => {
    setLoading(true)
    const response = isCancel
      ? await cancelInvite(record.id)
      : await revokeAdmin(record.id)
    setLoading(false)

    if (!response.success) {
      onToast(response.message ?? (isCancel ? 'Failed to cancel invitation.' : 'Failed to revoke access.'), 'error')
      onCancel()
      return
    }

    onRevoked(record.id)
    onToast(
      response.message ?? (isCancel ? 'Invitation cancelled successfully.' : 'Admin access revoked successfully.'),
      'success',
    )
  }

  return (
    <div className="adm-dialog-overlay" role="alertdialog" aria-modal="true" aria-labelledby="revoke-title" onClick={onCancel}>
      <div className="adm-dialog adm-dialog--revoke" onClick={(e) => e.stopPropagation()}>
        <div className="adm-dialog__icon-wrap">
          <AlertTriangle size={24} />
        </div>
        <h3 id="revoke-title" className="adm-dialog__title">
          {isCancel ? 'Cancel Invitation?' : 'Revoke Admin Access?'}
        </h3>
        <p className="adm-dialog__body">
          {isCancel
            ? <>This will cancel the pending invitation sent to <strong>{record.name}</strong>. They will not be able to accept it.</>
            : <>This action will remove <strong>{record.name}</strong>'s administrator access. They will no longer be able to log in to the admin portal.</>}
        </p>
        <div className="adm-dialog__actions">
          <button type="button" className="adm-dialog__btn adm-dialog__btn--outline" onClick={onCancel} disabled={loading}>
            {isCancel ? 'Keep Invite' : 'Cancel'}
          </button>
          <button
            type="button"
            className={`adm-dialog__btn adm-dialog__btn--danger${loading ? ' adm-dialog__btn--loading' : ''}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading
              ? <><Loader2 size={15} className="adm-spin" /> {isCancel ? 'Cancelling…' : 'Revoking…'}</>
              : isCancel ? 'Cancel Invite' : 'Revoke'}
          </button>
        </div>
      </div>
    </div>
  )
}
