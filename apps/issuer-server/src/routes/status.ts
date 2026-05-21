/**
 * GET /status/:id — Status List 2021 endpoint
 *
 * Returns a minimal status list JWT.
 * In production this is driven by a revocation database.
 * This dev implementation returns an all-zeros bitstring (nothing revoked).
 */
import { Hono } from "hono"
import { SignJWT } from "jose"
import { p256 } from "@noble/curves/p256"
import { devSigningKey } from "../credentials/signing-key.js"
import type { IssuerConfig } from "../config/index.js"

/** Build a gzip-compressed all-zeros bitstring encoded as base64url (16KB = 131072 statuses) */
async function buildEmptyStatusList(): Promise<string> {
  const SIZE = 16 * 1024   // 16KB = 131,072 bits
  const zeros = new Uint8Array(SIZE)

  // Compress with gzip
  const cs = new CompressionStream("gzip")
  const writer = cs.writable.getWriter()
  const reader = cs.readable.getReader()

  const writePromise = writer.write(zeros).then(() => writer.close())

  const chunks: Uint8Array[] = []
  let done = false
  while (!done) {
    const result = await reader.read()
    done = result.done
    if (result.value) chunks.push(result.value)
  }
  await writePromise

  const compressed = new Uint8Array(chunks.reduce((a, c) => a + c.length, 0))
  let offset = 0
  for (const chunk of chunks) { compressed.set(chunk, offset); offset += chunk.length }

  // base64url encode
  const binary = Array.from(compressed, (b) => String.fromCharCode(b)).join("")
  return btoa(binary).replace(/[+]/g, "-").replace(/[/]/g, "_").replace(/=/g, "")
}

export function statusRoutes(config: IssuerConfig) {
  const app = new Hono()

  app.get("/status/:id", async (c) => {
    const encodedList = await buildEmptyStatusList()

    // Build a minimal Status List JWT (unsigned in dev — sign in prod)
    const payload = {
      iss: config.issuerUrl,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      statusPurpose: "revocation",
      encodedList,
    }

    // For dev, return JSON directly
    return c.json(payload, 200, {
      "Content-Type": "application/statuslist+jwt",
    })
  })

  return app
}
