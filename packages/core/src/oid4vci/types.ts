/**
 * OID4VCI — OpenID for Verifiable Credential Issuance
 * Spec: https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html
 */

/** Credential offer from issuer (QR code / deep link payload) */
export interface CredentialOffer {
  credential_issuer: string
  credential_configuration_ids: string[]
  grants?: {
    authorization_code?: {
      issuer_state?: string
      authorization_server?: string
    }
    'urn:ietf:params:oauth:grant-type:pre-authorized_code'?: {
      'pre-authorized_code': string
      tx_code?: {
        input_mode?: 'numeric' | 'text'
        length?: number
        description?: string
      }
    }
  }
}

/** Issuer metadata (/.well-known/openid-credential-issuer) */
export interface CredentialIssuerMetadata {
  credential_issuer: string
  credential_endpoint: string
  authorization_servers?: string[]
  credential_configurations_supported: Record<string, CredentialConfiguration>
  display?: IssuerDisplay[]
}

export interface CredentialConfiguration {
  format: 'vc+sd-jwt' | 'mso_mdoc' | 'jwt_vc_json'
  scope?: string
  cryptographic_binding_methods_supported?: string[]
  credential_signing_alg_values_supported?: string[]
  display?: CredentialDisplay[]
  doctype?: string          // mso_mdoc only
  vct?: string              // vc+sd-jwt only
  claims?: Record<string, ClaimMetadata>
}

export interface ClaimMetadata {
  mandatory?: boolean
  value_type?: string
  display?: Array<{ name: string; locale?: string }>
}

export interface IssuerDisplay {
  name: string
  locale?: string
  logo?: { uri: string; alt_text?: string }
  background_color?: string
  text_color?: string
}

export interface CredentialDisplay {
  name: string
  locale?: string
  logo?: { uri: string; alt_text?: string }
  background_color?: string
  text_color?: string
  background_image?: { uri: string; alt_text?: string }
}

/** Token response from the authorization server */
export interface TokenResponse {
  access_token: string
  token_type: 'Bearer' | 'DPoP'
  expires_in?: number
  c_nonce?: string
  c_nonce_expires_in?: number
  authorization_details?: AuthorizationDetail[]
}

export interface AuthorizationDetail {
  type: 'openid_credential'
  credential_configuration_id?: string
  credential_identifiers?: string[]
}

/** Credential request payload */
export interface CredentialRequest {
  format: string
  doctype?: string
  vct?: string
  proof?: CredentialProof
  credential_response_encryption?: CredentialResponseEncryption
}

export interface CredentialProof {
  proof_type: 'jwt' | 'cwt'
  jwt?: string
  cwt?: string
}

export interface CredentialResponseEncryption {
  jwk: JsonWebKey
  alg: string
  enc: string
}

/** Credential response from issuer */
export interface CredentialResponse {
  credential?: string
  transaction_id?: string
  c_nonce?: string
  c_nonce_expires_in?: number
  notification_id?: string
}
