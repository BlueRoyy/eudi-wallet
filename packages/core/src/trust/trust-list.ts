import type { TrustList, TrustedIssuer } from './types.js'

/**
 * EUDIW Trusted Issuers Registry client.
 * In production this fetches from the official EU Trust List endpoint.
 */
export class TrustListClient {
  private readonly registryUrl: string
  private cachedList?: TrustList
  private cacheExpiry?: number
  private readonly cacheTtlMs: number

  constructor(registryUrl: string, cacheTtlMs = 60 * 60 * 1000) {
    this.registryUrl = registryUrl
    this.cacheTtlMs = cacheTtlMs
  }

  /** Fetch and cache the trust list */
  async getTrustList(): Promise<TrustList> {
    if (this.cachedList && this.cacheExpiry && Date.now() < this.cacheExpiry) {
      return this.cachedList
    }

    const response = await fetch(this.registryUrl, {
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch trust list: ${response.status}`)
    }

    this.cachedList = (await response.json()) as TrustList
    this.cacheExpiry = Date.now() + this.cacheTtlMs
    return this.cachedList
  }

  /** Look up a specific issuer by URL */
  async findIssuer(issuerUrl: string): Promise<TrustedIssuer | null> {
    const list = await this.getTrustList()
    return list.issuers.find((i) => i.issuer === issuerUrl) ?? null
  }

  /** Invalidate the cache (e.g. after a trust list update notification) */
  invalidateCache(): void {
    this.cachedList = undefined
    this.cacheExpiry = undefined
  }
}
