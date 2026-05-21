/**
 * ISO 18013-5 standard namespace and element identifiers.
 * Centralises all string constants to prevent typos.
 */

export const MDL_NAMESPACE = 'org.iso.18013.5.1' as const
export const MDL_DOCTYPE = 'org.iso.18013.5.1.mDL' as const

/** Mandatory data elements (§7.2.1 of ISO 18013-5) */
export const MDL_MANDATORY_ELEMENTS = [
  'family_name',
  'given_name',
  'birth_date',
  'issue_date',
  'expiry_date',
  'issuing_country',
  'issuing_authority',
  'document_number',
  'portrait',
  'driving_privileges',
  'un_distinguishing_sign',
] as const

/** Optional data elements */
export const MDL_OPTIONAL_ELEMENTS = [
  'administrative_number',
  'sex',
  'height',
  'weight',
  'eye_colour',
  'hair_colour',
  'birth_place',
  'resident_address',
  'portrait_capture_date',
  'age_in_years',
  'age_birth_year',
  'age_over_18',
  'age_over_21',
  'issuing_jurisdiction',
  'nationality',
  'resident_city',
  'resident_state',
  'resident_postal_code',
  'resident_country',
  'family_name_national_character',
  'given_name_national_character',
  'signature_usual_mark',
] as const

export type MdlMandatoryElement = (typeof MDL_MANDATORY_ELEMENTS)[number]
export type MdlOptionalElement = (typeof MDL_OPTIONAL_ELEMENTS)[number]
export type MdlElement = MdlMandatoryElement | MdlOptionalElement
