/**
 * POST /credential — OID4VCI credential endpoint
 *
 * Flow:
 *   1. Wallet presents Bearer access token
 *   2. Wallet provides a proof JWT (holder binding via c_nonce)
 *   3. Server verifies proof, issues SD-JWT VC with holder key bound
 *   4. Returns signed credential + fresh c_nonce
 *
 * Spec: OID4VCI §7
 */
import { Hono } from "hono"
import { nanoid } from "nanoid"
import { accessTokens, nonces } from "../store/index.js"
import { devSigningKey } from "../credentials/signing-key.js"
import { issueSDJwtVc } from "@eudi-wallet/issuer-sdk"
import type { IssuerConfig } from "../config/index.js"
import { verifyProofJwt } from "../credentials/proof-verifier.js"
import { buildCredentialClaims } from "../credentials/claim-builder.js"

export function credentialRoutes(config: IssuerConfig) {
  const app = new Hono()

  app.post("/credential", async (c) => {
    // ── 1. Validate Bearer token ──────────────────────────────────────────────
    const authHeader = c.req.header("Authorization") ?? ""
    const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim()

    if (!accessToken) {
      return c.json({ error: "invalid_token", error_description: "Missing Authorization header" }, 401)
    }

    const tokenEntry = accessTokens.get(accessToken)
    if (!tokenEntry) {
      return c.json({ error: "invalid_token", error_description: "Access token not found or expired" }, 401)
    }

    // ── 2. Parse request body ─────────────────────────────────────────────────
    let body: Record<string, unknown>
    try {
      body = await c.req.json() as Record<string, unknown>
    } catch {
      return c.json({ error: "invalid_request", error_description: "Invalid JSON body" }, 400)
    }

    const format = body["format"] as string | undefined
    const proof  = body["proof"] as { proof_type?: string; jwt?: string } | undefined

    // ── 3. Verify proof JWT (holder binding) ──────────────────────────────────
    if (!proof?.jwt) {
      return c.json({ error: "invalid_proof", error_description: "Proof JWT required" }, 400)
    }

    let holderPublicKeyJwk: JsonWebKey
    try {
      holderPublicKeyJwk = await verifyProofJwt({
        proofJwt: proof.jwt,
        expectedNonce: tokenEntry.cNonce,
        expectedAudience: config.issuerUrl,
        expectedIssuer: undefined, // any client_id
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Proof verification failed"
      return c.json({ error: "invalid_proof", error_description: message }, 400)
    }

    // ── 4. Build credential claims ────────────────────────────────────────────
    const { fixedClaims, selectiveClaims } = buildCredentialClaims(
      tokenEntry.credentialConfigurationId,
      tokenEntry.subjectData,
      holderPublicKeyJwk,
    )

    // ── 5. Sign and issue the credential ─────────────────────────────────────
    let credential: string
    try {
      credential = await issueSDJwtVc(
        { vct: tokenEntry.credentialConfigurationId, ...fixedClaims },
        selectiveClaims,
        devSigningKey,
        config.issuerUrl,
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signing failed"
      return c.json({ error: "issuance_failed", error_description: message }, 500)
    }

    // ── 6. Rotate c_nonce ─────────────────────────────────────────────────────
    const freshNonce = nanoid(32)
    accessTokens.set(
      accessToken,
      { ...tokenEntry, cNonce: freshNonce, cNonceExpiresAt: Date.now() + 300_000 },
      300,
    )
    nonces.set(freshNonce, { tokenKey: accessToken }, 300)

    return c.json({
      credential,
      c_nonce: freshNonce,
      c_nonce_expires_in: 300,
    })
  })

  return app
}
