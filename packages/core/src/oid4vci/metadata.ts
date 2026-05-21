import type { CredentialIssuerMetadata } from './types.js'

/** Fetch and validate issuer metadata from the well-known endpoint */
export async function fetchIssuerMetadata(issuerUrl: string): Promise<CredentialIssuerMetadata> {
  const url = new URL('/.well-known/openid-credential-issuer', issuerUrl)
  const response = await fetch(url.toString())

  if (!response.ok) {
    throw new Error(`Failed to fetch issuer metadata: ${response.status} ${response.statusText}`)
  }

  const metadata = (await response.json()) as CredentialIssuerMetadata

  // Basic validation
  if (!metadata.credential_issuer) throw new Error('Missing credential_issuer in metadata')
  if (!metadata.credential_endpoint) throw new Error('Missing credential_endpoint in metadata')
  if (!metadata.credential_configurations_supported) {
    throw new Error('Missing credential_configurations_supported in metadata')
  }

  return metadata
}

/** Parse a credential offer URI (openid-credential-offer://...) */
export function parseCredentialOfferUri(uri: string): { offerUri?: string; offerObject?: unknown } {
  const url = new URL(uri)
  const offerParam = url.searchParams.get('credential_offer')
  const offerUriParam = url.searchParams.get('credential_offer_uri')

  if (offerParam) {
    return { offerObject: JSON.parse(offerParam) }
  }
  if (offerUriParam) {
    return { offerUri: offerUriParam }
  }
  throw new Error('credential_offer URI missing both credential_offer and credential_offer_uri params')
}

/** Resolve a credential offer — either inline or by fetching the offer URI */
export async function resolveCredentialOffer(
  uriOrObject: string | unknown,
): Promise<import('./types.js').CredentialOffer> {
  if (typeof uriOrObject === 'string' && uriOrObject.startsWith('openid-credential-offer://')) {
    const { offerUri, offerObject } = parseCredentialOfferUri(uriOrObject)
    if (offerUri) {
      const res = await fetch(offerUri)
      if (!res.ok) throw new Error(`Failed to fetch credential offer: ${res.status}`)
      return res.json() as Promise<import('./types.js').CredentialOffer>
    }
    return offerObject as import('./types.js').CredentialOffer
  }
  return uriOrObject as import('./types.js').CredentialOffer
}
