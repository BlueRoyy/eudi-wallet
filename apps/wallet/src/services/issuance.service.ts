/**
 * OID4VCI issuance service — wallet-side client.
 *
 * Orchestrates the full flow:
 *   1. Resolve credential offer (from QR URI)
 *   2. Fetch issuer metadata
 *   3. Exchange pre-auth code → access token
 *   4. Build holder-binding proof JWT
 *   5. Request credential
 *   6. Parse + store issued credential
 */
import {
  resolveCredentialOffer,
  fetchIssuerMetadata,
  exchangePreAuthorizedCode,
  IssuerClient,
  buildProofJwt,
  type CredentialOffer,
  type CredentialIssuerMetadata,
  type TokenResponse,
} from "@eudi-wallet/core"
import { useIssuanceStore } from "../store/issuance.store"
import { useWalletStore } from "../store/wallet.store"
import { parseRawSdJwtToWalletCredential } from "./credential-storage.service"
import type { KeyManager, Signer } from "@eudi-wallet/core"

export interface IssuanceServiceDeps {
  keyManager: KeyManager
  signer: Signer
}

export class IssuanceService {
  constructor(private readonly deps: IssuanceServiceDeps) {}

  /**
   * Run the full issuance flow from a credential offer URI.
   * Updates the issuance store at each step.
   * Returns the issued credential ID on success.
   */
  async runFlow(offerUri: string, txCode?: string): Promise<string> {
    const store = useIssuanceStore.getState()
    const walletStore = useWalletStore.getState()

    try {
      // ── Step 1: resolve offer ───────────────────────────────────────────
      store.setStep("resolving_offer")
      const offer = await resolveCredentialOffer(offerUri) as CredentialOffer
      store.setOffer(offer)

      // ── Step 2: fetch issuer metadata ───────────────────────────────────
      store.setStep("fetching_metadata")
      const metadata = await fetchIssuerMetadata(offer.credential_issuer)
      store.setMetadata(metadata)

      // ── Step 3: check if tx_code (PIN) required ─────────────────────────
      const preAuthGrant = offer.grants?.["urn:ietf:params:oauth:grant-type:pre-authorized_code"]
      if (!preAuthGrant) throw new Error("Only pre-authorized_code grant supported in this version")

      const requiresPin = !!preAuthGrant.tx_code
      if (requiresPin && !txCode) {
        store.setTxCode(preAuthGrant.tx_code?.length ?? 6)
        store.setStep("pin_required")
        return ""  // caller must re-invoke with txCode
      }

      // ── Step 4: exchange pre-auth code for token ────────────────────────
      store.setStep("requesting_token")
      const tokenEndpoint = metadata.authorization_servers?.[0]
        ? `${metadata.authorization_servers[0]}/token`
        : `${offer.credential_issuer}/token`

      const tokenResponse: TokenResponse = await exchangePreAuthorizedCode({
        tokenEndpoint,
        preAuthorizedCode: preAuthGrant["pre-authorized_code"],
        txCode,
      })
      store.setToken(tokenResponse.access_token, tokenResponse.c_nonce ?? "")

      // ── Step 5: generate or retrieve holder key ─────────────────────────
      store.setStep("building_proof")
      const keyLabel = `holder-key-${offer.credential_issuer}`
      let keyRef = await this.deps.keyManager.getKey(keyLabel)
      if (!keyRef) {
        keyRef = await this.deps.keyManager.generateKey("ES256", keyLabel)
      }

      const proofJwt = await buildProofJwt({
        keyRef,
        signer: this.deps.signer,
        issuerUrl: offer.credential_issuer,
        cNonce: tokenResponse.c_nonce ?? "",
      })

      // ── Step 6: request credential ──────────────────────────────────────
      store.setStep("requesting_credential")
      const configId = offer.credential_configuration_ids[0]
      if (!configId) throw new Error("No credential_configuration_id in offer")

      const config = metadata.credential_configurations_supported[configId]
      if (!config) throw new Error(`Unknown credential configuration: ${configId}`)

      const client = new IssuerClient({ metadata, tokenResponse })
      const credentialResponse = await client.requestCredential({
        format: config.format,
        ...(config.vct ? { vct: config.vct } : {}),
        ...(config.doctype ? { doctype: config.doctype } : {}),
        proof: { proof_type: "jwt", jwt: proofJwt },
      })

      if (!credentialResponse.credential) {
        throw new Error("Issuer returned no credential")
      }

      // ── Step 7: parse + store ───────────────────────────────────────────
      const displayName = config.display?.[0]?.name ?? configId
      const walletCred = parseRawSdJwtToWalletCredential(
        credentialResponse.credential,
        offer.credential_issuer,
        configId,
        displayName,
        keyRef.keyId,
      )

      await walletStore.addCredential(walletCred)
      store.setStep("success")
      return walletCred.id

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Issuance failed"
      store.setError(msg)
      throw err
    }
  }
}
