/**
 * mDoc / mDL types — ISO/IEC 18013-5
 *
 * mDoc uses CBOR encoding (RFC 8949) and COSE signing (RFC 8152).
 * The raw format is binary; these types represent the decoded structure.
 */

/** Top-level mDoc structure (after CBOR decoding) */
export interface MDoc {
  version: string
  documents: MDocDocument[]
  status: number
}

export interface MDocDocument {
  docType: string
  issuerSigned: IssuerSigned
  deviceSigned?: DeviceSigned
  errors?: Map<string, Map<string, number>>
}

/** Issuer-signed portion (contains the MSO and namespaced data elements) */
export interface IssuerSigned {
  nameSpaces?: Map<string, IssuerSignedItem[]>
  issuerAuth: CoseSigned
}

/** A single data element in the issuer-signed namespace */
export interface IssuerSignedItem {
  digestID: number
  random: Uint8Array
  elementIdentifier: string
  elementValue: unknown
}

/** Mobile Security Object — the signed structure inside issuerAuth */
export interface Mso {
  version: string
  digestAlgorithm: string
  valueDigests: Map<string, Map<number, Uint8Array>>
  deviceKeyInfo: DeviceKeyInfo
  docType: string
  validityInfo: ValidityInfo
}

export interface DeviceKeyInfo {
  deviceKey: Map<number, unknown>  // COSE key map
  keyAuthorizations?: Map<string, unknown>
  keyInfo?: Map<string, unknown>
}

export interface ValidityInfo {
  signed: Date
  validFrom: Date
  validUntil: Date
  expectedUpdate?: Date
}

/** Device-signed response (proximity presentation) */
export interface DeviceSigned {
  nameSpaces: Uint8Array  // CBOR-encoded
  deviceAuth: DeviceAuth
}

export interface DeviceAuth {
  deviceSignature?: CoseSigned
  deviceMac?: CoseMac
}

/** COSE_Sign1 structure */
export interface CoseSigned {
  protectedHeaders: Uint8Array
  unprotectedHeaders: Map<unknown, unknown>
  payload: Uint8Array | null
  signature: Uint8Array
}

/** COSE_Mac0 structure */
export interface CoseMac {
  protectedHeaders: Uint8Array
  unprotectedHeaders: Map<unknown, unknown>
  payload: Uint8Array | null
  tag: Uint8Array
}

/** Decoded, human-readable mDL data */
export interface MdlData {
  familyName: string
  givenName: string
  birthDate: string
  issueDate: string
  expiryDate: string
  issuingCountry: string
  issuingAuthority?: string
  documentNumber: string
  drivingPrivileges?: DrivingPrivilege[]
  portrait?: Uint8Array
  [key: string]: unknown
}

export interface DrivingPrivilege {
  vehicleCategoryCode: string
  issueDate?: string
  expiryDate?: string
  codes?: Array<{ code: string; sign?: string; value?: string }>
}
