/**
 * Builds the holder-binding proof JWT sent to the issuer's credential endpoint.
 *
 * The proof JWT:
 *   - Has typ = "openid4vci-proof+jwt"
 *   - Embeds the holder's public key in the jwk header
 *   - Signs with the holder's private key
 *   - Claims: iss (client_id), aud (issuer URL), iat, nonce (c_nonce)
 *
 * Spec: OID4VCI §7.2.1
 */
import { base64urlEncode } from "../utils/index.js"
import type { SecureKeyRef, Signer } from "../crypto/index.js"

export interface ProofJwtParams {
  /** The holder's signing key reference */
  keyRef: SecureKeyRef
  /** The signer implementation (native bridge in the wallet) */
  signer: Signer
  /** Issuer URL (aud claim) */
  issuerUrl: string
  /** c_nonce from the token response */
  cNonce: string
  /** Client ID (iss claim) — optional for public clients */
  clientId?: string
}

/**
 * Build and sign a proof JWT for OID4VCI credential requests.
 * Returns the compact JWT string ready to include in the credential request.
 */
export async function buildProofJwt(params: ProofJwtParams): Promise<string> {
  const { keyRef, signer, issuerUrl, cNonce, clientId } = params

  const header = {
    alg: keyRef.algorithm,
    typ: "openid4vci-proof+jwt",
    jwk: keyRef.publicKeyJwk,
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    ...(clientId ? { iss: clientId } : {}),
    aud: issuerUrl,
    iat: now,
    nonce: cNonce,
  }

  const headerB64  = base64urlEncode(new TextEncoder().encode(JSON.stringify(header)))
  const payloadB64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(payload)))
  const signingInput = `${headerB64}.${payloadB64}`

  const signatureBytes = await signer.sign(keyRef, new TextEncoder().encode(signingInput))
  const sigB64 = base64urlEncode(signatureBytes)

  return `${signingInput}.${sigB64}`
}
