/**
 * Biometric authentication service.
 * Wraps react-native-biometrics with a clean async API.
 */
import ReactNativeBiometrics, { BiometryTypes } from "react-native-biometrics"

const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true })

export interface BiometricCapabilities {
  available: boolean
  biometryType: "FaceID" | "TouchID" | "Biometrics" | "none"
}

export async function getBiometricCapabilities(): Promise<BiometricCapabilities> {
  try {
    const { available, biometryType } = await rnBiometrics.isSensorAvailable()
    return {
      available,
      biometryType: (biometryType as BiometricCapabilities["biometryType"]) ?? "none",
    }
  } catch {
    return { available: false, biometryType: "none" }
  }
}

export async function authenticateWithBiometrics(
  promptMessage = "Authenticate to access your wallet",
): Promise<boolean> {
  try {
    const { success } = await rnBiometrics.simplePrompt({ promptMessage })
    return success
  } catch {
    return false
  }
}

export async function biometricSign(
  payload: string,
  promptMessage = "Sign with biometrics to present credential",
): Promise<string | null> {
  try {
    const { success, signature } = await rnBiometrics.createSignature({
      promptMessage,
      payload,
    })
    return success ? (signature ?? null) : null
  } catch {
    return null
  }
}

/** Check if device is potentially rooted/jailbroken (basic heuristic) */
export function isDeviceCompromised(): boolean {
  // Production: integrate with a proper root/jailbreak detection library
  // e.g. react-native-jail-monkey or similar
  return false
}
