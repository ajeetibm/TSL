/**
 * services/adminManagementService.ts
 * API service layer for Admin Management.
 *
 * PRODUCTION: replace each mock* call below with the real adminApi.* call.
 * No other files need to change.
 *
 *   getAdmins()    → GET    /api/v1/admin/admins
 *   inviteAdmin()  → POST   /api/v1/admin/admins/invite
 *   updateAdmin()  → PUT    /api/v1/admin/admins/:id
 *   revokeAdmin()  → DELETE /api/v1/admin/admins/:id
 */

import { adminApi } from '../../../services/tslApi'
import type { AdminManagementApiResponse, AdminRecord, UpdateAdminPayload } from '../types/adminManagement'
import { mockGetAdmins, mockRevokeAdmin, mockUpdateAdmin } from '../mock-data/adminManagementMock'

export interface InviteAdminPayload {
  fullName: string
  email: string
  message?: string
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function randomDelay(min = 800, max = 1200): Promise<void> {
  return delay(min + Math.random() * (max - min))
}

export async function getAdmins(): Promise<AdminManagementApiResponse<AdminRecord[]>> {
  await delay(300)
  // PRODUCTION: return adminApi.getAdmins()
  return { success: true, data: mockGetAdmins() }
}

export async function updateAdmin(payload: UpdateAdminPayload): Promise<AdminManagementApiResponse<AdminRecord>> {
  await randomDelay()
  try {
    // PRODUCTION: return adminApi.updateAdmin(payload.id, payload)
    const updated = mockUpdateAdmin(payload)
    return { success: true, message: 'Admin updated successfully.', data: updated }
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Update failed.' }
  }
}

export async function revokeAdmin(id: string): Promise<AdminManagementApiResponse<void>> {
  await randomDelay()
  try {
    // PRODUCTION: return adminApi.revokeAdmin(id)
    mockRevokeAdmin(id)
    return { success: true, message: 'Admin access revoked successfully.' }
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Revoke failed.' }
  }
}

export async function inviteAdmin(payload: InviteAdminPayload): Promise<AdminManagementApiResponse<{ email: string; invitedAt: string }>> {
  try {
    const res = await adminApi.inviteAdmin({ fullName: payload.fullName, email: payload.email, message: payload.message ?? '' })
    if (!res.success) return { success: false, message: res.message ?? 'Failed to send invitation.' }
    return { success: true, message: res.message ?? 'Invitation sent successfully.', data: res.data as { email: string; invitedAt: string } }
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Failed to send invitation.' }
  }
}

export async function cancelInvite(id: string): Promise<AdminManagementApiResponse<void>> {
  await randomDelay()
  try {
    // PRODUCTION: return adminApi.cancelInvite(id)
    mockRevokeAdmin(id) // same removal operation — removes the pending record
    return { success: true, message: 'Invitation cancelled successfully.' }
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Cancel failed.' }
  }
}
