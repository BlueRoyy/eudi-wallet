/**
 * SD-JWT VC — Selective Disclosure JWT Verifiable Credentials
 * Spec: https://www.ietf.org/draft-ietf-oauth-sd-jwt-vc/
 */

export interface SdJwtVcPayload {
  /** Issuer */
  iss: string
  /** Subject (holder DID or identifier) */
  sub?: string
  /** Issued at (Unix timestamp) */
  iat: number
  /** Expiry (Unix timestamp) */
  exp?: number
  /** Not before (Unix timestamp) */
  nbf?: number
  /** JWT ID */
  jti?: string
  /** Verifiable Credential type */
  vct: string
  /** SD-JWT disclosure digests */
  _sd?: string[]
  /** Hash algorithm used for disclosures */
  _sd_alg?: string
  /** Confirmation (holder key binding) */
  cnf?: { jwk: JsonWebKey }
  /** Status (revocation) */
  status?: { status_list: { idx: number; uri: string } }
  /** Additional claims */
  [key: string]: unknown
}

/** A single disclosure: [salt, claim_name, claim_value] */
export type Disclosure = [string, string, unknown]

/** Parsed SD-JWT VC */
export interface ParsedSdJwtVc {
  /** JWT header */
  header: Record<string, unknown>
  /** JWT payload (with _sd arrays) */
  payload: SdJwtVcPayload
  /** Decoded disclosures */
  disclosures: Map<string, { disclosure: Disclosure; digest: string }>
  /** Key binding JWT (if present) */
  keyBindingJwt?: string
  /** Original compact serialization */
  raw: string
}
