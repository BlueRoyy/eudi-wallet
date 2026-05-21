import { useCallback, useRef } from "react"
import { IssuanceService } from "../services/issuance.service"
import { useIssuanceStore } from "../store/issuance.store"
import { NativeKeyManager } from "@eudi-wallet/crypto"
import { NativeSigner } from "@eudi-wallet/crypto"

const keyManager = new NativeKeyManager()
const signer     = new NativeSigner()
const service    = new IssuanceService({ keyManager, signer })

export function useIssuance() {
  const store  = useIssuanceStore()
  const pendingUri = useRef<string | null>(null)

  const startFlow = useCallback(async (offerUri: string) => {
    pendingUri.current = offerUri
    return service.runFlow(offerUri)
  }, [])

  const submitPin = useCallback(async (pin: string) => {
    if (!pendingUri.current) throw new Error("No pending issuance")
    return service.runFlow(pendingUri.current, pin)
  }, [])

  const reset = useCallback(() => {
    pendingUri.current = null
    store.reset()
  }, [store])

  return { ...store, startFlow, submitPin, reset }
}
