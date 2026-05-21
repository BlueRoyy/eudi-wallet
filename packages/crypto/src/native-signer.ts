import type { SecureKeyRef, Signer } from '@eudi-wallet/core'
import { base64urlDecode, base64urlEncode } from '@eudi-wallet/core'

export class NativeSigner implements Signer {
  private getNativeModule() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { NativeModules } = require('react-native') as any
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!NativeModules.EudiCrypto) {
      throw new Error('EudiCrypto native module not linked.')
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return NativeModules.EudiCrypto
  }

  async sign(keyRef: SecureKeyRef, data: Uint8Array): Promise<Uint8Array> {
    const dataB64 = base64urlEncode(data)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const sigB64 = await this.getNativeModule().sign(keyRef.keyId, dataB64) as string
    return base64urlDecode(sigB64)
  }
}
