/**
 * GET /.well-known/openid-credential-issuer
 *
 * Returns the issuer metadata document per OID4VCI spec §11.2.2.
 * Wallets fetch this to discover supported credential types,
 * token endpoint, credential endpoint, and display metadata.
 */
import { Hono } from "hono"
import type { IssuerConfig } from "../config/index.js"
import { devSigningKey } from "../credentials/signing-key.js"

export function metadataRoutes(config: IssuerConfig) {
  const app = new Hono()

  app.get("/.well-known/openid-credential-issuer", (c) => {
    const issuer = config.issuerUrl

    return c.json({
      credential_issuer: issuer,
      credential_endpoint: `${issuer}/credential`,
      token_endpoint: `${issuer}/token`,
      authorization_server: issuer,

      // JWKS — wallets use this to verify credential signatures
      jwks: {
        keys: [
          {
            ...devSigningKey.publicKeyJwk,
            kid: devSigningKey.keyId,
            use: "sig",
            alg: devSigningKey.algorithm,
          },
        ],
      },

      // Supported credential configurations
      credential_configurations_supported: {

        // ── Loyalty Card (SD-JWT VC) ──────────────────────────────────────────
        LoyaltyCard: {
          format: "vc+sd-jwt",
          vct: "LoyaltyCard",
          cryptographic_binding_methods_supported: ["jwk", "did:key"],
          credential_signing_alg_values_supported: ["ES256"],
          proof_types_supported: { jwt: { proof_signing_alg_values_supported: ["ES256"] } },
          display: [
            {
              name: "Loyalty Card",
              locale: "en",
              background_color: "#1a3a5c",
              text_color: "#ffffff",
              description: "Your digital loyalty membership card",
            },
          ],
          claims: {
            member_name:   { mandatory: false, display: [{ name: "Member name",   locale: "en" }] },
            member_id:     { mandatory: true,  display: [{ name: "Member ID",     locale: "en" }] },
            program_name:  { mandatory: true,  display: [{ name: "Program",       locale: "en" }] },
            tier:          { mandatory: false, display: [{ name: "Tier",          locale: "en" }] },
            points:        { mandatory: false, display: [{ name: "Points",        locale: "en" }] },
            expiry_date:   { mandatory: false, display: [{ name: "Expiry",        locale: "en" }] },
            issuing_org:   { mandatory: true,  display: [{ name: "Issued by",     locale: "en" }] },
          },
        },

        // ── Library Card (SD-JWT VC) ──────────────────────────────────────────
        LibraryCard: {
          format: "vc+sd-jwt",
          vct: "LibraryCard",
          cryptographic_binding_methods_supported: ["jwk", "did:key"],
          credential_signing_alg_values_supported: ["ES256"],
          proof_types_supported: { jwt: { proof_signing_alg_values_supported: ["ES256"] } },
          display: [
            {
              name: "Library Card",
              locale: "en",
              background_color: "#2d6a4f",
              text_color: "#ffffff",
              description: "Public library membership card",
            },
          ],
          claims: {
            member_id:    { mandatory: true,  display: [{ name: "Member ID",  locale: "en" }] },
            member_name:  { mandatory: false, display: [{ name: "Full name",  locale: "en" }] },
            library_name: { mandatory: true,  display: [{ name: "Library",   locale: "en" }] },
            expiry_date:  { mandatory: false, display: [{ name: "Expiry",    locale: "en" }] },
            branch:       { mandatory: false, display: [{ name: "Branch",    locale: "en" }] },
          },
        },

        // ── Airline Ticket (SD-JWT VC) ────────────────────────────────────────
        AirlineTicket: {
          format: "vc+sd-jwt",
          vct: "AirlineTicket",
          cryptographic_binding_methods_supported: ["jwk"],
          credential_signing_alg_values_supported: ["ES256"],
          proof_types_supported: { jwt: { proof_signing_alg_values_supported: ["ES256"] } },
          display: [
            {
              name: "Boarding Pass",
              locale: "en",
              background_color: "#1d3461",
              text_color: "#ffffff",
              description: "Digital airline boarding pass",
            },
          ],
          claims: {
            passenger_name:   { mandatory: true,  display: [{ name: "Passenger",   locale: "en" }] },
            flight_number:    { mandatory: true,  display: [{ name: "Flight",       locale: "en" }] },
            departure_date:   { mandatory: true,  display: [{ name: "Date",         locale: "en" }] },
            origin:           { mandatory: true,  display: [{ name: "From",         locale: "en" }] },
            destination:      { mandatory: true,  display: [{ name: "To",           locale: "en" }] },
            seat:             { mandatory: false, display: [{ name: "Seat",         locale: "en" }] },
            booking_reference:{ mandatory: false, display: [{ name: "Booking ref",  locale: "en" }] },
          },
        },

      },

      // Supported grant types
      grant_types_supported: [
        "urn:ietf:params:oauth:grant-type:pre-authorized_code",
        "authorization_code",
      ],
    })
  })

  return app
}
