/**
 * Credential storage service.
 * All credential data is encrypted at rest via react-native-encrypted-storage.
 * The store is the source of truth — this service handles persistence.
 */
import EncryptedStorage from "react-native-encrypted-storage"
import type { WalletCredential } from "../store/wallet.store"
import {
  parseSdJwtVc,
  revealAllClaims,
  type StoredCredential,
} from "@eudi-wallet/core"
import { formatDistanceToNow, parseISO } from "date-fns"

const CRED_KEY = "eudi_credentials_v1"

export async function loadCredentials(): Promise<WalletCredential[]> {
  try {
    const raw = await EncryptedStorage.getItem(CRED_KEY)
    return raw ? (JSON.parse(raw) as WalletCredential[]) : []
  } catch {
    return []
  }
}

export async function saveCredentials(credentials: WalletCredential[]): Promise<void> {
  await EncryptedStorage.setItem(CRED_KEY, JSON.stringify(credentials))
}

/**
 * Convert a raw SD-JWT VC string into a WalletCredential ready for storage.
 */
export function parseRawSdJwtToWalletCredential(
  raw: string,
  issuerUrl: string,
  configId: string,
  displayName: string,
  holderKeyId?: string,
): WalletCredential {
  const parsed   = parseSdJwtVc(raw)
  const allClaims = revealAllClaims(parsed)

  // Build expiry / issuedAt from JWT claims
  const iat = parsed.payload.iat
  const exp = parsed.payload.exp
  const issuedAt  = iat ? new Date(iat * 1000).toISOString()  : new Date().toISOString()
  const expiresAt = exp ? new Date(exp * 1000).toISOString()  : undefined

  // Determine status
  const now = Date.now()
  const status = exp && now > exp * 1000 ? "expired" : "valid"

  // Build preview claims (top 3 most interesting ones for card display)
  const skipKeys = new Set(["iss","iat","exp","vct","_sd","_sd_alg","cnf","status","jti"])
  const previewClaims: Record<string, string> = {}
  let count = 0
  for (const [k, v] of Object.entries(allClaims)) {
    if (skipKeys.has(k) || count >= 4) continue
    previewClaims[k] = String(v ?? "")
    count++
  }

  return {
    id:           crypto.randomUUID(),
    format:       "vc+sd-jwt",
    raw,
    issuer:       issuerUrl,
    type:         parsed.payload.vct ?? configId,
    displayName,
    issuedAt,
    expiresAt,
    displayClaims: allClaims,
    holderKeyId,
    // wallet-specific
    status,
    addedAt:      new Date().toISOString(),
    pinned:       false,
    previewClaims,
  }
}

export function getCredentialAge(credential: WalletCredential): string {
  try {
    return formatDistanceToNow(parseISO(credential.addedAt), { addSuffix: true })
  } catch {
    return ""
  }
}

export function isCredentialExpiringSoon(credential: WalletCredential, daysThreshold = 30): boolean {
  if (!credential.expiresAt) return false
  const expiryMs = parseISO(credential.expiresAt).getTime()
  const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000
  return expiryMs - Date.now() < thresholdMs && expiryMs > Date.now()
}
