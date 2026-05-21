import type { KeyAlgorithm, KeyManager, SecureKeyRef } from '@eudi-wallet/core'

/**
 * Concrete KeyManager backed by the React Native native module.
 * The native module (EudiCrypto) must be linked before use.
 */
export class NativeKeyManager implements KeyManager {
  private getNativeModule() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { NativeModules } = require('react-native') as any
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!NativeModules.EudiCrypto) {
      throw new Error('EudiCrypto native module not linked. Run pod install / gradle sync.')
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return NativeModules.EudiCrypto
  }

  async generateKey(algorithm: KeyAlgorithm, label: string): Promise<SecureKeyRef> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.getNativeModule().generateKey(algorithm, label) as Promise<SecureKeyRef>
  }

  async getKey(keyId: string): Promise<SecureKeyRef | null> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.getNativeModule().getKey(keyId) as Promise<SecureKeyRef | null>
  }

  async deleteKey(keyId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.getNativeModule().deleteKey(keyId) as Promise<void>
  }

  async listKeys(): Promise<string[]> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.getNativeModule().listKeys() as Promise<string[]>
  }
}
