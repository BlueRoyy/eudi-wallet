/**
 * Present Screen — handles OID4VP presentation flow.
 * Triggered by: openid4vp:// deep link or from credential detail screen.
 */
import React, { useEffect, useState } from "react"
import {
  View, Text, Modal, StyleSheet, Pressable, ActivityIndicator,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../navigation/types"
import { usePresentation } from "../hooks/usePresentation"
import { useWalletStore } from "../store/wallet.store"
import { SelectiveDisclosureSheet } from "../components/sheets/SelectiveDisclosureSheet"
import { CredentialCard } from "../components/cards/CredentialCard"
import { colors, semanticColors, typography, spacing, radius } from "../theme"
import { listDisclosableClaims, parseSdJwtVc } from "@eudi-wallet/core"

type Props = NativeStackScreenProps<RootStackParamList, "Present">

export function PresentScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets()
  const { credentialId, requestUri } = route.params ?? {}
  const { credentials } = useWalletStore()
  const {
    step, verifierName, matchedCredentials, selectedCredential,
    claimsToDisclose, errorMessage,
    parseRequest, selectCredential, toggleClaim, submit, reset,
  } = usePresentation()

  const [showConsent, setShowConsent] = useState(false)

  useEffect(() => {
    if (requestUri) {
      parseRequest(requestUri).catch(console.warn)
    } else if (credentialId) {
      // Direct presentation from credential detail — use that credential
      const cred = credentials.find((c) => c.id === credentialId)
      if (cred) {
        selectCredential(cred)
        setShowConsent(true)
      }
    }
    return () => reset()
  }, [requestUri, credentialId])

  const handleConfirm = async () => {
    if (!selectedCredential) return
    setShowConsent(false)
    try {
      await submit(selectedCredential, claimsToDisclose)
    } catch (e) {
      console.warn(e)
    }
  }

  const disclosableClaims = selectedCredential ? (() => {
    try {
      const p = parseSdJwtVc(selectedCredential.raw)
      return listDisclosableClaims(p)
    } catch { return [] }
  })() : []

  if (step === "success") {
    return (
      <View style={[styles.center, { paddingBottom: insets.bottom }]}>
        <View style={styles.successIcon}>
          <Text style={styles.successTick}>✓</Text>
        </View>
        <Text style={styles.successTitle}>Presentation complete</Text>
        <Text style={styles.successSub}>Your credential was shared with {verifierName ?? "the verifier"}.</Text>
        <Pressable style={styles.doneBtn} onPress={() => navigation.navigate("Home")} accessibilityRole="button">
          <Text style={styles.doneBtnText}>Done</Text>
        </Pressable>
      </View>
    )
  }

  if (step === "error") {
    return (
      <View style={[styles.center, { paddingBottom: insets.bottom }]}>
        <Text style={styles.errorTitle}>Presentation failed</Text>
        <Text style={styles.errorMsg}>{errorMessage}</Text>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} accessibilityRole="button">
          <Text style={styles.backBtnText}>Go back</Text>
        </Pressable>
      </View>
    )
  }

  if (step === "parsing_request" || step === "building_response") {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={semanticColors.primary} />
        <Text style={styles.loadingText}>{step === "parsing_request" ? "Reading request…" : "Preparing response…"}</Text>
      </View>
    )
  }

  if (step === "selecting_credentials" || (credentialId && selectedCredential)) {
    const cred = selectedCredential ?? matchedCredentials[0]
    if (!cred) {
      return (
        <View style={styles.center}>
          <Text style={styles.noMatchTitle}>No matching credentials</Text>
          <Text style={styles.noMatchSub}>Your wallet does not contain a credential matching this request.</Text>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Go back</Text>
          </Pressable>
        </View>
      )
    }

    if (!showConsent) {
      return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <Text style={styles.pageTitle} accessibilityRole="header">Credential request</Text>
          <Text style={styles.pageSubtitle}>
            <Text style={{ fontWeight: "600" }}>{verifierName ?? "A service"}</Text> wants to verify your identity
          </Text>
          <View style={{ paddingHorizontal: spacing.base, marginTop: spacing.md }}>
            <CredentialCard credential={cred} onPress={() => { selectCredential(cred); setShowConsent(true) }} />
          </View>
          <Pressable
            style={styles.reviewBtn}
            onPress={() => { selectCredential(cred); setShowConsent(true) }}
            accessibilityRole="button"
          >
            <Text style={styles.reviewBtnText}>Review & share</Text>
          </Pressable>
          <Pressable style={styles.cancelBtn} onPress={() => navigation.goBack()} accessibilityRole="button">
            <Text style={styles.cancelText}>Decline</Text>
          </Pressable>
        </View>
      )
    }

    return (
      <Modal visible={showConsent} animationType="slide" presentationStyle="pageSheet">
        <SelectiveDisclosureSheet
          credential={cred}
          verifierName={verifierName ?? "Unknown service"}
          requiredClaims={[]}
          optionalClaims={disclosableClaims}
          selectedClaims={claimsToDisclose}
          onToggleClaim={toggleClaim}
          onConfirm={handleConfirm}
          onCancel={() => setShowConsent(false)}
        />
      </Modal>
    )
  }

  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={semanticColors.primary} />
    </View>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: semanticColors.background },
  center:       { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing["2xl"], gap: spacing.lg, backgroundColor: semanticColors.background },
  pageTitle:    { ...typography.h2, color: semanticColors.text, textAlign: "center", marginTop: spacing.xl },
  pageSubtitle: { ...typography.body, color: semanticColors.textSecondary, textAlign: "center", marginTop: spacing.sm, paddingHorizontal: spacing.xl },
  reviewBtn:    { marginHorizontal: spacing.lg, marginTop: spacing.xl, paddingVertical: spacing.md, backgroundColor: semanticColors.primary, borderRadius: radius.lg, alignItems: "center" },
  reviewBtnText:{ ...typography.labelLg, color: colors.white },
  cancelBtn:    { marginTop: spacing.sm, paddingVertical: spacing.md, alignItems: "center" },
  cancelText:   { ...typography.body, color: semanticColors.textSecondary },
  successIcon:  { width: 72, height: 72, borderRadius: 36, backgroundColor: semanticColors.success, justifyContent: "center", alignItems: "center" },
  successTick:  { fontSize: 32, color: colors.white },
  successTitle: { ...typography.h2, color: semanticColors.text },
  successSub:   { ...typography.body, color: semanticColors.textSecondary, textAlign: "center" },
  doneBtn:      { paddingHorizontal: spacing["2xl"], paddingVertical: spacing.md, backgroundColor: semanticColors.primary, borderRadius: radius.lg },
  doneBtnText:  { ...typography.labelLg, color: colors.white },
  errorTitle:   { ...typography.h3, color: semanticColors.danger },
  errorMsg:     { ...typography.body, color: semanticColors.textSecondary, textAlign: "center" },
  backBtn:      { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.lg, borderWidth: 1.5, borderColor: semanticColors.border },
  backBtnText:  { ...typography.labelLg, color: semanticColors.textSecondary },
  noMatchTitle: { ...typography.h3, color: semanticColors.text },
  noMatchSub:   { ...typography.body, color: semanticColors.textSecondary, textAlign: "center" },
  loadingText:  { ...typography.body, color: semanticColors.textSecondary, marginTop: spacing.md },
})
