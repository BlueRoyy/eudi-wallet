/**
 * @eudi-wallet/crypto
 *
 * React Native native module — bridges to platform secure hardware:
 *   iOS  → Secure Enclave via CryptoKit + LocalAuthentication
 *   Android → Android Keystore backed by StrongBox
 *
 * This module exports a concrete KeyManager and Signer that satisfy
 * the interfaces defined in @eudi-wallet/core.
 *
 * The NativeModule is registered in:
 *   android/src/main/java/.../EudiCryptoModule.kt
 *   ios/EudiCrypto.swift
 */

export { NativeKeyManager } from './native-key-manager.js'
export { NativeSigner } from './native-signer.js'
