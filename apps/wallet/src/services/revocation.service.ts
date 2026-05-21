/**
 * Background revocation checker.
 * Checks all wallet credentials against their status lists.
 */
import { checkRevocationStatus, parseSdJwtVc } from "@eudi-wallet/core"
import { useWalletStore } from "../store/wallet.store"

export async function checkAllCredentialsRevocation(): Promise<void> {
  const { credentials, updateCredentialStatus } = useWalletStore.getState()

  for (const cred of credentials) {
    if (cred.format !== "vc+sd-jwt") continue

    try {
      const parsed = parseSdJwtVc(cred.raw)
      const statusRef = parsed.payload.status

      if (!statusRef?.status_list) {
        // Check expiry at minimum
        const exp = parsed.payload.exp
        if (exp && Date.now() > exp * 1000) {
          await updateCredentialStatus(cred.id, "expired")
        }
        continue
      }

      const result = await checkRevocationStatus(
        statusRef.status_list.uri,
        statusRef.status_list.idx,
      )

      if (result.isRevoked) {
        await updateCredentialStatus(cred.id, "revoked")
      } else {
        // Check expiry
        const exp = parsed.payload.exp
        const newStatus = exp && Date.now() > exp * 1000 ? "expired" : "valid"
        await updateCredentialStatus(cred.id, newStatus)
      }
    } catch {
      // Non-fatal — keep existing status
    }
  }
}
