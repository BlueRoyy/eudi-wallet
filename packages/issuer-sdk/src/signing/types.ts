export interface IssuerSigningKey {
  keyId: string
  algorithm: 'ES256' | 'ES384' | 'ES512' | 'EdDSA'
  publicKeyJwk: JsonWebKey
  sign(data: Uint8Array): Promise<Uint8Array>
}

export interface IssuerKeySet {
  keys: IssuerSigningKey[]
  getCurrentKey(): IssuerSigningKey
  getKey(keyId: string): IssuerSigningKey | null
}
