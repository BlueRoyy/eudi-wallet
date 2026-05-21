/**
 * POST /offer  — create a credential offer (admin/backend endpoint)
 * GET  /offer/:id — return the credential offer object (for QR code deep link)
 *
 * Flow:
 *   1. Backend calls POST /offer with subject data
 *   2. Server creates a pre-auth code + offer entry, returns a QR URI
 *   3. Wallet scans QR → fetches GET /offer/:id → starts OID4VCI flow
 */
import { Hono } from "hono"
import { nanoid } from "nanoid"
import { z } from "zod"
import { preAuthCodes, credentialOffers } from "../store/index.js"
import type { IssuerConfig } from "../config/index.js"

const CreateOfferSchema = z.object({
  credential_configuration_id: z.string(),
  subject_data: z.record(z.unknown()),
  tx_code: z.string().optional(),          // optional PIN the user must enter
})

export function offerRoutes(config: IssuerConfig) {
  const app = new Hono()

  // Admin endpoint — creates an offer and returns the QR URI
  app.post("/offer", async (c) => {
    const body = await c.req.json().catch(() => null)
    const parsed = CreateOfferSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(
        { error: "invalid_request", error_description: parsed.error.message },
        400,
      )
    }

    const { credential_configuration_id, subject_data, tx_code } = parsed.data

    // Generate IDs
    const offerId      = nanoid(24)
    const preAuthCode  = nanoid(32)

    // Store the pre-auth code
    preAuthCodes.set(
      preAuthCode,
      {
        credentialConfigurationId: credential_configuration_id,
        subjectData: subject_data,
        txCode: tx_code,
        used: false,
      },
      config.preAuthCodeTtl,
    )

    // Store the offer (so GET /offer/:id can return it)
    credentialOffers.set(
      offerId,
      {
        credentialConfigurationId: credential_configuration_id,
        subjectData: subject_data,
        preAuthCode,
        txCode: tx_code,
      },
      config.preAuthCodeTtl,
    )

    const offerObject = {
      credential_issuer: config.issuerUrl,
      credential_configuration_ids: [credential_configuration_id],
      grants: {
        "urn:ietf:params:oauth:grant-type:pre-authorized_code": {
          "pre-authorized_code": preAuthCode,
          ...(tx_code
            ? { tx_code: { input_mode: "numeric", length: tx_code.length, description: "Enter your PIN" } }
            : {}),
        },
      },
    }

    // Deep link URI — wallet scans this as a QR code
    const offerUri = `openid-credential-offer://?credential_offer_uri=${encodeURIComponent(
      `${config.issuerUrl}/offer/${offerId}`,
    )}`

    return c.json({
      offer_id: offerId,
      offer_uri: offerUri,
      offer_object: offerObject,
      expires_in: config.preAuthCodeTtl,
      qr_data: offerUri,       // embed this in a QR code
    })
  })

  // Public endpoint — returns the credential offer object for a given offer ID
  app.get("/offer/:id", (c) => {
    const offerId = c.req.param("id")
    const entry = credentialOffers.get(offerId)

    if (!entry) {
      return c.json(
        { error: "not_found", error_description: "Credential offer not found or expired" },
        404,
      )
    }

    return c.json({
      credential_issuer: config.issuerUrl,
      credential_configuration_ids: [entry.credentialConfigurationId],
      grants: {
        "urn:ietf:params:oauth:grant-type:pre-authorized_code": {
          "pre-authorized_code": entry.preAuthCode,
          ...(entry.txCode
            ? { tx_code: { input_mode: "numeric", length: entry.txCode.length } }
            : {}),
        },
      },
    })
  })

  return app
}
