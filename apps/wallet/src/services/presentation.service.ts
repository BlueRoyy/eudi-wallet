/**
 * OID4VP presentation service — wallet-side.
 *
 * Flow:
 *   1. Parse authorization request (from QR or deep link)
 *   2. Match credentials against presentation definition
 *   3. Build VP with selective disclosure
 *   4. Submit to verifier response_uri
 */
import {
  parseAuthorizationRequest,
  buildSdJwtSubmission,
  submitPresentationResponse,
  parseSdJwtVc,
  buildPresentedSdJwt,
  type AuthorizationRequest,
} from "@eudi-wallet/core"
import { usePresentationStore } from "../store/presentation.store"
import { useWalletStore, type WalletCredential } from "../store/wallet.store"

export class PresentationService {
  /**
   * Parse a presentation request URI and find matching wallet credentials.
   */
  async parseRequest(requestUri: string): Promise<void> {
    const store = usePresentationStore.getState()
    store.setStep("parsing_request")

    try {
      const request = await parseAuthorizationRequest(requestUri)
      store.setRequest(request)

      // Extract verifier display name from client_id
      const verifierName = this.extractVerifierName(request)
      store.setVerifierName(verifierName)

      // Match credentials
      const wallet = useWalletStore.getState()
      const matched = this.matchCredentials(wallet.credentials, request)
      store.setMatched(matched)
      store.setStep("selecting_credentials")
    } catch (err) {
      store.setError(err instanceof Error ? err.message : "Failed to parse request")
      throw err
    }
  }

  /**
   * Submit the presentation with selected credential + disclosed claims.
   */
  async submitPresentation(
    credential: WalletCredential,
    claimsToDisclose: string[],
  ): Promise<void> {
    const store = usePresentationStore.getState()
    const request = store.request
    if (!request) throw new Error("No active presentation request")

    store.setStep("building_response")

    try {
      const parsed = parseSdJwtVc(credential.raw)
      const presented = buildPresentedSdJwt(parsed, claimsToDisclose)

      const definition = request.presentation_definition
      const descriptorId = definition?.input_descriptors[0]?.id ?? "credential"
      const definitionId = definition?.id ?? "request"

      const submission = buildSdJwtSubmission(definitionId, descriptorId)

      await submitPresentationResponse({
        request,
        vpToken: presented,
        submission,
      })

      store.setStep("success")
    } catch (err) {
      store.setError(err instanceof Error ? err.message : "Presentation failed")
      throw err
    }
  }

  private matchCredentials(
    credentials: WalletCredential[],
    request: AuthorizationRequest,
  ): WalletCredential[] {
    const definition = request.presentation_definition
    if (!definition) return credentials.filter((c) => c.status === "valid")

    return credentials.filter((c) => {
      if (c.status !== "valid") return false
      // Match by vct if specified in input_descriptor format
      for (const desc of definition.input_descriptors) {
        const formats = desc.format
        if (!formats) return true // no format constraint — accept any
        if (formats["vc+sd-jwt"] && c.format === "vc+sd-jwt") return true
        if (formats["mso_mdoc"] && c.format === "mso_mdoc") return true
      }
      return false
    })
  }

  private extractVerifierName(request: AuthorizationRequest): string {
    if (request.client_metadata?.client_name) return request.client_metadata.client_name
    try {
      return new URL(request.client_id).hostname
    } catch {
      return request.client_id
    }
  }
}
