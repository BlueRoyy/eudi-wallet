/** Trust framework types for eIDAS v2 / EUDIW */

export interface TrustedIssuer {
  /** Issuer URL */
  issuer: string
  /** Issuer X.509 certificate chain (PEM) */
  certificateChain?: string[]
  /** Credential types this issuer is trusted for */
  credentialTypes: string[]
  /** Country code (ISO 3166-1 alpha-2) */
  country?: string
  /** Display name */
  name?: string
  /** Is this a qualified trust service provider (QTSP)? */
  isQualified?: boolean
}

export interface TrustList {
  /** URL of this trust list */
  uri: string
  /** ISO 8601 last update timestamp */
  lastUpdated: string
  /** Trusted issuers */
  issuers: TrustedIssuer[]
}

export interface TrustValidationResult {
  isTrusted: boolean
  issuer?: TrustedIssuer
  reason?: string
}
