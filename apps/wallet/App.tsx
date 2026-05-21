/**
 * EUDI Wallet — Root Application Component
 *
 * Responsibilities:
 *   1. Biometric gate (if enabled in settings)
 *   2. Deep link / URL scheme handling
 *   3. Render the navigation tree
 */
import React, { useEffect, useState, useCallback } from "react"
import {
  View, Text, Pressable, StyleSheet, Linking, ActivityIndicator,
} from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { RootNavigator } from "./src/navigation/RootNavigator"
import { useWalletStore } from "./src/store/wallet.store"
import { authenticateWithBiometrics, isDeviceCompromised } from "./src/services/biometric.service"
import { colors, semanticColors, typography, spacing, radius } from "./src/theme"

type AppState = "loading" | "locked" | "unlocked" | "compromised"

export default function App() {
  const { settings, loadFromStorage } = useWalletStore()
  const [appState, setAppState] = useState<AppState>("loading")

  const unlock = useCallback(async () => {
    const success = await authenticateWithBiometrics("Unlock your EUDI Wallet")
    if (success) setAppState("unlocked")
  }, [])

  useEffect(() => {
    async function init() {
      // Security check
      if (isDeviceCompromised()) {
        setAppState("compromised")
        return
      }

      await loadFromStorage()

      // Biometric gate
      if (settings.biometricEnabled && settings.requireBiometricOnOpen) {
        const success = await authenticateWithBiometrics("Unlock your EUDI Wallet")
        setAppState(success ? "unlocked" : "locked")
      } else {
        setAppState("unlocked")
      }
    }

    init()
  }, [])

  if (appState === "loading") {
    return (
      <View style={gateStyles.container}>
        <ActivityIndicator size="large" color={semanticColors.primary} />
      </View>
    )
  }

  if (appState === "compromised") {
    return (
      <View style={gateStyles.container}>
        <Text style={gateStyles.warningTitle}>Security warning</Text>
        <Text style={gateStyles.warningBody}>
          This device appears to be rooted or jailbroken. For your security, the wallet cannot open on compromised devices.
        </Text>
      </View>
    )
  }

  if (appState === "locked") {
    return (
      <View style={gateStyles.container}>
        <View style={gateStyles.lockIcon} accessibilityRole="image" accessibilityLabel="Wallet locked">
          <Text style={gateStyles.lockEmoji}>🔒</Text>
        </View>
        <Text style={gateStyles.lockTitle}>EUDI Wallet</Text>
        <Text style={gateStyles.lockSubtitle}>Authenticate to access your credentials</Text>
        <Pressable
          style={gateStyles.unlockBtn}
          onPress={unlock}
          accessibilityRole="button"
          accessibilityLabel="Unlock wallet with biometrics"
        >
          <Text style={gateStyles.unlockText}>Unlock</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const gateStyles = StyleSheet.create({
  container:    { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: semanticColors.background, padding: spacing["2xl"], gap: spacing.lg },
  lockIcon:     { width: 80, height: 80, borderRadius: 40, backgroundColor: semanticColors.surfaceAlt, justifyContent: "center", alignItems: "center" },
  lockEmoji:    { fontSize: 36 },
  lockTitle:    { ...typography.h1, color: semanticColors.text },
  lockSubtitle: { ...typography.body, color: semanticColors.textSecondary, textAlign: "center" },
  unlockBtn:    { paddingHorizontal: spacing["2xl"], paddingVertical: spacing.md, backgroundColor: semanticColors.primary, borderRadius: radius.lg },
  unlockText:   { ...typography.labelLg, color: colors.white },
  warningTitle: { ...typography.h2, color: semanticColors.danger, textAlign: "center" },
  warningBody:  { ...typography.body, color: semanticColors.textSecondary, textAlign: "center" },
})
