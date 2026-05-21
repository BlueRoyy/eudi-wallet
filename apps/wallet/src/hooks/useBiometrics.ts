import { useState, useCallback, useEffect } from "react"
import {
  getBiometricCapabilities,
  authenticateWithBiometrics,
  type BiometricCapabilities,
} from "../services/biometric.service"

export function useBiometrics() {
  const [capabilities, setCapabilities] = useState<BiometricCapabilities>({
    available: false,
    biometryType: "none",
  })

  useEffect(() => {
    getBiometricCapabilities().then(setCapabilities)
  }, [])

  const authenticate = useCallback(
    (prompt?: string) => authenticateWithBiometrics(prompt),
    []
  )

  return { capabilities, authenticate }
}
