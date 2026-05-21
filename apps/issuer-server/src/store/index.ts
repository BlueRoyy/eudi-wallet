/**
 * In-memory TTL stores for pre-auth codes, access tokens, nonces, and offers.
 * Production: replace with Redis or a database.
 */

interface StoreEntry<T> { value: T; expiresAt: number }

class TtlStore<T> {
  private readonly map = new Map<string, StoreEntry<T>>()

  set(key: string, value: T, ttlSeconds: number): void {
    this.map.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
  }

  get(key: string): T | null {
    const entry = this.map.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) { this.map.delete(key); return null }
    return entry.value
  }

  delete(key: string): void { this.map.delete(key) }
  has(key: string): boolean { return this.get(key) !== null }
}

export interface PreAuthCodeEntry {
  credentialConfigurationId: string
  subjectData: Record<string, unknown>
  txCode?: string
  used: boolean
}

export interface AccessTokenEntry {
  credentialConfigurationId: string
  subjectData: Record<string, unknown>
  cNonce: string
  cNonceExpiresAt: number
}

export interface CredentialOfferEntry {
  credentialConfigurationId: string
  subjectData: Record<string, unknown>
  preAuthCode: string
  txCode?: string
}

export const preAuthCodes  = new TtlStore<PreAuthCodeEntry>()
export const accessTokens  = new TtlStore<AccessTokenEntry>()
export const nonces        = new TtlStore<{ tokenKey: string }>()
export const credentialOffers = new TtlStore<CredentialOfferEntry>()
