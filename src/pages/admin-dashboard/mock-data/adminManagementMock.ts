/**
 * mock-data/adminManagementMock.ts
 * In-memory store for Admin Management records.
 * PRODUCTION: replace this entire module with real API calls in adminManagementService.ts.
 * The service layer is the only file that needs to change.
 */

import type { AdminRecord, UpdateAdminPayload } from '../types/adminManagement'

// ── Seed data ─────────────────────────────────────────────────────────────
let _admins: AdminRecord[] = [
  {
    id: 'adm_001',
    name: 'John Smith',
    email: 'john.smith@admin.com',
    role: 'Admin',
    status: 'Active',
    phone: '+27 82 123 4567',
    lastActive: '2 hours ago',
    invitedDate: 'Dec 15, 2024',
    secondaryAction: 'Revoke',
  },
  {
    id: 'adm_002',
    name: 'Emily Davis',
    email: 'emily.davis@admin.com',
    role: 'Sub Admin',
    status: 'Pending',
    phone: '',
    lastActive: 'Not yet active',
    invitedDate: 'Jan 3, 2025',
    secondaryAction: 'Cancel',
  },
  {
    id: 'adm_003',
    name: 'Michael Chen',
    email: 'michael.chen@admin.com',
    role: 'Admin',
    status: 'Active',
    phone: '+27 71 987 6543',
    lastActive: '5 minutes ago',
    invitedDate: 'Nov 20, 2024',
    secondaryAction: 'Revoke',
  },
  {
    id: 'adm_004',
    name: 'Sarah Johnson',
    email: 'sarah.j@admin.com',
    role: 'Sub Admin',
    status: 'Pending',
    phone: '',
    lastActive: 'Not yet active',
    invitedDate: 'Jan 5, 2025',
    secondaryAction: 'Cancel',
  },
]

// ── Mock "database" operations ────────────────────────────────────────────

export function mockGetAdmins(): AdminRecord[] {
  return [..._admins]
}

export function mockUpdateAdmin(payload: UpdateAdminPayload): AdminRecord {
  const idx = _admins.findIndex((a) => a.id === payload.id)
  if (idx === -1) throw new Error('Admin not found')

  const updated: AdminRecord = {
    ..._admins[idx],
    name:   payload.name,
    email:  payload.email,
    role:   payload.role,
    status: payload.status,
    phone:  payload.phone,
    secondaryAction: payload.status === 'Active' ? 'Revoke' : 'Cancel',
  }
  _admins = _admins.map((a, i) => (i === idx ? updated : a))
  return updated
}

export function mockRevokeAdmin(id: string): void {
  _admins = _admins.filter((a) => a.id !== id)
}
