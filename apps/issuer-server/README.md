# @eudi-wallet/issuer-server

OID4VCI-compliant credential issuer server — reference implementation.

## Supported credential types

| Type | Format | VCT / doctype |
|---|---|---|
| Loyalty Card | SD-JWT VC | `LoyaltyCard` |
| Library Card | SD-JWT VC | `LibraryCard` |
| Airline Boarding Pass | SD-JWT VC | `AirlineTicket` |

## Quick start

```bash
cp .env.example .env
# Edit .env if needed (defaults work for dev)

pnpm install
pnpm dev
```

Server starts at `http://localhost:3000`.

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/.well-known/openid-credential-issuer` | Issuer metadata (wallet discovery) |
| `POST` | `/offer` | Create credential offer (admin/backend call) |
| `GET` | `/offer/:id` | Fetch credential offer object (wallet scans QR) |
| `POST` | `/token` | Exchange pre-auth code for access token |
| `POST` | `/credential` | Issue credential (requires Bearer token + proof) |
| `GET` | `/status/:id` | Status List 2021 (revocation check) |
| `GET` | `/health` | Health check |

## Example: issue a loyalty card

```bash
# 1. Create a credential offer
curl -s -X POST http://localhost:3000/offer \
  -H "Content-Type: application/json" \
  -d '{
    "credential_configuration_id": "LoyaltyCard",
    "subject_data": {
      "member_name": "Alice Smith",
      "member_id": "M-12345",
      "program_name": "SuperMart Rewards",
      "tier": "Gold",
      "points": 2500,
      "issuing_org": "SuperMart Ltd",
      "expiry_date": "2026-12-31"
    }
  }'

# 2. The response includes:
#    - offer_uri  — embed this in a QR code; wallet scans it
#    - qr_data    — same as offer_uri
#
# The wallet then:
#   GET  /offer/:id            → resolves the offer
#   POST /token                → exchanges pre-auth code for access_token + c_nonce
#   POST /credential           → presents proof JWT + receives SD-JWT VC
```

## Production checklist

- [ ] Replace `devSigningKey` with HSM/KMS-backed key (`SIGNING_PRIVATE_KEY_PEM`)
- [ ] Replace in-memory stores with Redis or PostgreSQL
- [ ] Add mTLS or API key auth on the `/offer` admin endpoint  
- [ ] Implement real revocation logic in `/status/:id`
- [ ] Add rate limiting on `/token` and `/credential`
- [ ] Register issuer in the EU Trust List
