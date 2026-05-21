import { base64urlEncode } from '@eudi-wallet/core'
import type { IssuerSigningKey } from './types.js'

export interface SdJwtVcClaims {
  vct: string
  sub?: string
  iat?: number
  exp?: number
  [key: string]: unknown
}

export interface SelectiveDisclosureClaim {
  name: string
  value: unknown
}

export async function issueSDJwtVc(
  claims: SdJwtVcClaims,
  sdClaims: SelectiveDisclosureClaim[],
  signingKey: IssuerSigningKey,
  issuerUrl: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const disclosures: string[] = []
  const sdDigests: string[] = []

  for (const { name, value } of sdClaims) {
    const salt = generateSalt()
    const encoded = base64urlEncode(new TextEncoder().encode(JSON.stringify([salt, name, value])))
    disclosures.push(encoded)
    const digest = await sha256Digest(encoded)
    sdDigests.push(digest)
  }

  const payload = {
    iss: issuerUrl,
    iat: claims.iat ?? now,
    ...(claims.exp ? { exp: claims.exp } : {}),
    vct: claims.vct,
    _sd: sdDigests,
    _sd_alg: 'sha-256',
    ...Object.fromEntries(Object.entries(claims).filter(([k]) => !['vct', 'iat', 'exp'].includes(k))),
  }

  const header = { alg: signingKey.algorithm, typ: 'vc+sd-jwt', kid: signingKey.keyId }
  const headerB64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(header)))
  const payloadB64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(payload)))
  const signingInput = `${headerB64}.${payloadB64}`
  const signatureBytes = await signingKey.sign(new TextEncoder().encode(signingInput))
  const jwt = `${signingInput}.${base64urlEncode(signatureBytes)}`
  return [jwt, ...disclosures, ''].join('~')
}

function generateSalt(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return base64urlEncode(bytes)
}

async function sha256Digest(input: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return base64urlEncode(new Uint8Array(hashBuffer))
}
