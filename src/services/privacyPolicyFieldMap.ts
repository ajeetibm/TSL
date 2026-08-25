import type { UserProfile } from '../context/UserProfileContext'
import type { PrivacyPolicyWizardData } from '../hooks/usePrivacyPolicyWizard'

/**
 * Canonical Privacy & Cookies Policy data contract from the v2.0 Blueprint
 * specification.  This deliberately contains only published Field keys; UI
 * conveniences such as responsiblePartyConfirmed and automatedDecisions are
 * kept in the wizard state, not emitted as Blueprint fields.
 */
export interface PrivacyPolicyFieldMap {
  company_id: string | null
  info_officer: { full_names: string; id_number: string; email: string }
  privacy_email: string
  domains: string[]
  pi_categories: string[]
  special_pi: string[]
  special_pi_basis: string | null
  children_data: boolean
  children_consent: string | null
  purposes: Array<{ purpose: string; categories: string; basis: string; li_statement: string | null }>
  retention: Array<{ category: string; period: string; reason: string }>
  third_parties: Array<{ name: string; purpose: string; country: string }>
  cross_border: boolean
  cross_border_countries: string[]
  transfer_basis: string | null
  direct_marketing: boolean
  cookies: Array<{ name: string; purpose: string; duration: string; strictly_necessary: boolean }>
  cookie_consent: string
  analytics_provider: string | null
  dsr_channel: string
  dsr_days: number | null
  security_summary: string[]
  effective_date: string
}

const textOrNull = (value: string) => value.trim() || null
const nonEmpty = (values: string[]) => values.map((value) => value.trim()).filter(Boolean)

export function mapPrivacyPolicyFields(
  data: PrivacyPolicyWizardData,
  profile: UserProfile,
): PrivacyPolicyFieldMap {
  const dsrDays = Number(data.dsrDays)

  return {
    company_id: textOrNull(profile.companySnapshotId),
    info_officer: {
      full_names: data.officerFullNames.trim(),
      id_number: data.officerIdNumber.trim(),
      email: data.officerEmail.trim(),
    },
    privacy_email: data.privacyEmail.trim(),
    domains: nonEmpty(data.domains),
    pi_categories: [...data.piCategories],
    special_pi: [...data.specialPi],
    special_pi_basis: data.specialPi.length ? textOrNull(data.specialPiBasis) : null,
    children_data: data.childrenData,
    children_consent: data.childrenData ? textOrNull(data.childrenConsent) : null,
    purposes: data.purposes.map((row) => ({
      purpose: row.purpose.trim(),
      categories: row.categories.trim(),
      basis: row.basis,
      li_statement: row.basis === 'Legitimate interest' ? textOrNull(row.liStatement) : null,
    })),
    retention: data.retention.map((row) => ({
      category: row.category.trim(),
      period: row.period.trim(),
      reason: row.reason.trim(),
    })),
    third_parties: data.thirdParties.map((row) => ({
      name: row.name.trim(),
      purpose: row.purpose.trim(),
      country: row.country.trim(),
    })),
    cross_border: data.crossBorder,
    cross_border_countries: data.crossBorder ? nonEmpty(data.crossBorderCountries) : [],
    transfer_basis: data.crossBorder ? textOrNull(data.transferBasis) : null,
    direct_marketing: data.directMarketing,
    cookies: data.cookies.map((row) => ({
      name: row.name.trim(),
      purpose: row.purpose.trim(),
      duration: row.duration.trim(),
      strictly_necessary: row.necessary === 'Yes',
    })),
    cookie_consent: data.cookieConsent,
    analytics_provider: textOrNull(data.analyticsProvider),
    dsr_channel: data.dsrChannel.trim(),
    dsr_days: Number.isFinite(dsrDays) && dsrDays > 0 ? dsrDays : null,
    security_summary: [...data.securitySummary],
    effective_date: data.effectiveDate,
  }
}
