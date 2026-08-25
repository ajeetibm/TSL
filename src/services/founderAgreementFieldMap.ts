import type { UserProfile } from '../context/UserProfileContext'
import type { FounderAgreementWizardData } from '../hooks/useFounderAgreementWizard'

/**
 * The stable field-key contract for Blueprint 11.4. UI state deliberately uses
 * readable camelCase names; this adapter is the only boundary to persistence,
 * review, and template services.
 */
export interface FounderAgreementFieldMap {
  is_incorporated: boolean
  company_id: string | null
  intended_name: string | null
  target_incorporation: string | null
  founders: Array<{
    full_names: string
    id_number: string
    role: string
    equity_pct: string
    commitment: string
    capital: string | null
  }>
  vesting: boolean
  vesting_months: string | null
  cliff_months: string | null
  vesting_frequency: string | null
  acceleration: string | null
  good_leaver: string[]
  bad_leaver_effect: string | null
  decision_model: string
  reserved_matters: string[]
  debt_threshold: string | null
  removal_process: string
  departure_role: string
  ip_assignment: true
  ip_pre_incorporation: boolean
  prior_ip: Array<{
    founder: string
    description: string
    date_created: string
    treatment: string
  }>
  /** Internal representation of the PDF's explicit nil declaration rule. */
  prior_ip_nil_declaration: boolean
  publicly_funded: boolean
  created_at_employer: boolean
  digital_assets: Array<{
    asset: string
    current_holder: string
    transfer_date: string
  }>
  confidentiality: boolean
  restraint: boolean
  restraint_months: string | null
  restraint_area: string | null
  non_solicit: boolean
  deadlock: string
  dispute_forum: string
  governing_law: string
  signatories: Array<{ name: string; capacity: string }>
}

const yes = (value: 'Yes' | 'No' | '') => value === 'Yes'
const optional = (value: string) => value.trim() || null

export function mapFounderAgreementFields(
  data: FounderAgreementWizardData,
  profile: UserProfile,
): FounderAgreementFieldMap {
  const incorporated = yes(data.isIncorporated)
  const vesting = yes(data.vestingApplies)
  const restraint = yes(data.restraint)

  return {
    is_incorporated: incorporated,
    company_id: incorporated ? optional(profile.companySnapshotId) : null,
    intended_name: incorporated ? null : optional(data.intendedName),
    target_incorporation: incorporated ? null : optional(data.targetIncorporation),
    founders: data.founders.map((founder) => ({
      full_names: founder.fullNames,
      id_number: founder.idNumber,
      role: founder.role,
      equity_pct: founder.equityPct,
      commitment: founder.commitment,
      capital: optional(founder.capital),
    })),
    vesting,
    vesting_months: vesting ? optional(data.vestingMonths) : null,
    cliff_months: vesting ? optional(data.cliffMonths) : null,
    vesting_frequency: vesting ? optional(data.vestingFrequency) : null,
    acceleration: vesting ? optional(data.acceleration) : null,
    good_leaver: vesting ? data.goodLeaver : [],
    bad_leaver_effect: vesting ? optional(data.badLeaverEffect) : null,
    decision_model: data.decisionModel,
    reserved_matters: data.reservedMatters,
    debt_threshold: data.reservedMatters.includes('Take on debt above a threshold') ? optional(data.debtThreshold) : null,
    removal_process: data.removalProcess,
    departure_role: data.departureRole,
    ip_assignment: true,
    ip_pre_incorporation: yes(data.ipPreIncorporation),
    prior_ip: data.priorIpNil ? [] : data.priorIp.map((item) => ({
      founder: item.founder,
      description: item.description,
      date_created: item.dateCreated,
      treatment: item.treatment,
    })),
    prior_ip_nil_declaration: data.priorIpNil,
    publicly_funded: yes(data.publiclyFunded),
    created_at_employer: yes(data.createdAtEmployer),
    digital_assets: data.digitalAssets.map((asset) => ({
      asset: asset.asset,
      current_holder: asset.currentHolder,
      transfer_date: asset.transferDate,
    })),
    confidentiality: yes(data.confidentiality),
    restraint,
    restraint_months: restraint ? optional(data.restraintMonths) : null,
    restraint_area: restraint ? optional(data.restraintArea) : null,
    non_solicit: yes(data.nonSolicit),
    deadlock: data.deadlock,
    dispute_forum: data.disputeForum,
    governing_law: data.governingLaw,
    signatories: data.signatories.map((signatory) => ({ name: signatory.name, capacity: signatory.capacity })),
  }
}
