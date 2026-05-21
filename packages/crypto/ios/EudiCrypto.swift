import Foundation
import CryptoKit
import LocalAuthentication
import React

/**
 * iOS Secure Enclave bridge — generates and uses hardware-backed EC P-256 keys.
 * Registered as "EudiCrypto" in the React Native NativeModules registry.
 */
@objc(EudiCrypto)
class EudiCrypto: NSObject {

  @objc
  func generateKey(_ algorithm: String, label: String,
                   resolve: @escaping RCTPromiseResolveBlock,
                   reject: @escaping RCTPromiseRejectBlock) {
    do {
      let key = try SecureEnclave.P256.Signing.PrivateKey(
        accessControl: SecAccessControl.create(
          kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
          flags: [.biometryCurrentSet, .privateKeyUsage]
        )!
      )
      // Store the data representation tagged with the label
      let keyData = key.dataRepresentation
      UserDefaults.standard.set(keyData, forKey: "eudi_key_\(label)")

      let pubKeyB64 = key.publicKey.rawRepresentation.base64EncodedString()
        .replacingOccurrences(of: "+", with: "-")
        .replacingOccurrences(of: "/", with: "_")
        .replacingOccurrences(of: "=", with: "")

      resolve([
        "keyId": label,
        "algorithm": "ES256",
        "isHardwareBacked": true,
        "publicKeyB64": pubKeyB64
      ])
    } catch {
      reject("KEYGEN_ERROR", error.localizedDescription, error)
    }
  }

  @objc
  func sign(_ keyId: String, dataB64: String,
            resolve: @escaping RCTPromiseResolveBlock,
            reject: @escaping RCTPromiseRejectBlock) {
    guard
      let storedData = UserDefaults.standard.data(forKey: "eudi_key_\(keyId)"),
      let key = try? SecureEnclave.P256.Signing.PrivateKey(dataRepresentation: storedData)
    else {
      reject("KEY_NOT_FOUND", "Key '\(keyId)' not found", nil); return
    }

    guard let data = Data(base64Encoded: dataB64
      .replacingOccurrences(of: "-", with: "+")
      .replacingOccurrences(of: "_", with: "/")
      .padding(toLength: ((dataB64.count + 3) / 4) * 4, withPad: "=", startingAt: 0))
    else { reject("INVALID_INPUT", "Invalid base64url data", nil); return }

    do {
      let signature = try key.signature(for: data)
      let sigB64 = signature.rawRepresentation.base64EncodedString()
        .replacingOccurrences(of: "+", with: "-")
        .replacingOccurrences(of: "/", with: "_")
        .replacingOccurrences(of: "=", with: "")
      resolve(sigB64)
    } catch {
      reject("SIGN_ERROR", error.localizedDescription, error)
    }
  }

  @objc
  static func requiresMainQueueSetup() -> Bool { false }
}
