/**
 * Issuance Flow Screen
 * Handles the full OID4VCI flow after scanning the credential offer QR.
 * Steps: resolve → (pin?) → token → proof → credential → success
 */
import React, { useEffect, useState } from "react"
import {
  View, Text, StyleSheet, ActivityIndicator, Pressable,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../navigation/types"
import { useIssuance } from "../hooks/useIssuance"
import { PinPad } from "../components/inputs/PinPad"
import { colors, semanticColors, typography, spacing, radius, shadow } from "../theme"

type Props = NativeStackScreenProps<RootStackParamList, "Issuance">

const STEP_LABELS: Record<string, string> = {
  resolving_offer:     "Resolving credential offer…",
  fetching_metadata:   "Connecting to issuer…",
  requesting_token:    "Authenticating…",
  building_proof:      "Generating holder key…",
  requesting_credential: "Requesting credential…",
}

export function IssuanceScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets()
  const { offerUri } = route.params
  const { step, errorMessage, txCodeLength, startFlow, submitPin, reset } = useIssuance()
  const [pinError, setPinError] = useState<string | null>(null)

  useEffect(() => {
    startFlow(offerUri).catch(console.warn)
    return () => { reset() }
  }, [offerUri])

  const handlePin = async (pin: string) => {
    setPinError(null)
    try {
      await submitPin(pin)
    } catch {
      setPinError("Incorrect PIN. Please try again.")
    }
  }

  if (step === "success") {
    return (
      <View style={[styles.center, { paddingBottom: insets.bottom }]}>
        <View style={styles.successIcon} accessibilityRole="image" accessibilityLabel="Success">
          <Text style={styles.successTick}>✓</Text>
        </View>
        <Text style={styles.successTitle}>Credential added!</Text>
        <Text style={styles.successSubtitle}>Your credential has been securely stored in your wallet.</Text>
        <Pressable
          style={styles.doneBtn}
          onPress={() => navigation.navigate("Home")}
          accessibilityRole="button"
          accessibilityLabel="Go to wallet home"
        >
          <Text style={styles.doneBtnText}>View wallet</Text>
        </Pressable>
      </View>
    )
  }

  if (step === "error") {
    return (
      <View style={[styles.center, { paddingBottom: insets.bottom }]}>
        <View style={styles.errorIcon}>
          <Text style={styles.errorX}>✕</Text>
        </View>
        <Text style={styles.errorTitle}>Issuance failed</Text>
        <Text style={styles.errorMessage}>{errorMessage}</Text>
        <Pressable style={styles.retryBtn} onPress={() => navigation.goBack()} accessibilityRole="button">
          <Text style={styles.retryText}>Go back</Text>
        </Pressable>
      </View>
    )
  }

  if (step === "pin_required") {
    return (
      <View style={[styles.center, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Text style={styles.pinTitle}>Enter PIN</Text>
        <Text style={styles.pinSubtitle}>
          The issuer requires a {txCodeLength ?? 6}-digit PIN to complete issuance.
        </Text>
        <PinPad
          length={txCodeLength ?? 6}
          onComplete={handlePin}
          error={pinError}
          onClear={() => setPinError(null)}
        />
      </View>
    )
  }

  // Loading state
  return (
    <View style={[styles.center, { paddingBottom: insets.bottom }]}>
      <ActivityIndicator size="large" color={semanticColors.primary} />
      <Text style={styles.loadingLabel}>
        {STEP_LABELS[step] ?? "Processing…"}
      </Text>
      <View style={styles.steps}>
        {Object.entries(STEP_LABELS).map(([key, label]) => {
          const idx = Object.keys(STEP_LABELS).indexOf(key)
          const cur = Object.keys(STEP_LABELS).indexOf(step)
          return (
            <View key={key} style={styles.stepRow}>
              <View style={[styles.stepDot, idx < cur && styles.stepDone, idx === cur && styles.stepActive]} />
              <Text style={[styles.stepText, idx === cur && styles.stepTextActive]}>{label.replace("…", "")}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  center:          { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing["2xl"], gap: spacing.lg, backgroundColor: semanticColors.background },
  successIcon:     { width: 72, height: 72, borderRadius: 36, backgroundColor: semanticColors.success, justifyContent: "center", alignItems: "center", ...shadow.md },
  successTick:     { fontSize: 32, color: colors.white },
  successTitle:    { ...typography.h2, color: semanticColors.text, textAlign: "center" },
  successSubtitle: { ...typography.body, color: semanticColors.textSecondary, textAlign: "center" },
  doneBtn:         { paddingHorizontal: spacing["2xl"], paddingVertical: spacing.md, backgroundColor: semanticColors.primary, borderRadius: radius.lg },
  doneBtnText:     { ...typography.labelLg, color: colors.white },
  errorIcon:       { width: 72, height: 72, borderRadius: 36, backgroundColor: semanticColors.danger, justifyContent: "center", alignItems: "center" },
  errorX:          { fontSize: 28, color: colors.white },
  errorTitle:      { ...typography.h2, color: semanticColors.text },
  errorMessage:    { ...typography.body, color: semanticColors.textSecondary, textAlign: "center" },
  retryBtn:        { paddingHorizontal: spacing["2xl"], paddingVertical: spacing.md, borderRadius: radius.lg, borderWidth: 1.5, borderColor: semanticColors.border },
  retryText:       { ...typography.labelLg, color: semanticColors.textSecondary },
  loadingLabel:    { ...typography.bodyLg, color: semanticColors.textSecondary, marginTop: spacing.md },
  steps:           { gap: spacing.sm, width: "100%", maxWidth: 280, marginTop: spacing.lg },
  stepRow:         { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  stepDot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: semanticColors.border },
  stepDone:        { backgroundColor: semanticColors.success },
  stepActive:      { backgroundColor: semanticColors.primary, width: 10, height: 10, borderRadius: 5 },
  stepText:        { ...typography.bodySm, color: semanticColors.textSecondary },
  stepTextActive:  { color: semanticColors.text, fontWeight: "600" },
  pinTitle:        { ...typography.h2, color: semanticColors.text },
  pinSubtitle:     { ...typography.body, color: semanticColors.textSecondary, textAlign: "center" },
})
