/** Common credential metadata stored in the wallet */
export interface StoredCredential {
  id: string
  format: 'vc+sd-jwt' | 'mso_mdoc' | 'jwt_vc_json'
  /** Raw encoded credential (SD-JWT string or base64-encoded mDoc CBOR) */
  raw: string
  /** Issuer URL */
  issuer: string
  /** Credential type / doctype */
  type: string
  /** Human-readable label for display */
  displayName: string
  /** ISO 8601 issuance date */
  issuedAt: string
  /** ISO 8601 expiry date (if present) */
  expiresAt?: string
  /** Decoded claims for display (selective — only revealed claims) */
  displayClaims: Record<string, unknown>
  /** Key ID used for holder binding */
  holderKeyId?: string
}
