import { MDL_DOCTYPE, MDL_MANDATORY_ELEMENTS } from '@eudi-wallet/core'

export interface MdlIssuanceData {
  familyName: string
  givenName: string
  birthDate: string
  issueDate: string
  expiryDate: string
  issuingCountry: string
  issuingAuthority: string
  documentNumber: string
  portrait: Uint8Array
  drivingPrivileges: Array<{ vehicle_category_code: string; issue_date?: string; expiry_date?: string }>
  unDistinguishingSign: string
  sex?: number
  height?: number
  birthPlace?: string
  nationality?: string
  ageOver18?: boolean
  ageOver21?: boolean
}

export const MDL_CREDENTIAL_DEFINITION = {
  doctype: MDL_DOCTYPE,
  namespace: 'org.iso.18013.5.1',
  mandatoryElements: MDL_MANDATORY_ELEMENTS,
} as const
