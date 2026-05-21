/**
 * Transient presentation (OID4VP) flow state.
 */
import { create } from "zustand"
import type { AuthorizationRequest, PresentationDefinition } from "@eudi-wallet/core"
import type { WalletCredential } from "./wallet.store"

export type PresentationStep =
  | "idle"
  | "parsing_request"
  | "selecting_credentials"
  | "consent"
  | "building_response"
  | "success"
  | "error"

interface PresentationState {
  step: PresentationStep
  request: AuthorizationRequest | null
  definition: PresentationDefinition | null
  matchedCredentials: WalletCredential[]
  selectedCredential: WalletCredential | null
  claimsToDisclose: string[]
  errorMessage: string | null
  verifierName: string | null
  // Actions
  setStep: (step: PresentationStep) => void
  setRequest: (req: AuthorizationRequest) => void
  setMatched: (creds: WalletCredential[]) => void
  selectCredential: (cred: WalletCredential) => void
  toggleClaim: (claim: string) => void
  setVerifierName: (name: string) => void
  setError: (msg: string) => void
  reset: () => void
}

export const usePresentationStore = create<PresentationState>((set, get) => ({
  step: "idle",
  request: null,
  definition: null,
  matchedCredentials: [],
  selectedCredential: null,
  claimsToDisclose: [],
  errorMessage: null,
  verifierName: null,

  setStep:        (step) => set({ step }),
  setRequest:     (request) => set({ request }),
  setMatched:     (matchedCredentials) => set({ matchedCredentials }),
  selectCredential: (cred) => set({ selectedCredential: cred, claimsToDisclose: [] }),
  toggleClaim: (claim) => {
    const current = get().claimsToDisclose
    set({ claimsToDisclose: current.includes(claim) ? current.filter((c) => c !== claim) : [...current, claim] })
  },
  setVerifierName: (verifierName) => set({ verifierName }),
  setError:       (errorMessage) => set({ step: "error", errorMessage }),
  reset: () => set({ step: "idle", request: null, definition: null, matchedCredentials: [], selectedCredential: null, claimsToDisclose: [], errorMessage: null, verifierName: null }),
}))
