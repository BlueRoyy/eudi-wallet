import type {
  CredentialIssuerMetadata,
  CredentialRequest,
  CredentialResponse,
  TokenResponse,
} from './types.js'

export interface IssuerClientOptions {
  metadata: CredentialIssuerMetadata
  tokenResponse: TokenResponse
}

/**
 * High-level client for the OID4VCI credential endpoint.
 * Handles nonce tracking and credential proof construction.
 */
export class IssuerClient {
  private readonly metadata: CredentialIssuerMetadata
  private accessToken: string
  private cNonce?: string

  constructor(opts: IssuerClientOptions) {
    this.metadata = opts.metadata
    this.accessToken = opts.tokenResponse.access_token
    this.cNonce = opts.tokenResponse.c_nonce
  }

  /**
   * Request a credential from the issuer.
   * @param request - Credential request payload (format + proof)
   */
  async requestCredential(request: CredentialRequest): Promise<CredentialResponse> {
    const response = await fetch(this.metadata.credential_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Credential request failed: ${response.status} — ${error}`)
    }

    const result = (await response.json()) as CredentialResponse

    // Update nonce for next request
    if (result.c_nonce) this.cNonce = result.c_nonce

    return result
  }

  /** Get the current c_nonce for proof construction */
  get currentNonce(): string | undefined {
    return this.cNonce
  }

  /** Get the issuer URL */
  get issuerUrl(): string {
    return this.metadata.credential_issuer
  }
}
