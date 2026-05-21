/**
 * OID4VP — OpenID for Verifiable Presentations
 * Spec: https://openid.net/specs/openid-4-verifiable-presentations-1_0.html
 */

/** Authorization request (from verifier / relying party) */
export interface AuthorizationRequest {
  response_type: 'vp_token' | 'code'
  client_id: string
  client_id_scheme?: 'redirect_uri' | 'did' | 'x509_san_dns' | 'x509_san_uri' | 'verifier_attestation'
  redirect_uri?: string
  response_uri?: string
  response_mode?: 'direct_post' | 'direct_post.jwt' | 'fragment' | 'query'
  presentation_definition?: PresentationDefinition
  presentation_definition_uri?: string
  client_metadata?: ClientMetadata
  nonce: string
  state?: string
  scope?: string
}

/** Presentation Definition (DIF PE spec) */
export interface PresentationDefinition {
  id: string
  name?: string
  purpose?: string
  input_descriptors: InputDescriptor[]
  submission_requirements?: SubmissionRequirement[]
}

export interface InputDescriptor {
  id: string
  name?: string
  purpose?: string
  format?: Record<string, { alg?: string[]; proof_type?: string[] }>
  constraints?: {
    limit_disclosure?: 'required' | 'preferred'
    fields?: Field[]
  }
}

export interface Field {
  path: string[]
  id?: string
  purpose?: string
  filter?: JSONSchema
  optional?: boolean
  intent_to_retain?: boolean
}

export interface JSONSchema {
  type?: string
  pattern?: string
  const?: unknown
  enum?: unknown[]
}

export interface SubmissionRequirement {
  name?: string
  rule: 'all' | 'pick'
  count?: number
  min?: number
  max?: number
  from?: string
  from_nested?: SubmissionRequirement[]
}

export interface ClientMetadata {
  jwks_uri?: string
  jwks?: { keys: JsonWebKey[] }
  vp_formats?: Record<string, unknown>
  client_name?: string
  logo_uri?: string
}

/** VP Token — what the wallet sends back */
export interface VpToken {
  '@context': string[]
  type: string[]
  id?: string
  holder?: string
  verifiableCredential: string[]
  proof?: VpProof
}

export interface VpProof {
  type: string
  created: string
  verificationMethod: string
  proofPurpose: string
  challenge: string
  domain?: string
  proofValue: string
}

/** Presentation submission (tracks which credentials satisfy which descriptors) */
export interface PresentationSubmission {
  id: string
  definition_id: string
  descriptor_map: DescriptorMapEntry[]
}

export interface DescriptorMapEntry {
  id: string
  format: string
  path: string
  path_nested?: DescriptorMapEntry
}
