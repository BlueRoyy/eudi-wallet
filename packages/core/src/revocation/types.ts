/** Revocation status check result */
export interface RevocationStatus {
  isRevoked: boolean
  checkedAt: string
  reason?: string
}

/** Status List 2021 JWT payload */
export interface StatusListJwtPayload {
  iss: string
  iat: number
  exp?: number
  statusPurpose: 'revocation' | 'suspension'
  encodedList: string
}
