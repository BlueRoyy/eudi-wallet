export interface IssuerConfig {
  port: number
  issuerUrl: string
  preAuthCodeTtl: number
  accessTokenTtl: number
  nonceTtl: number
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}

export function loadConfig(): IssuerConfig {
  return {
    port: parseInt(process.env['PORT'] ?? '3000', 10),
    issuerUrl: process.env['ISSUER_URL'] ?? 'http://localhost:3000',
    preAuthCodeTtl: parseInt(process.env['PRE_AUTH_CODE_TTL'] ?? '300', 10),
    accessTokenTtl: parseInt(process.env['ACCESS_TOKEN_TTL'] ?? '300', 10),
    nonceTtl: parseInt(process.env['NONCE_TTL'] ?? '300', 10),
    logLevel: (process.env['LOG_LEVEL'] ?? 'info') as IssuerConfig['logLevel'],
  }
}

export const config = loadConfig()
