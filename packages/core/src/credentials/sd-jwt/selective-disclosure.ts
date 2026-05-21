import type { ParsedSdJwtVc } from './types.js'

/**
 * Build a presented SD-JWT with only the selected disclosures.
 * Returns a new compact serialization with only disclosed claims.
 */
export function buildPresentedSdJwt(
  parsed: ParsedSdJwtVc,
  claimsToDisclose: string[],
): string {
  const parts: string[] = [parsed.raw.split('~')[0] ?? '']

  for (const claimName of claimsToDisclose) {
    const entry = parsed.disclosures.get(claimName)
    if (!entry) throw new Error(`Claim "${claimName}" not found in credential disclosures`)
    parts.push(entry.digest)
  }

  // Always append trailing ~ per spec
  return parts.join('~') + '~'
}

/**
 * Reveal all claims from a parsed SD-JWT (for local display).
 * Returns a flat map of claim name → value.
 */
export function revealAllClaims(parsed: ParsedSdJwtVc): Record<string, unknown> {
  const claims: Record<string, unknown> = { ...parsed.payload }
  delete claims['_sd']
  delete claims['_sd_alg']

  for (const [claimName, { disclosure }] of parsed.disclosures) {
    claims[claimName] = disclosure[2]
  }

  return claims
}

/** List all selectively-disclosable claim names in a credential */
export function listDisclosableClaims(parsed: ParsedSdJwtVc): string[] {
  return Array.from(parsed.disclosures.keys())
}
