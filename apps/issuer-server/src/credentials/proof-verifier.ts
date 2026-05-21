/**
 * Verifies the holder-binding proof JWT sent by the wallet.
 *
 * The proof JWT must:
 *   - Have typ = "openid4vci-proof+jwt"
 *   - Include aud = issuer URL
 *   - Include nonce = the c_nonce issued with the access token
 *   - Be signed with the holder's key (specified in jwk header)
 *
 * Spec: OID4VCI §7.2.1
 */
import { importJWK, jwtVerify, decodeProtectedHeader } from "jose"

export interface ProofVerificationParams {
  proofJwt: string
  expectedNonce: string
  expectedAudience: string
  expectedIssuer: string | undefined
}

/**
 * Verify the proof JWT and return the holder's public key JWK.
 * Throws on any verification failure.
 */
export async function verifyProofJwt(params: ProofVerificationParams): Promise<JsonWebKey> {
  const { proofJwt, expectedNonce, expectedAudience } = params

  // Decode header to extract the holder's public key
  let header: Record<string, unknown>
  try {
    header = decodeProtectedHeader(proofJwt) as Record<string, unknown>
  } catch {
    throw new Error("Cannot decode proof JWT header")
  }

  // Proof typ must be openid4vci-proof+jwt
  if (header["typ"] !== "openid4vci-proof+jwt") {
    throw new Error(`Invalid proof typ: expected "openid4vci-proof+jwt", got "${String(header["typ"])}"`)
  }

  // The holder's public key must be embedded in the header (jwk) or referenced by kid
  const holderJwk = header["jwk"] as JsonWebKey | undefined
  if (!holderJwk) {
    throw new Error("Proof JWT header must contain holder public key in jwk field")
  }

  // Import the public key for verification
  const publicKey = await importJWK(holderJwk, header["alg"] as string ?? "ES256")

  // Verify signature, audience, and claims
  const { payload } = await jwtVerify(proofJwt, publicKey, {
    audience: expectedAudience,
    clockTolerance: "30s",
  })

  // Verify nonce
  const nonce = payload["nonce"]
  if (nonce !== expectedNonce) {
    throw new Error(`Invalid nonce: expected "${expectedNonce}", got "${String(nonce)}"`)
  }

  return holderJwk
}
