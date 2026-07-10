/**
 * AdminEditModal — Edit / View modal for an AdminRecord.
 *
 * mode="edit" — all fields editable; Save + Cancel buttons;
 *               dirty-check shows a discard confirmation before closing.
 * mode="view" — all fields read-only; only Close button shown.
 *
 * PRODUCTION: swap the updateAdmin() service call for the real API — no JSX changes needed.
 */
import { Loader2, Lock, Mail, Phone, Shield, User, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { AdminEditForm, AdminRecord, ModalMode } from '../types/adminManagement'
import type { UpdateAdminPayload } from '../types/adminManagement'
import { updateAdmin } from '../services/adminManagementService'

// ── helpers ────────────────────────────────────────────────────────────────

function toForm(record: AdminRecord): AdminEditForm {
  return {
    name:   record.name,
    email:  record.email,
    role:   record.role,
    status: record.status,
    phone:  record.phone,
  }
}

function isFormEqual(a: AdminEditForm, b: AdminEditForm): boolean {
  return (
    a.name   === b.name   &&
    a.email  === b.email  &&
    a.role   === b.role   &&
    a.status === b.status &&
    a.phone  === b.phone
  )
}

function validate(form: AdminEditForm): Partial<Record<keyof AdminEditForm, string>> {
  const errors: Partial<Record<keyof AdminEditForm, string>> = {}
  if (!form.name.trim())  errors.name  = 'Name is required.'
  if (!form.email.trim()) errors.email = 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email address.'
  return errors
}

// ── Discard confirmation ───────────────────────────────────────────────────

interface DiscardDialogProps {
  onContinue: () => void
  onDiscard:  () => void
}

function DiscardDialog({ onContinue, onDiscard }: DiscardDialogProps) {
  return (
    <div className="adm-dialog-overlay" role="alertdialog" aria-modal="true" aria-labelledby="discard-title">
      <div className="adm-dialog">
        <h3 id="discard-title" className="adm-dialog__title">Discard changes?</h3>
        <p className="adm-dialog__body">You have unsaved changes. Are you sure you want to discard them?</p>
        <div className="adm-dialog__actions">
          <button type="button" className="adm-dialog__btn adm-dialog__btn--outline" onClick={onContinue}>
            Continue Editing
          </button>
          <button type="button" className="adm-dialog__btn adm-dialog__btn--danger" onClick={onDiscard}>
            Discard
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main modal ─────────────────────────────────────────────────────────────

interface AdminEditModalProps {
  record:  AdminRecord
  mode:    ModalMode
  onClose: () => void
  onSaved: (updated: AdminRecord) => void
  onToast: (msg: string, type: 'success' | 'error') => void
}

export default function AdminEditModal({ record, mode, onClose, onSaved, onToast }: AdminEditModalProps) {
  const baseline  = useRef<AdminEditForm>(toForm(record))
  const [form, setForm]     = useState<AdminEditForm>(toForm(record))
  const [errors, setErrors] = useState<Partial<Record<keyof AdminEditForm, string>>>({})
  const [saving, setSaving] = useState(false)
  const [showDiscard, setShowDiscard] = useState(false)

  const isDirty = !isFormEqual(form, baseline.current)

  const handleCancel = () => {
    if (isDirty) {
      setShowDiscard(true)
    } else {
      onClose()
    }
  }

  const set = (field: keyof AdminEditForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  // Close on Escape — depends on handleCancel, so declared after it
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancel()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty])

  const handleSave = async () => {
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setSaving(true)
    const payload: UpdateAdminPayload = { id: record.id, ...form }
    const response = await updateAdmin(payload)
    setSaving(false)

    if (!response.success || !response.data) {
      onToast(response.message ?? 'Failed to update admin.', 'error')
      return
    }

    onSaved(response.data)
    onToast(response.message ?? 'Admin updated successfully.', 'success')
    onClose()
  }

  const isView = mode === 'view'

  return (
    <>
      <div className="adm-modal-overlay" onClick={isView ? onClose : handleCancel}>
        <div className="adm-modal" role="dialog" aria-modal="true" aria-labelledby="adm-modal-title" onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <header className="adm-modal__header">
            <div>
              <h2 id="adm-modal-title" className="adm-modal__title">
                {isView ? 'Admin Details' : 'Edit Admin'}
              </h2>
              <p className="adm-modal__subtitle">{record.email}</p>
            </div>
            <button type="button" className="adm-modal__close" onClick={handleCancel} aria-label="Close">
              <X size={20} />
            </button>
          </header>

          {/* Body */}
          <div className="adm-modal__body">
            {/* Name */}
            <div className="adm-modal__field">
              <label className="adm-modal__label" htmlFor="adm-name">
                <span className="adm-modal__label-icon"><User size={15} /></span>
                Full Name
              </label>
              <input
                id="adm-name"
                type="text"
                className={`adm-modal__input${errors.name ? ' adm-modal__input--error' : ''}`}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                readOnly={isView}
                disabled={saving}
              />
              {errors.name && <p className="adm-modal__error">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="adm-modal__field">
              <label className="adm-modal__label" htmlFor="adm-email">
                <span className="adm-modal__label-icon"><Mail size={15} /></span>
                Email Address
              </label>
              <input
                id="adm-email"
                type="email"
                className={`adm-modal__input${errors.email ? ' adm-modal__input--error' : ''}`}
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                readOnly={isView}
                disabled={saving}
              />
              {errors.email && <p className="adm-modal__error">{errors.email}</p>}
            </div>

            {/* Role + Status row */}
            <div className="adm-modal__row">
              <div className="adm-modal__field">
                <label className="adm-modal__label" htmlFor="adm-role">
                  <span className="adm-modal__label-icon"><Shield size={15} /></span>
                  Role
                </label>
                {isView ? (
                  <input id="adm-role" type="text" className="adm-modal__input" value={form.role} readOnly />
                ) : (
                  <select
                    id="adm-role"
                    className="adm-modal__select"
                    value={form.role}
                    onChange={(e) => set('role', e.target.value as AdminEditForm['role'])}
                    disabled={saving}
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Admin">Admin</option>
                    <option value="Sub Admin">Sub Admin</option>
                  </select>
                )}
              </div>

              <div className="adm-modal__field">
                <label className="adm-modal__label" htmlFor="adm-status">
                  <span className="adm-modal__label-icon"><Lock size={15} /></span>
                  Status
                </label>
                {isView ? (
                  <input id="adm-status" type="text" className="adm-modal__input" value={form.status} readOnly />
                ) : (
                  <select
                    id="adm-status"
                    className="adm-modal__select"
                    value={form.status}
                    onChange={(e) => set('status', e.target.value as AdminEditForm['status'])}
                    disabled={saving}
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                  </select>
                )}
              </div>
            </div>

            {/* Phone */}
            <div className="adm-modal__field">
              <label className="adm-modal__label" htmlFor="adm-phone">
                <span className="adm-modal__label-icon"><Phone size={15} /></span>
                Phone Number
              </label>
              <input
                id="adm-phone"
                type="tel"
                className="adm-modal__input"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder={isView ? '—' : '+27 82 000 0000'}
                readOnly={isView}
                disabled={saving}
              />
            </div>

            {/* Meta info */}
            <div className="adm-modal__meta">
              <div className="adm-modal__meta-item">
                <span>Invited</span>
                <strong>{record.invitedDate}</strong>
              </div>
              <div className="adm-modal__meta-item">
                <span>Last Active</span>
                <strong>{record.lastActive}</strong>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="adm-modal__footer">
            {isView ? (
              <button type="button" className="adm-modal__btn adm-modal__btn--outline" onClick={onClose}>
                Close
              </button>
            ) : (
              <>
                <button type="button" className="adm-modal__btn adm-modal__btn--outline" onClick={handleCancel} disabled={saving}>
                  Cancel
                </button>
                <button
                  type="button"
                  className={`adm-modal__btn adm-modal__btn--primary${saving ? ' adm-modal__btn--loading' : ''}`}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving
                    ? <><Loader2 size={16} className="adm-spin" /> Saving…</>
                    : 'Save'}
                </button>
              </>
            )}
          </footer>
        </div>
      </div>

      {showDiscard && (
        <DiscardDialog
          onContinue={() => setShowDiscard(false)}
          onDiscard={() => { setShowDiscard(false); onClose() }}
        />
      )}
    </>
  )
}
