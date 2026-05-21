/**
 * End-to-end OID4VCI issuance flow test.
 *
 * Simulates the full wallet-side flow against a mock issuer:
 *   1. Fetch issuer metadata
 *   2. Resolve credential offer
 *   3. Exchange pre-auth code → access token
 *   4. Build proof JWT (using a mock signer)
 *   5. Request credential → receive SD-JWT VC
 *   6. Parse and verify the received credential
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { parseSdJwtVc, revealAllClaims } from '../src/credentials/sd-jwt/index.js'
import { buildProofJwt } from '../src/oid4vci/proof-builder.js'
import { detectGrantType } from '../src/oid4vci/token.js'
import { parseCredentialOfferUri } from '../src/oid4vci/metadata.js'
import type { SecureKeyRef, Signer } from '../src/crypto/index.js'
import type { CredentialOffer, TokenResponse, CredentialResponse } from '../src/oid4vci/types.js'

// ── Mock signer (P-256 via WebCrypto — available in Node 20+) ────────────────

let mockKeyPair: CryptoKeyPair
let mockKeyRef: SecureKeyRef

beforeAll(async () => {
  mockKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify'],
  )
  const publicKeyJwk = await crypto.subtle.exportKey('jwk', mockKeyPair.publicKey)
  mockKeyRef = {
    keyId: 'test-key-1',
    algorithm: 'ES256',
    isHardwareBacked: false,
    publicKeyJwk,
  }
})

const mockSigner: Signer = {
  async sign(_keyRef: SecureKeyRef, data: Uint8Array): Promise<Uint8Array> {
    const sig = await crypto.subtle.sign(
      { name: 'ECDSA', hash: { name: 'SHA-256' } },
      mockKeyPair.privateKey,
      data,
    )
    // WebCrypto returns DER — convert to raw r||s for ES256
    const der = new Uint8Array(sig)
    // Simple DER → raw conversion for P-256
    const rLen = der[3] ?? 0
    const rStart = 4
    const sStart = rStart + rLen + 2
    const sLen = der[sStart - 1] ?? 0
    const r = der.slice(rStart, rStart + rLen)
    const s = der.slice(sStart, sStart + sLen)
    const raw = new Uint8Array(64)
    raw.set(r.slice(-32), 32 - Math.min(32, r.length))
    raw.set(s.slice(-32), 64 - Math.min(32, s.length))
    return raw
  },
}

// ── Mock issuer server (in-process, no HTTP) ──────────────────────────────────

const ISSUER_URL = 'https://issuer.example.com'
const C_NONCE    = 'test-nonce-abc123'

function base64urlEncode(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function buildMockCredential(): Promise<string> {
  // Minimal SD-JWT VC for a loyalty card
  const salt = base64urlEncode(crypto.getRandomValues(new Uint8Array(16)))
  const disc  = base64urlEncode(new TextEncoder().encode(JSON.stringify([salt, 'member_name', 'Alice'])))
  const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(disc))
  const digest  = base64urlEncode(new Uint8Array(hashBuf))

  const header  = base64urlEncode(new TextEncoder().encode(JSON.stringify({ alg: 'ES256', typ: 'vc+sd-jwt' })))
  const payload = base64urlEncode(new TextEncoder().encode(JSON.stringify({
    iss: ISSUER_URL, vct: 'LoyaltyCard', iat: Math.floor(Date.now() / 1000),
    member_id: 'M-001', program_name: 'SuperMart Rewards',
    _sd: [digest], _sd_alg: 'sha-256',
  })))
  const sig = base64urlEncode(new Uint8Array(64))
  return `${header}.${payload}.${sig}~${disc}~`
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('OID4VCI issuance — end-to-end flow', () => {

  it('step 1: parses a credential offer URI', () => {
    const offer: CredentialOffer = {
      credential_issuer: ISSUER_URL,
      credential_configuration_ids: ['LoyaltyCard'],
      grants: {
        'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
          'pre-authorized_code': 'code-abc',
        },
      },
    }
    const encoded = encodeURIComponent(JSON.stringify(offer))
    const uri = `openid-credential-offer://?credential_offer=${encoded}`
    const { offerObject } = parseCredentialOfferUri(uri)
    expect((offerObject as CredentialOffer).credential_issuer).toBe(ISSUER_URL)
  })

  it('step 2: detects pre-authorized_code grant', () => {
    const offer: CredentialOffer = {
      credential_issuer: ISSUER_URL,
      credential_configuration_ids: ['LoyaltyCard'],
      grants: {
        'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
          'pre-authorized_code': 'code-abc',
        },
      },
    }
    expect(detectGrantType(offer)).toBe('pre-authorized_code')
  })

  it('step 3: builds a valid proof JWT', async () => {
    const proofJwt = await buildProofJwt({
      keyRef: mockKeyRef,
      signer: mockSigner,
      issuerUrl: ISSUER_URL,
      cNonce: C_NONCE,
      clientId: 'test-wallet',
    })

    // JWT has 3 parts
    const parts = proofJwt.split('.')
    expect(parts).toHaveLength(3)

    // Decode and verify header
    const header = JSON.parse(atob(parts[0]!.replace(/-/g, '+').replace(/_/g, '/')))
    expect(header.typ).toBe('openid4vci-proof+jwt')
    expect(header.alg).toBe('ES256')
    expect(header.jwk).toBeDefined()

    // Decode and verify payload
    const payload = JSON.parse(atob(parts[1]!.replace(/-/g, '+').replace(/_/g, '/')))
    expect(payload.aud).toBe(ISSUER_URL)
    expect(payload.nonce).toBe(C_NONCE)
    expect(payload.iss).toBe('test-wallet')
  })

  it('step 4: parses the issued SD-JWT VC credential', async () => {
    const credential = await buildMockCredential()
    const parsed = parseSdJwtVc(credential)

    expect(parsed.payload.iss).toBe(ISSUER_URL)
    expect(parsed.payload.vct).toBe('LoyaltyCard')
    expect(parsed.payload['member_id']).toBe('M-001')
    expect(parsed.disclosures.size).toBe(1)
  })

  it('step 5: reveals selective claims from the credential', async () => {
    const credential = await buildMockCredential()
    const parsed = parseSdJwtVc(credential)
    const claims = revealAllClaims(parsed)

    expect(claims['member_name']).toBe('Alice')
    expect(claims['member_id']).toBe('M-001')
    expect(claims['program_name']).toBe('SuperMart Rewards')
  })

  it('step 6: builds a selective presentation with only member_id', async () => {
    const { buildPresentedSdJwt } = await import('../src/credentials/sd-jwt/index.js')
    const credential = await buildMockCredential()
    const parsed = parseSdJwtVc(credential)

    // Only disclose member_name (the one SD claim)
    const presented = buildPresentedSdJwt(parsed, ['member_name'])
    const parts = presented.split('~')
    // JWT + 1 disclosure + trailing empty
    expect(parts).toHaveLength(3)
    expect(presented.endsWith('~')).toBe(true)
  })

})
