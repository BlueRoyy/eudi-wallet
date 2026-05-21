export const LOYALTY_VCT = 'LoyaltyCard' as const

export interface LoyaltyCardClaims {
  member_name: string
  member_id: string
  program_name: string
  tier?: string
  points?: number
  expiry_date?: string
  issuing_org: string
}

export const LOYALTY_SELECTIVE_CLAIMS: (keyof LoyaltyCardClaims)[] = ['member_name', 'tier', 'points']
