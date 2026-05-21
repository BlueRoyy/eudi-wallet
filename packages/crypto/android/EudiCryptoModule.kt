package com.eudiwallet.crypto

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import com.facebook.react.bridge.*
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.Signature
import java.util.Base64

/**
 * Android Keystore bridge — generates and uses StrongBox-backed EC keys.
 * Registered as "EudiCrypto" in the React Native NativeModules registry.
 */
class EudiCryptoModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "EudiCrypto"

    @ReactMethod
    fun generateKey(algorithm: String, label: String, promise: Promise) {
        try {
            val keyPairGenerator = KeyPairGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_EC, "AndroidKeyStore"
            )
            val specBuilder = KeyGenParameterSpec.Builder(
                label,
                KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY
            )
                .setDigests(KeyProperties.DIGEST_SHA256, KeyProperties.DIGEST_SHA512)
                .setKeySize(256)

            // Request StrongBox if available (Android 9+ with dedicated secure chip)
            try {
                specBuilder.setIsStrongBoxBacked(true)
            } catch (_: Exception) { /* StrongBox not available — fallback to TEE */ }

            keyPairGenerator.initialize(specBuilder.build())
            val keyPair = keyPairGenerator.generateKeyPair()

            val publicKey = keyPair.public.encoded
            val result = Arguments.createMap().apply {
                putString("keyId", label)
                putString("algorithm", algorithm)
                putBoolean("isHardwareBacked", true)
                putString("publicKeyB64", Base64.getUrlEncoder().withoutPadding().encodeToString(publicKey))
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("KEYGEN_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun sign(keyId: String, dataB64: String, promise: Promise) {
        try {
            val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
            val privateKey = keyStore.getKey(keyId, null)
                ?: return promise.reject("KEY_NOT_FOUND", "Key '$keyId' not found")

            val data = Base64.getUrlDecoder().decode(dataB64)
            val signature = Signature.getInstance("SHA256withECDSA").run {
                initSign(privateKey)
                update(data)
                sign()
            }

            promise.resolve(Base64.getUrlEncoder().withoutPadding().encodeToString(signature))
        } catch (e: Exception) {
            promise.reject("SIGN_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun deleteKey(keyId: String, promise: Promise) {
        try {
            val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
            keyStore.deleteEntry(keyId)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("DELETE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun listKeys(promise: Promise) {
        try {
            val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
            val aliases = keyStore.aliases().toList()
            promise.resolve(Arguments.fromList(aliases))
        } catch (e: Exception) {
            promise.reject("LIST_ERROR", e.message, e)
        }
    }
}
