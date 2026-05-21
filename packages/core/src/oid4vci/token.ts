import type { CredentialOffer, TokenResponse } from './types.js'

export interface PreAuthTokenParams {
  tokenEndpoint: string
  preAuthorizedCode: string
  txCode?: string
  clientId?: string
}

export interface AuthCodeTokenParams {
  tokenEndpoint: string
  code: string
  redirectUri: string
  clientId: string
  codeVerifier: string
}

/** Exchange pre-authorized_code for an access token */
export async function exchangePreAuthorizedCode(params: PreAuthTokenParams): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:pre-authorized_code',
    'pre-authorized_code': params.preAuthorizedCode,
  })
  if (params.txCode) body.set('tx_code', params.txCode)
  if (params.clientId) body.set('client_id', params.clientId)

  const response = await fetch(params.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token request failed: ${response.status} — ${error}`)
  }

  return response.json() as Promise<TokenResponse>
}

/** Exchange authorization code for an access token (PKCE) */
export async function exchangeAuthorizationCode(params: AuthCodeTokenParams): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: params.clientId,
    code_verifier: params.codeVerifier,
  })

  const response = await fetch(params.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token request failed: ${response.status} — ${error}`)
  }

  return response.json() as Promise<TokenResponse>
}

/** Determine which token grant to use from a credential offer */
export function detectGrantType(
  offer: CredentialOffer,
): 'pre-authorized_code' | 'authorization_code' | null {
  if (offer.grants?.['urn:ietf:params:oauth:grant-type:pre-authorized_code']) {
    return 'pre-authorized_code'
  }
  if (offer.grants?.authorization_code) {
    return 'authorization_code'
  }
  return null
}
