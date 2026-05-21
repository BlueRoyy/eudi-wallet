import type { Disclosure, ParsedSdJwtVc, SdJwtVcPayload } from './types.js'

const SD_JWT_SEPARATOR = '~'

/**
 * Parse an SD-JWT VC compact serialization.
 * Format: <JWT>~<disclosure1>~<disclosure2>~...[~<kb-jwt>]
 */
export function parseSdJwtVc(raw: string): ParsedSdJwtVc {
  const parts = raw.split(SD_JWT_SEPARATOR)
  if (parts.length < 1 || !parts[0]) throw new Error('Invalid SD-JWT: missing JWT part')

  const jwt = parts[0]
  const [headerB64, payloadB64] = jwt.split('.')
  if (!headerB64 || !payloadB64) throw new Error('Invalid SD-JWT: malformed JWT')

  const header = JSON.parse(base64urlDecode(headerB64)) as Record<string, unknown>
  const payload = JSON.parse(base64urlDecode(payloadB64)) as SdJwtVcPayload

  // Determine if last part is a KB-JWT (has 3 dots like a normal JWT)
  const lastPart = parts[parts.length - 1] ?? ''
  const hasKbJwt = lastPart.split('.').length === 3 && parts.length > 1
  const disclosureParts = hasKbJwt ? parts.slice(1, -1) : parts.slice(1)
  const keyBindingJwt = hasKbJwt ? lastPart : undefined

  // Decode disclosures
  const disclosures = new Map<string, { disclosure: Disclosure; digest: string }>()
  for (const part of disclosureParts) {
    if (!part) continue
    const decoded = JSON.parse(base64urlDecode(part)) as Disclosure
    if (!Array.isArray(decoded) || decoded.length !== 3) {
      throw new Error(`Invalid disclosure: ${part}`)
    }
    const claimName = decoded[1] as string
    disclosures.set(claimName, { disclosure: decoded, digest: part })
  }

  return { header, payload, disclosures, keyBindingJwt, raw }
}

/** Decode base64url to UTF-8 string */
function base64urlDecode(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  return atob(padded)
}
