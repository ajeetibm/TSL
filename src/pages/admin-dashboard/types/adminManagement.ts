/**
 * types/adminManagement.ts
 * All TypeScript types for Admin Management module.
 * Replacing the mock API with a real backend requires NO changes here.
 */

export type AdminStatus = 'Active' | 'Pending'
export type AdminRole   = 'Super Admin' | 'Admin' | 'Sub Admin'
export type ModalMode   = 'edit' | 'view'

export interface AdminRecord {
  id: string
  name: string
  email: string
  role: AdminRole
  status: AdminStatus
  phone: string
  lastActive: string
  invitedDate: string
  /** Derived: 'Revoke' for Active, 'Cancel' for Pending */
  secondaryAction: 'Revoke' | 'Cancel'
}

/** Form state used inside the Edit modal */
export interface AdminEditForm {
  name: string
  email: string
  role: AdminRole
  status: AdminStatus
  phone: string
}

export interface UpdateAdminPayload extends AdminEditForm {
  id: string
}

export interface AdminManagementApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
}
