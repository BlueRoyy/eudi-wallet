/**
 * Platform-agnostic cryptographic interfaces.
 * Concrete implementations live in @eudi-wallet/crypto (native bridge).
 */

export type KeyAlgorithm = 'ES256' | 'ES384' | 'ES512' | 'EdDSA'

export interface SecureKeyRef {
  readonly keyId: string
  readonly algorithm: KeyAlgorithm
  readonly isHardwareBacked: boolean
  readonly publicKeyJwk: JsonWebKey
}

export interface Signer {
  sign(keyRef: SecureKeyRef, data: Uint8Array): Promise<Uint8Array>
}

export interface KeyManager {
  generateKey(algorithm: KeyAlgorithm, label: string): Promise<SecureKeyRef>
  getKey(keyId: string): Promise<SecureKeyRef | null>
  deleteKey(keyId: string): Promise<void>
  listKeys(): Promise<string[]>
}
