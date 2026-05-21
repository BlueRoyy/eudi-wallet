# eudi-wallet

> eIDAS v2 compliant digital wallet for iOS & Android, plus credential issuer tooling.

## Overview

This monorepo contains:

| Package | Description |
|---|---|
| `packages/core` | Pure TypeScript — OID4VCI, OID4VP, SD-JWT VC, mDoc, trust, revocation |
| `packages/crypto` | React Native native bridge — Secure Enclave (iOS) + StrongBox (Android) |
| `packages/issuer-sdk` | Server-side credential issuance — SD-JWT VC + ISO 18013-5 mDL |
| `apps/wallet` | React Native wallet app (iOS + Android) |

## Standards implemented

- **OID4VCI** — OpenID for Verifiable Credential Issuance (pre-auth + auth code flows)
- **OID4VP** — OpenID for Verifiable Presentations (online + proximity)
- **ISO/IEC 18013-5** — mDL (digital driver's licence), mDoc/CBOR/COSE
- **SD-JWT VC** — Selective Disclosure JWT Verifiable Credentials
- **Status List 2021** — Revocation checking (bitstring-based)
- **EUDIW ARF** — EU Digital Identity Wallet Architecture Reference Framework

## Supported credential types

- ISO 18013-5 digital driver's licence (mDL)
- Loyalty cards (SD-JWT VC)
- Airline boarding passes (SD-JWT VC + IATA BCBP)
- Library cards (SD-JWT VC)
- National identity credentials / PID (eIDAS v2)

## Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- For iOS: Xcode 15+, CocoaPods
- For Android: Android Studio, NDK

## Getting started

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Start the wallet app
cd apps/wallet
pnpm start
```

## Architecture

```
┌─────────────────────────────────────────────┐
│             React Native App                │
│  (apps/wallet)                              │
├────────────────┬────────────────────────────┤
│ @eudi-wallet/  │ @eudi-wallet/              │
│ crypto         │ core                       │
│ (native bridge)│ (pure TS protocols)        │
├────────────────┴────────────────────────────┤
│         Platform secure hardware            │
│    iOS Secure Enclave / Android StrongBox   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│         @eudi-wallet/issuer-sdk             │
│   OID4VCI server · SD-JWT VC · mDoc        │
│   Schema registry · Signing interfaces      │
└─────────────────────────────────────────────┘
```

## Roadmap

- [ ] Phase 1 — core package + issuer SDK (current)
- [ ] Phase 2 — OID4VCI issuance flow in wallet app
- [ ] Phase 3 — OID4VP online presentation
- [ ] Phase 4 — ISO 18013-5 proximity (BLE + NFC)
- [ ] Phase 5 — Conformity assessment (EUDIW notified body)

## License

MIT
