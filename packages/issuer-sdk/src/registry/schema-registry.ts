export interface CredentialSchema {
  id: string
  name: string
  format: 'vc+sd-jwt' | 'mso_mdoc'
  doctype?: string
  vct?: string
  requiredClaims: string[]
  optionalClaims: string[]
  selectiveClaims: string[]
}

const registry = new Map<string, CredentialSchema>()

export function registerSchema(schema: CredentialSchema): void { registry.set(schema.id, schema) }
export function getSchema(id: string): CredentialSchema | null { return registry.get(id) ?? null }
export function listSchemas(): CredentialSchema[] { return Array.from(registry.values()) }

registerSchema({ id: 'org.iso.18013.5.1.mDL', name: 'ISO 18013-5 mDL', format: 'mso_mdoc', doctype: 'org.iso.18013.5.1.mDL', requiredClaims: ['family_name','given_name','birth_date','expiry_date','issuing_country','document_number'], optionalClaims: ['portrait','driving_privileges','sex','height','nationality'], selectiveClaims: ['birth_date','sex','height','age_over_18','age_over_21'] })
registerSchema({ id: 'LoyaltyCard', name: 'Loyalty card', format: 'vc+sd-jwt', vct: 'LoyaltyCard', requiredClaims: ['member_id','program_name','issuing_org'], optionalClaims: ['tier','points','expiry_date'], selectiveClaims: ['member_name','tier','points'] })
registerSchema({ id: 'AirlineTicket', name: 'Airline boarding pass', format: 'vc+sd-jwt', vct: 'AirlineTicket', requiredClaims: ['passenger_name','flight_number','departure_date','origin','destination'], optionalClaims: ['seat','class','booking_reference','gate'], selectiveClaims: ['passenger_name','seat','class'] })
registerSchema({ id: 'LibraryCard', name: 'Library card', format: 'vc+sd-jwt', vct: 'LibraryCard', requiredClaims: ['member_id','library_name'], optionalClaims: ['member_name','expiry_date','branch'], selectiveClaims: ['member_name'] })
