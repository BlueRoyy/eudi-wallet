/**
 * Dev signing key — generates an ephemeral P-256 key pair on startup.
 * Production: load from HSM/KMS via SIGNING_PRIVATE_KEY_PEM env var.
 */
import { p256 } from "@noble/curves/p256"
import { base64urlEncode } from "@eudi-wallet/core"
import type { IssuerSigningKey } from "@eudi-wallet/issuer-sdk"

function toBase64url(bytes: Uint8Array): string {
  return base64urlEncode(bytes)
}

function padTo32(bytes: Uint8Array): Uint8Array {
  if (bytes.length === 32) return bytes
  const out = new Uint8Array(32)
  out.set(bytes, 32 - bytes.length)
  return out
}

export function createDevSigningKey(): IssuerSigningKey {
  // Generate ephemeral P-256 key
  const privBytes = p256.utils.randomPrivateKey()
  const pubPoint  = p256.getPublicKey(privBytes, false) // uncompressed: 65 bytes

  // Extract x,y from uncompressed point (0x04 || x || y)
  const x = pubPoint.slice(1, 33)
  const y = pubPoint.slice(33, 65)

  const publicKeyJwk: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    x: toBase64url(x),
    y: toBase64url(y),
    key_ops: ["verify"],
  }

  return {
    keyId: "dev-key-1",
    algorithm: "ES256",
    publicKeyJwk,

    async sign(data: Uint8Array): Promise<Uint8Array> {
      // noble/curves returns DER-encoded signature; convert to raw r||s (64 bytes)
      const sig = p256.sign(data, privBytes, { lowS: true, prehash: true })
      const r = padTo32(sig.r.toBytes())
      const s = padTo32(sig.s.toBytes())
      const raw = new Uint8Array(64)
      raw.set(r, 0)
      raw.set(s, 32)
      return raw
    },
  }
}

// Singleton — created once on startup
export const devSigningKey = createDevSigningKey()
