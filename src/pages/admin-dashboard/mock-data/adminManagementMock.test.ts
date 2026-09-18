import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AdminRecord } from '../types/adminManagement'

const STORAGE_KEY = 'tsl-admin-management-records-v1'

const invitedAdmin: AdminRecord = {
  id: 'invite-persistence-test',
  name: 'Persistent Admin',
  email: 'persistent.admin@thestartuplegal.co.za',
  role: 'Sub Admin',
  status: 'Pending',
  phone: '',
  lastActive: '—',
  invitedDate: 'Sep 18, 2026',
  secondaryAction: 'Cancel',
}

describe('adminManagementMock', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY)
    vi.resetModules()
  })

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY)
    vi.resetModules()
  })

  it('retains an invited sub-admin after the mock module reloads', async () => {
    const store = await import('./adminManagementMock')
    store.mockAddAdmin(invitedAdmin)

    vi.resetModules()
    const reloadedStore = await import('./adminManagementMock')

    expect(reloadedStore.mockGetAdmins()).toContainEqual(invitedAdmin)
  })
})
