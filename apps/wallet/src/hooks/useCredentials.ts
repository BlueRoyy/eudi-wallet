import { useMemo } from "react"
import { useWalletStore, type WalletCredential } from "../store/wallet.store"
import { isCredentialExpiringSoon } from "../services/credential-storage.service"

export function useCredentials() {
  const store = useWalletStore()

  const expiringSoon = useMemo(
    () => store.credentials.filter((c) => isCredentialExpiringSoon(c, 30)),
    [store.credentials]
  )

  const byType = useMemo(() => {
    const map = new Map<string, WalletCredential[]>()
    for (const cred of store.credentials) {
      const list = map.get(cred.type) ?? []
      list.push(cred)
      map.set(cred.type, list)
    }
    return map
  }, [store.credentials])

  return {
    credentials: store.credentials,
    pinned: store.credentials.filter((c) => c.pinned),
    expiringSoon,
    byType,
    removeCredential: store.removeCredential,
    pinCredential: store.pinCredential,
  }
}
