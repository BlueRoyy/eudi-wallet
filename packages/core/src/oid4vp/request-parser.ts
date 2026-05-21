import type { AuthorizationRequest, PresentationDefinition } from './types.js'

/** Parse and validate an OID4VP authorization request */
export async function parseAuthorizationRequest(
  requestUri: string | Record<string, unknown>,
): Promise<AuthorizationRequest> {
  let raw: Record<string, unknown>

  if (typeof requestUri === 'string') {
    // Could be a request_uri (JWT) or a direct openid4vp:// URI
    if (requestUri.startsWith('openid4vp://') || requestUri.startsWith('haip://')) {
      const url = new URL(requestUri)
      raw = Object.fromEntries(url.searchParams.entries())
    } else {
      // Fetch request object
      const res = await fetch(requestUri)
      if (!res.ok) throw new Error(`Failed to fetch request object: ${res.status}`)
      raw = (await res.json()) as Record<string, unknown>
    }
  } else {
    raw = requestUri
  }

  // Resolve presentation_definition if URI given
  if (raw['presentation_definition_uri'] && !raw['presentation_definition']) {
    const res = await fetch(raw['presentation_definition_uri'] as string)
    if (!res.ok) throw new Error('Failed to fetch presentation_definition')
    raw['presentation_definition'] = (await res.json()) as PresentationDefinition
  }

  validateAuthorizationRequest(raw)
  return raw as unknown as AuthorizationRequest
}

function validateAuthorizationRequest(req: Record<string, unknown>): void {
  if (!req['client_id']) throw new Error('Missing client_id in authorization request')
  if (!req['nonce']) throw new Error('Missing nonce in authorization request')
  if (!req['response_type']) throw new Error('Missing response_type in authorization request')
  if (!req['presentation_definition'] && !req['scope']) {
    throw new Error('Authorization request must include presentation_definition or scope')
  }
}
