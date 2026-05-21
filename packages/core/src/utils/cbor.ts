/**
 * CBOR utility wrappers.
 * Delegates to the `cbor2` library for encoding/decoding.
 */

export async function cborEncode(value: unknown): Promise<Uint8Array> {
  const { encode } = await import('cbor2')
  return encode(value)
}

export async function cborDecode<T = unknown>(bytes: Uint8Array): Promise<T> {
  const { decode } = await import('cbor2')
  return decode(bytes) as T
}
