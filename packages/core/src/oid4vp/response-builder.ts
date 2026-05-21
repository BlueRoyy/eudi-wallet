import type {
  AuthorizationRequest,
  PresentationSubmission,
} from './types.js'

export interface PresentationResponseParams {
  request: AuthorizationRequest
  vpToken: string | string[]
  submission: PresentationSubmission
}

/** Build and POST the authorization response to the verifier's response_uri */
export async function submitPresentationResponse(params: PresentationResponseParams): Promise<Response> {
  const { request, vpToken, submission } = params

  const responseUri = request.response_uri ?? request.redirect_uri
  if (!responseUri) throw new Error('No response_uri or redirect_uri in authorization request')

  const body = new URLSearchParams({
    vp_token: Array.isArray(vpToken) ? JSON.stringify(vpToken) : vpToken,
    presentation_submission: JSON.stringify(submission),
    state: request.state ?? '',
  })

  const response = await fetch(responseUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`VP submission failed: ${response.status} — ${err}`)
  }

  return response
}

/** Build a PresentationSubmission descriptor map for a single SD-JWT VC */
export function buildSdJwtSubmission(
  definitionId: string,
  descriptorId: string,
): PresentationSubmission {
  return {
    id: crypto.randomUUID(),
    definition_id: definitionId,
    descriptor_map: [
      {
        id: descriptorId,
        format: 'vc+sd-jwt',
        path: '$',
      },
    ],
  }
}

/** Build a PresentationSubmission descriptor map for an mDoc */
export function buildMdocSubmission(
  definitionId: string,
  descriptorId: string,
): PresentationSubmission {
  return {
    id: crypto.randomUUID(),
    definition_id: definitionId,
    descriptor_map: [
      {
        id: descriptorId,
        format: 'mso_mdoc',
        path: '$',
      },
    ],
  }
}
