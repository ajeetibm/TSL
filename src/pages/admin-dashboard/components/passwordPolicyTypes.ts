/* Shared types and defaults for the Password Policy feature */

export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumber: boolean
  requireSpecial: boolean
  expiration: 'Never' | '30' | '60' | '90' | '180'
  preventReuse: '3' | '5' | '10'
  lockoutAttempts: number
  lockoutDuration: number
}

export const DEFAULT_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false,
  expiration: 'Never',
  preventReuse: '3',
  lockoutAttempts: 5,
  lockoutDuration: 15,
}
