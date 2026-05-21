/** Base error class for all eudi-wallet errors */
export class EudiWalletError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'EudiWalletError'
  }
}

export class CredentialIssuanceError extends EudiWalletError {
  constructor(message: string, cause?: unknown) {
    super(message, 'CREDENTIAL_ISSUANCE_ERROR', cause)
    this.name = 'CredentialIssuanceError'
  }
}

export class CredentialPresentationError extends EudiWalletError {
  constructor(message: string, cause?: unknown) {
    super(message, 'CREDENTIAL_PRESENTATION_ERROR', cause)
    this.name = 'CredentialPresentationError'
  }
}

export class TrustValidationError extends EudiWalletError {
  constructor(message: string, cause?: unknown) {
    super(message, 'TRUST_VALIDATION_ERROR', cause)
    this.name = 'TrustValidationError'
  }
}

export class CryptoError extends EudiWalletError {
  constructor(message: string, cause?: unknown) {
    super(message, 'CRYPTO_ERROR', cause)
    this.name = 'CryptoError'
  }
}
