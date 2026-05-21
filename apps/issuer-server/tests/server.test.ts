/**
 * Issuer server integration tests.
 * Uses Hono's test helpers — no HTTP server needed.
 */
import { describe, it, expect, beforeAll } from "vitest"
import app from "../src/index.js"

describe("GET /health", () => {
  it("returns 200 ok", async () => {
    const res = await app.request("/health")
    expect(res.status).toBe(200)
    const body = await res.json() as { status: string }
    expect(body.status).toBe("ok")
  })
})

describe("GET /.well-known/openid-credential-issuer", () => {
  it("returns issuer metadata with all credential configurations", async () => {
    const res = await app.request("/.well-known/openid-credential-issuer")
    expect(res.status).toBe(200)
    const body = await res.json() as {
      credential_issuer: string
      credential_endpoint: string
      token_endpoint: string
      credential_configurations_supported: Record<string, unknown>
    }
    expect(body.credential_issuer).toBeTruthy()
    expect(body.credential_endpoint).toBeTruthy()
    expect(body.token_endpoint).toBeTruthy()
    expect(body.credential_configurations_supported).toHaveProperty("LoyaltyCard")
    expect(body.credential_configurations_supported).toHaveProperty("LibraryCard")
    expect(body.credential_configurations_supported).toHaveProperty("AirlineTicket")
  })
})

describe("POST /offer", () => {
  it("creates a credential offer and returns a QR URI", async () => {
    const res = await app.request("/offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        credential_configuration_id: "LoyaltyCard",
        subject_data: {
          member_name: "Alice",
          member_id: "M-001",
          program_name: "SuperMart Rewards",
          tier: "Gold",
          points: 1250,
          issuing_org: "SuperMart Ltd",
        },
      }),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as { offer_uri: string; offer_id: string; qr_data: string }
    expect(body.offer_uri).toMatch(/^openid-credential-offer:\/\//)
    expect(body.offer_id).toBeTruthy()
    expect(body.qr_data).toBe(body.offer_uri)
  })

  it("returns 400 for missing required fields", async () => {
    const res = await app.request("/offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject_data: {} }),
    })
    expect(res.status).toBe(400)
  })
})

describe("GET /offer/:id", () => {
  it("returns the credential offer object", async () => {
    // First create an offer
    const createRes = await app.request("/offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        credential_configuration_id: "LibraryCard",
        subject_data: { member_id: "LIB-123", library_name: "City Library" },
      }),
    })
    const { offer_id } = await createRes.json() as { offer_id: string }

    // Fetch the offer
    const res = await app.request(`/offer/${offer_id}`)
    expect(res.status).toBe(200)
    const body = await res.json() as {
      credential_issuer: string
      credential_configuration_ids: string[]
      grants: Record<string, unknown>
    }
    expect(body.credential_configuration_ids).toContain("LibraryCard")
    expect(body.grants).toHaveProperty("urn:ietf:params:oauth:grant-type:pre-authorized_code")
  })

  it("returns 404 for unknown offer ID", async () => {
    const res = await app.request("/offer/nonexistent-id")
    expect(res.status).toBe(404)
  })
})

describe("POST /token", () => {
  it("exchanges pre-auth code for access token", async () => {
    // Create offer to get a pre-auth code
    const createRes = await app.request("/offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        credential_configuration_id: "LoyaltyCard",
        subject_data: { member_id: "M-002", program_name: "Test Program", issuing_org: "TestCo" },
      }),
    })
    const offerBody = await createRes.json() as {
      offer_object: { grants: { "urn:ietf:params:oauth:grant-type:pre-authorized_code": { "pre-authorized_code": string } } }
    }
    const code = offerBody.offer_object.grants["urn:ietf:params:oauth:grant-type:pre-authorized_code"]["pre-authorized_code"]

    // Exchange for token
    const tokenRes = await app.request("/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:pre-authorized_code",
        "pre-authorized_code": code,
      }).toString(),
    })
    expect(tokenRes.status).toBe(200)
    const tokenBody = await tokenRes.json() as {
      access_token: string; token_type: string; c_nonce: string
    }
    expect(tokenBody.access_token).toBeTruthy()
    expect(tokenBody.token_type).toBe("Bearer")
    expect(tokenBody.c_nonce).toBeTruthy()
  })

  it("rejects an invalid pre-auth code", async () => {
    const res = await app.request("/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:pre-authorized_code",
        "pre-authorized_code": "invalid-code",
      }).toString(),
    })
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toBe("invalid_grant")
  })

  it("rejects a reused pre-auth code", async () => {
    // Create offer
    const createRes = await app.request("/offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        credential_configuration_id: "LoyaltyCard",
        subject_data: { member_id: "M-003", program_name: "Test", issuing_org: "TestCo" },
      }),
    })
    const offerBody = await createRes.json() as {
      offer_object: { grants: { "urn:ietf:params:oauth:grant-type:pre-authorized_code": { "pre-authorized_code": string } } }
    }
    const code = offerBody.offer_object.grants["urn:ietf:params:oauth:grant-type:pre-authorized_code"]["pre-authorized_code"]

    const params = new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:pre-authorized_code",
      "pre-authorized_code": code,
    }).toString()

    // First use — should succeed
    const res1 = await app.request("/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    })
    expect(res1.status).toBe(200)

    // Second use — should fail
    const res2 = await app.request("/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    })
    expect(res2.status).toBe(400)
    const body = await res2.json() as { error: string }
    expect(body.error).toBe("invalid_grant")
  })
})
