/**
 * POST /token — OAuth 2.0 token endpoint
 *
 * Supports:
 *   - urn:ietf:params:oauth:grant-type:pre-authorized_code (PIN optional)
 *
 * Returns an access token + c_nonce.
 * The c_nonce is used by the wallet to build a holder-binding proof JWT.
 */
import { Hono } from "hono"
import { nanoid } from "nanoid"
import { preAuthCodes, accessTokens, nonces } from "../store/index.js"
import type { IssuerConfig } from "../config/index.js"

export function tokenRoutes(config: IssuerConfig) {
  const app = new Hono()

  app.post("/token", async (c) => {
    // Parse application/x-www-form-urlencoded body
    let body: URLSearchParams
    try {
      const text = await c.req.text()
      body = new URLSearchParams(text)
    } catch {
      return c.json({ error: "invalid_request", error_description: "Could not parse request body" }, 400)
    }

    const grantType = body.get("grant_type")

    // ── Pre-authorized code grant ─────────────────────────────────────────────
    if (grantType === "urn:ietf:params:oauth:grant-type:pre-authorized_code") {
      const preAuthCode = body.get("pre-authorized_code")
      const txCode      = body.get("tx_code")

      if (!preAuthCode) {
        return c.json({ error: "invalid_request", error_description: "Missing pre-authorized_code" }, 400)
      }

      const entry = preAuthCodes.get(preAuthCode)

      if (!entry) {
        return c.json({ error: "invalid_grant", error_description: "Pre-authorized code not found or expired" }, 400)
      }

      if (entry.used) {
        return c.json({ error: "invalid_grant", error_description: "Pre-authorized code already used" }, 400)
      }

      // Validate tx_code (PIN) if required
      if (entry.txCode !== undefined) {
        if (!txCode) {
          return c.json({ error: "invalid_grant", error_description: "tx_code required but not provided" }, 400)
        }
        if (txCode !== entry.txCode) {
          return c.json({ error: "invalid_grant", error_description: "Invalid tx_code" }, 400)
        }
      }

      // Mark as used (one-time code)
      preAuthCodes.set(preAuthCode, { ...entry, used: true }, 10)

      // Issue access token + c_nonce
      const accessToken = nanoid(48)
      const cNonce      = nanoid(32)

      accessTokens.set(
        accessToken,
        {
          credentialConfigurationId: entry.credentialConfigurationId,
          subjectData: entry.subjectData,
          cNonce,
          cNonceExpiresAt: Date.now() + config.nonceTtl * 1000,
        },
        config.accessTokenTtl,
      )

      nonces.set(cNonce, { tokenKey: accessToken }, config.nonceTtl)

      return c.json({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: config.accessTokenTtl,
        c_nonce: cNonce,
        c_nonce_expires_in: config.nonceTtl,
      })
    }

    // ── Unsupported grant ─────────────────────────────────────────────────────
    return c.json(
      { error: "unsupported_grant_type", error_description: `Grant type "${grantType ?? ""}" not supported` },
      400,
    )
  })

  return app
}
