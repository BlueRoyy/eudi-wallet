/**
 * Transient issuance flow state.
 * Tracks the multi-step OID4VCI flow: scan → offer → pin? → token → credential.
 */
import { create } from "zustand"
import type { CredentialOffer, CredentialIssuerMetadata } from "@eudi-wallet/core"

export type IssuanceStep =
  | "idle"
  | "resolving_offer"
  | "fetching_metadata"
  | "pin_required"
  | "requesting_token"
  | "building_proof"
  | "requesting_credential"
  | "success"
  | "error"

interface IssuanceState {
  step: IssuanceStep
  offer: CredentialOffer | null
  metadata: CredentialIssuerMetadata | null
  accessToken: string | null
  cNonce: string | null
  errorMessage: string | null
  txCodeLength: number | null
  // Actions
  setStep: (step: IssuanceStep) => void
  setOffer: (offer: CredentialOffer) => void
  setMetadata: (metadata: CredentialIssuerMetadata) => void
  setToken: (token: string, nonce: string) => void
  setTxCode: (length: number) => void
  setError: (msg: string) => void
  reset: () => void
}

export const useIssuanceStore = create<IssuanceState>((set) => ({
  step: "idle",
  offer: null,
  metadata: null,
  accessToken: null,
  cNonce: null,
  errorMessage: null,
  txCodeLength: null,

  setStep:     (step)            => set({ step }),
  setOffer:    (offer)           => set({ offer }),
  setMetadata: (metadata)        => set({ metadata }),
  setToken:    (accessToken, cNonce) => set({ accessToken, cNonce }),
  setTxCode:   (txCodeLength)    => set({ txCodeLength }),
  setError:    (errorMessage)    => set({ step: "error", errorMessage }),
  reset: () => set({ step: "idle", offer: null, metadata: null, accessToken: null, cNonce: null, errorMessage: null, txCodeLength: null }),
}))
