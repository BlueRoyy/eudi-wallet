/**
 * @eudi-wallet/core
 *
 * Pure TypeScript implementation of eIDAS v2 / EUDIW ARF protocols.
 * No React Native or platform-specific dependencies — fully testable in Node.js.
 *
 * Exports:
 *   OID4VCI  — credential issuance (pre-auth + authorization code flows)
 *   OID4VP   — credential presentation (online + proximity)
 *   Credentials — SD-JWT VC + ISO 18013-5 mDoc/mDL
 *   Trust    — issuer trust chain validation
 *   Revocation — Status List 2021 / OCSP
 *   Crypto   — key types and interfaces (implementations in @eudi-wallet/crypto)
 */

export * from './oid4vci/index.js'
export * from './oid4vp/index.js'
export * from './credentials/index.js'
export * from './trust/index.js'
export * from './revocation/index.js'
export * from './crypto/index.js'
export * from './utils/index.js'
