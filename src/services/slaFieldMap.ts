import type { PartyBlock, SlaWizardData } from '../hooks/useSlaWizard'

type SlaParty = {
  entity_type: string
  legal_name: string | null
  registration_number: string | null
  trading_name: string | null
  full_names: string | null
  id_number: string | null
  email: string
  phone: string | null
  signatory_name: string | null
  signatory_capacity: string | null
}

/** Canonical PDF field-key payload for the Service Level Agreement Blueprint. */
export interface SlaFieldMap {
  customer: SlaParty
  provider: SlaParty
  service_description: string
  start_date: string
  term_type: string
  end_date: string | null
  modules: string[]
  uptime_target: number | null
  uptime_period: string | null
  uptime_exclusions: string[]
  support_hours: string | null
  support_hours_custom: string | null
  support_channels: string[]
  support_channel_other: string | null
  use_severity_model: boolean
  severity_targets: Array<{ severity: string; description: string; response_target: string; resolution_target: string }>
  incident_narrative: string | null
  escalation_contacts: Array<{ name: string; role: string; email: string; telephone: string }>
  maintenance_window: string | null
  maintenance_notice_hours: number | null
  emergency_maintenance: boolean
  backup_frequency: string | null
  rto_hours: number | null
  rpo_hours: number | null
  backup_retention_days: number | null
  security_commitments: string[]
  breach_notice_hours: number | null
  credit_tiers: Array<{ uptime_below: number | null; credit_pct: number | null }>
  credit_cap_pct: number | null
  credit_claim_days: number | null
  credits_sole_remedy: boolean
  governing_law: string
  dispute_forum: string
  jurisdiction_city: string | null
  signatories: Array<{ name: string; title: string }>
}

const textOrNull = (value: string) => value.trim() || null
const numberOrNull = (value: string) => {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}

function mapParty(party: PartyBlock): SlaParty {
  return {
    entity_type: party.entityType,
    legal_name: textOrNull(party.legalName),
    registration_number: textOrNull(party.regNumber),
    trading_name: textOrNull(party.tradingName),
    full_names: textOrNull(party.fullNames),
    id_number: textOrNull(party.idNumber),
    email: party.email.trim(),
    phone: textOrNull(party.phone),
    signatory_name: textOrNull(party.signatoryName),
    signatory_capacity: textOrNull(party.signatoryCapacity),
  }
}

const includes = (data: SlaWizardData, module: string) => data.modules.includes(module)

export function mapSlaFields(data: SlaWizardData): SlaFieldMap {
  const availability = includes(data, 'Availability')
  const support = includes(data, 'Support')
  const incidentResponse = includes(data, 'Incident response')
  const maintenance = includes(data, 'Maintenance')
  const backups = includes(data, 'Backups and restore')
  const security = includes(data, 'Security')
  const credits = includes(data, 'Service credits')

  return {
    customer: mapParty(data.customer), provider: mapParty(data.provider),
    service_description: data.serviceDescription.trim(), start_date: data.startDate,
    term_type: data.termType, end_date: data.termType === 'Fixed end date' ? textOrNull(data.endDate) : null,
    modules: [...data.modules],
    uptime_target: availability ? numberOrNull(data.uptimeTarget) : null,
    uptime_period: availability ? data.uptimePeriod || null : null,
    uptime_exclusions: availability ? [...data.uptimeExclusions] : [],
    support_hours: support ? data.supportHours || null : null,
    support_hours_custom: support && data.supportHours === 'Custom' ? textOrNull(data.supportHoursCustom) : null,
    support_channels: support ? [...data.supportChannels] : [],
    support_channel_other: support && data.supportChannels.includes('Other') ? textOrNull(data.supportChannelOther) : null,
    use_severity_model: data.useSeverityModel,
    severity_targets: incidentResponse && data.useSeverityModel ? data.severityTargets.map((row) => ({ severity: row.severity.trim(), description: row.description.trim(), response_target: row.responseTarget.trim(), resolution_target: row.resolutionTarget.trim() })) : [],
    incident_narrative: incidentResponse && !data.useSeverityModel ? textOrNull(data.incidentNarrative) : null,
    escalation_contacts: incidentResponse ? data.escalationContacts.map((row) => ({ name: row.name.trim(), role: row.role.trim(), email: row.email.trim(), telephone: row.telephone.trim() })) : [],
    maintenance_window: maintenance ? textOrNull(data.maintenanceWindow) : null,
    maintenance_notice_hours: maintenance ? numberOrNull(data.maintenanceNoticeHours) : null,
    emergency_maintenance: data.emergencyMaintenance,
    backup_frequency: backups ? data.backupFrequency || null : null,
    rto_hours: backups ? numberOrNull(data.rtoHours) : null,
    rpo_hours: backups ? numberOrNull(data.rpoHours) : null,
    backup_retention_days: backups ? numberOrNull(data.backupRetentionDays) : null,
    security_commitments: security ? [...data.securityCommitments] : [],
    breach_notice_hours: security ? numberOrNull(data.breachNoticeHours) : null,
    credit_tiers: credits ? data.creditTiers.map((row) => ({ uptime_below: numberOrNull(row.uptimeBelow), credit_pct: numberOrNull(row.creditPct) })) : [],
    credit_cap_pct: credits ? numberOrNull(data.creditCapPct) : null,
    credit_claim_days: credits ? numberOrNull(data.creditClaimDays) : null,
    credits_sole_remedy: data.creditsSoleRemedy,
    governing_law: data.governingLaw.trim(), dispute_forum: data.disputeForum,
    jurisdiction_city: data.disputeForum === 'South African courts' ? textOrNull(data.jurisdictionCity) : null,
    signatories: data.signatories.map((row) => ({ name: row.name.trim(), title: row.title.trim() })),
  }
}
