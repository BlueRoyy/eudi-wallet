/**
 * Maps raw subject data → OID4VCI credential claims.
 *
 * For each credential type:
 *   - fixedClaims   — always present in the JWT payload (not selectively disclosed)
 *   - selectiveClaims — wrapped in SD-JWT disclosures (user can choose which to reveal)
 */
import type { SelectiveDisclosureClaim } from "@eudi-wallet/issuer-sdk"

export interface BuiltClaims {
  fixedClaims: Record<string, unknown>
  selectiveClaims: SelectiveDisclosureClaim[]
}

export function buildCredentialClaims(
  credentialConfigurationId: string,
  subjectData: Record<string, unknown>,
  holderPublicKeyJwk: JsonWebKey,
): BuiltClaims {
  // Holder key binding — always fixed (not selectively disclosable)
  const cnf = { jwk: holderPublicKeyJwk }

  const now     = Math.floor(Date.now() / 1000)
  const oneYear = now + 365 * 24 * 60 * 60

  switch (credentialConfigurationId) {

    case "LoyaltyCard": {
      const d = subjectData as {
        member_name?: string; member_id?: string; program_name?: string
        tier?: string; points?: number; expiry_date?: string; issuing_org?: string
      }
      return {
        fixedClaims: { cnf, iat: now, exp: oneYear, member_id: d.member_id, program_name: d.program_name, issuing_org: d.issuing_org },
        selectiveClaims: [
          ...(d.member_name ? [{ name: "member_name", value: d.member_name }] : []),
          ...(d.tier        ? [{ name: "tier",        value: d.tier        }] : []),
          ...(d.points !== undefined ? [{ name: "points", value: d.points }] : []),
          ...(d.expiry_date ? [{ name: "expiry_date", value: d.expiry_date }] : []),
        ],
      }
    }

    case "LibraryCard": {
      const d = subjectData as {
        member_id?: string; member_name?: string; library_name?: string
        expiry_date?: string; branch?: string
      }
      return {
        fixedClaims: { cnf, iat: now, exp: oneYear, member_id: d.member_id, library_name: d.library_name },
        selectiveClaims: [
          ...(d.member_name  ? [{ name: "member_name",  value: d.member_name  }] : []),
          ...(d.branch       ? [{ name: "branch",       value: d.branch       }] : []),
          ...(d.expiry_date  ? [{ name: "expiry_date",  value: d.expiry_date  }] : []),
        ],
      }
    }

    case "AirlineTicket": {
      const d = subjectData as {
        passenger_name?: string; flight_number?: string; departure_date?: string
        origin?: string; destination?: string; seat?: string
        booking_reference?: string; gate?: string
      }
      return {
        fixedClaims: {
          cnf, iat: now,
          exp: now + 24 * 60 * 60,    // boarding passes expire in 24 hours
          flight_number:  d.flight_number,
          departure_date: d.departure_date,
          origin:         d.origin,
          destination:    d.destination,
        },
        selectiveClaims: [
          ...(d.passenger_name    ? [{ name: "passenger_name",    value: d.passenger_name    }] : []),
          ...(d.seat              ? [{ name: "seat",              value: d.seat              }] : []),
          ...(d.booking_reference ? [{ name: "booking_reference", value: d.booking_reference }] : []),
          ...(d.gate              ? [{ name: "gate",              value: d.gate              }] : []),
        ],
      }
    }

    default:
      // Passthrough — treat all subject_data as fixed claims
      return {
        fixedClaims: { cnf, iat: now, exp: oneYear, ...subjectData },
        selectiveClaims: [],
      }
  }
}
