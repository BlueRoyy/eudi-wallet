/** Encode Uint8Array to base64url string */
export function base64urlEncode(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/** Decode base64url string to Uint8Array */
export function base64urlDecode(input: string): Uint8Array {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

/** Encode a UTF-8 string to base64url */
export function base64urlEncodeString(str: string): string {
  return base64urlEncode(new TextEncoder().encode(str))
}

/** Decode a base64url string to UTF-8 */
export function base64urlDecodeString(input: string): string {
  return new TextDecoder().decode(base64urlDecode(input))
}
