/**
 * @eudi-wallet/issuer-sdk
 *
 * Server-side credential issuance SDK.
 * Use this to build OID4VCI-compliant issuers for:
 *   - ISO 18013-5 mDL (digital driver's licence)
 *   - SD-JWT VC (loyalty cards, library cards, boarding passes, etc.)
 *
 * Designed for Node.js / Deno / edge runtimes.
 * Signing requires an HSM or KMS — interfaces provided, implementations plug in.
 */

export * from './oid4vci-server/index.js'
export * from './credentials/index.js'
export * from './signing/index.js'
export * from './registry/index.js'
