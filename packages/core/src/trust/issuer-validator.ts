import type { TrustValidationResult } from './types.js'
import type { TrustListClient } from './trust-list.js'

export interface IssuerValidatorOptions {
  trustListClient: TrustListClient
  /** Allow issuers not in the trust list (dev/test only) */
  allowUntrusted?: boolean
}

/** Validate that a credential issuer is trusted */
export async function validateIssuer(
  issuerUrl: string,
  credentialType: string,
  opts: IssuerValidatorOptions,
): Promise<TrustValidationResult> {
  if (opts.allowUntrusted) {
    return { isTrusted: true, reason: 'Trust validation bypassed (dev mode)' }
  }

  try {
    const trusted = await opts.trustListClient.findIssuer(issuerUrl)
    if (!trusted) {
      return { isTrusted: false, reason: `Issuer ${issuerUrl} not found in trust list` }
    }

    if (!trusted.credentialTypes.includes(credentialType) && !trusted.credentialTypes.includes('*')) {
      return {
        isTrusted: false,
        reason: `Issuer ${issuerUrl} is not trusted for credential type ${credentialType}`,
      }
    }

    return { isTrusted: true, issuer: trusted }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { isTrusted: false, reason: `Trust validation error: ${message}` }
  }
}
