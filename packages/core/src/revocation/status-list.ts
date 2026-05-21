/**
 * Status List 2021 revocation check.
 * Spec: https://www.w3.org/TR/vc-status-list/
 *
 * The status list is a GZIP-compressed bitstring encoded in base64url.
 * Each credential has an index into this bitstring — if the bit is 1, the credential is revoked.
 */

import type { RevocationStatus, StatusListJwtPayload } from './types.js'

const statusListCache = new Map<string, { payload: StatusListJwtPayload; fetchedAt: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Check the revocation status of a credential.
 * @param statusListUri - URI of the Status List JWT
 * @param statusListIndex - Index of this credential in the bitstring
 */
export async function checkRevocationStatus(
  statusListUri: string,
  statusListIndex: number,
): Promise<RevocationStatus> {
  try {
    const payload = await fetchStatusList(statusListUri)
    const isRevoked = await checkBit(payload.encodedList, statusListIndex)

    return {
      isRevoked,
      checkedAt: new Date().toISOString(),
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      isRevoked: false,
      checkedAt: new Date().toISOString(),
      reason: `Status check failed: ${message} — treating as valid`,
    }
  }
}

/** Fetch and cache the Status List JWT */
async function fetchStatusList(uri: string): Promise<StatusListJwtPayload> {
  const cached = statusListCache.get(uri)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.payload
  }

  const res = await fetch(uri, { headers: { Accept: 'application/statuslist+jwt' } })
  if (!res.ok) throw new Error(`Failed to fetch status list: ${res.status}`)

  const jwt = await res.text()
  const payloadB64 = jwt.split('.')[1]
  if (!payloadB64) throw new Error('Invalid status list JWT')

  const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))) as StatusListJwtPayload
  statusListCache.set(uri, { payload, fetchedAt: Date.now() })
  return payload
}

/**
 * Check a specific bit in the GZIP-compressed base64url-encoded bitstring.
 * Bit = 1 means revoked.
 */
async function checkBit(encodedList: string, index: number): Promise<boolean> {
  // Decode base64url
  const base64 = encodedList.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const compressed = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))

  // Decompress using DecompressionStream (available in modern runtimes)
  const ds = new DecompressionStream('gzip')
  const writer = ds.writable.getWriter()
  const reader = ds.readable.getReader()

  await writer.write(compressed)
  await writer.close()

  const chunks: Uint8Array[] = []
  let done = false
  while (!done) {
    const result = await reader.read()
    done = result.done
    if (result.value) chunks.push(result.value)
  }

  const bitstring = new Uint8Array(chunks.reduce((acc, c) => acc + c.length, 0))
  let offset = 0
  for (const chunk of chunks) {
    bitstring.set(chunk, offset)
    offset += chunk.length
  }

  // Extract the bit at the given index
  const byteIndex = Math.floor(index / 8)
  const bitIndex = 7 - (index % 8)
  const byte = bitstring[byteIndex] ?? 0
  return ((byte >> bitIndex) & 1) === 1
}
