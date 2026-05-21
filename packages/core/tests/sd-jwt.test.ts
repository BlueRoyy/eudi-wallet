import { describe, it, expect } from 'vitest'
import { parseSdJwtVc, revealAllClaims, buildPresentedSdJwt, listDisclosableClaims } from '../src/credentials/sd-jwt/index.js'

// Minimal test SD-JWT (header.payload~disclosure1~disclosure2~)
// Disclosures are base64url(["salt","claim_name","claim_value"])
const encDisc1 = btoa(JSON.stringify(['salt1', 'given_name', 'Alice'])).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'')
const encDisc2 = btoa(JSON.stringify(['salt2', 'birth_date', '1990-01-01'])).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'')

const header = btoa(JSON.stringify({ alg: 'ES256', typ: 'vc+sd-jwt' })).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'')
const payload = btoa(JSON.stringify({
  iss: 'https://issuer.example.com',
  vct: 'IdentityCredential',
  iat: 1700000000,
  _sd: ['digest1', 'digest2'],
  _sd_alg: 'sha-256'
})).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'')

const sig = btoa('fakesig').replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'')
const testJwt = `${header}.${payload}.${sig}~${encDisc1}~${encDisc2}~`

describe('SD-JWT VC parser', () => {
  it('parses a valid SD-JWT', () => {
    const parsed = parseSdJwtVc(testJwt)
    expect(parsed.payload.iss).toBe('https://issuer.example.com')
    expect(parsed.payload.vct).toBe('IdentityCredential')
    expect(parsed.disclosures.size).toBe(2)
  })

  it('lists disclosable claims', () => {
    const parsed = parseSdJwtVc(testJwt)
    const claims = listDisclosableClaims(parsed)
    expect(claims).toContain('given_name')
    expect(claims).toContain('birth_date')
  })

  it('reveals all claims', () => {
    const parsed = parseSdJwtVc(testJwt)
    const claims = revealAllClaims(parsed)
    expect(claims['given_name']).toBe('Alice')
    expect(claims['birth_date']).toBe('1990-01-01')
  })

  it('builds a selective presentation with one claim', () => {
    const parsed = parseSdJwtVc(testJwt)
    const presented = buildPresentedSdJwt(parsed, ['given_name'])
    const parts = presented.split('~')
    expect(parts).toHaveLength(3)  // JWT + 1 disclosure + trailing empty
    expect(presented.endsWith('~')).toBe(true)
  })

  it('throws when disclosing a non-existent claim', () => {
    const parsed = parseSdJwtVc(testJwt)
    expect(() => buildPresentedSdJwt(parsed, ['nonexistent'])).toThrow()
  })
})
