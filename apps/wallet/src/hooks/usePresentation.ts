import { useCallback } from "react"
import { PresentationService } from "../services/presentation.service"
import { usePresentationStore } from "../store/presentation.store"
import type { WalletCredential } from "../store/wallet.store"

const service = new PresentationService()

export function usePresentation() {
  const store = usePresentationStore()

  const parseRequest = useCallback(
    (uri: string) => service.parseRequest(uri),
    []
  )

  const submit = useCallback(
    (credential: WalletCredential, claims: string[]) =>
      service.submitPresentation(credential, claims),
    []
  )

  return { ...store, parseRequest, submit }
}
