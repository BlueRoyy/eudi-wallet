export interface Oid4VciServerConfig {
  issuerUrl: string
  credentialEndpoint: string
  tokenEndpoint: string
  credentialConfigurations: Record<string, SupportedCredentialConfig>
}

export interface SupportedCredentialConfig {
  format: 'vc+sd-jwt' | 'mso_mdoc'
  vct?: string
  doctype?: string
  display?: Array<{ name: string; locale?: string; background_color?: string; text_color?: string }>
}
