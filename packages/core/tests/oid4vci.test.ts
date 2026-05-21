import { describe, it, expect } from 'vitest'
import { detectGrantType } from '../src/oid4vci/token.js'
import { parseCredentialOfferUri } from '../src/oid4vci/metadata.js'
import type { CredentialOffer } from '../src/oid4vci/types.js'

describe('OID4VCI grant type detection', () => {
  it('detects pre-authorized_code grant', () => {
    const offer: CredentialOffer = {
      credential_issuer: 'https://issuer.example.com',
      credential_configuration_ids: ['IdentityCredential'],
      grants: {
        'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
          'pre-authorized_code': 'abc123',
        },
      },
    }
    expect(detectGrantType(offer)).toBe('pre-authorized_code')
  })

  it('detects authorization_code grant', () => {
    const offer: CredentialOffer = {
      credential_issuer: 'https://issuer.example.com',
      credential_configuration_ids: ['IdentityCredential'],
      grants: {
        authorization_code: { issuer_state: 'xyz' },
      },
    }
    expect(detectGrantType(offer)).toBe('authorization_code')
  })

  it('returns null when no grants present', () => {
    const offer: CredentialOffer = {
      credential_issuer: 'https://issuer.example.com',
      credential_configuration_ids: ['IdentityCredential'],
    }
    expect(detectGrantType(offer)).toBeNull()
  })
})

describe('Credential offer URI parser', () => {
  it('parses inline credential_offer param', () => {
    const offerObj = { credential_issuer: 'https://issuer.example.com', credential_configuration_ids: ['ID1'] }
    const encoded = encodeURIComponent(JSON.stringify(offerObj))
    const uri = `openid-credential-offer://?credential_offer=${encoded}`
    const { offerObject } = parseCredentialOfferUri(uri)
    expect((offerObject as CredentialOffer).credential_issuer).toBe('https://issuer.example.com')
  })

  it('parses credential_offer_uri param', () => {
    const uri = 'openid-credential-offer://?credential_offer_uri=https%3A%2F%2Fissuer.example.com%2Foffer%2Fabc'
    const { offerUri } = parseCredentialOfferUri(uri)
    expect(offerUri).toBe('https://issuer.example.com/offer/abc')
  })

  it('throws on missing both params', () => {
    expect(() => parseCredentialOfferUri('openid-credential-offer://?foo=bar')).toThrow()
  })
})
