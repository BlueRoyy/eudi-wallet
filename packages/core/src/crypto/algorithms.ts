import type { KeyAlgorithm } from './types.js'

export const SUPPORTED_ALGORITHMS: readonly KeyAlgorithm[] = ['ES256', 'ES384', 'ES512', 'EdDSA']

export const ALGORITHM_CURVE_MAP: Record<KeyAlgorithm, string> = {
  ES256: 'P-256',
  ES384: 'P-384',
  ES512: 'P-521',
  EdDSA: 'Ed25519',
}

export function isSupported(alg: string): alg is KeyAlgorithm {
  return SUPPORTED_ALGORITHMS.includes(alg as KeyAlgorithm)
}
