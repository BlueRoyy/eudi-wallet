/**
 * QR Scan Screen
 * Handles both:
 *   - openid-credential-offer://  → issuance flow
 *   - openid4vp://                → presentation flow
 */
import React, { useCallback, useEffect, useState } from "react"
import {
  View, Text, StyleSheet, Pressable, Linking, Alert,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../navigation/types"
import { colors, semanticColors, typography, spacing, radius, shadow } from "../theme"

type Props = NativeStackScreenProps<RootStackParamList, "Scan">

type ScanMode = "idle" | "scanning" | "processing" | "error"

export function ScanScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  const [mode, setMode] = useState<ScanMode>("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleUri = useCallback((uri: string) => {
    const trimmed = uri.trim()

    if (trimmed.startsWith("openid-credential-offer://")) {
      navigation.replace("Issuance", { offerUri: trimmed })
      return
    }

    if (trimmed.startsWith("openid4vp://") || trimmed.startsWith("haip://")) {
      navigation.replace("Present", { requestUri: trimmed })
      return
    }

    // Unknown URI — show error
    setErrorMsg(`Unrecognised QR code format.

Expected an openid-credential-offer:// or openid4vp:// URI.`)
    setMode("error")
  }, [navigation])

  // Handle deep links (for testing via URL schemes)
  useEffect(() => {
    const sub = Linking.addEventListener("url", (e) => handleUri(e.url))
    return () => sub.remove()
  }, [handleUri])

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Nav bar */}
      <View style={[styles.navBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close scanner">
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
        <Text style={styles.navTitle}>Scan QR Code</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Scanner viewport */}
      <View style={styles.viewport}>
        {/* Viewfinder overlay */}
        <View style={styles.viewfinder}>
          <ViewfinderCorner position="topLeft" />
          <ViewfinderCorner position="topRight" />
          <ViewfinderCorner position="bottomLeft" />
          <ViewfinderCorner position="bottomRight" />
        </View>

        {/* Scanning line animation placeholder */}
        <View style={styles.scanLine} />
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>
          {mode === "error" ? "Scan failed" : "Point camera at QR code"}
        </Text>
        <Text style={styles.instructionBody}>
          {mode === "error"
            ? errorMsg
            : "Compatible with eIDAS credential offers and presentation requests from any conforming service."}
        </Text>

        {mode === "error" && (
          <Pressable
            style={styles.retryBtn}
            onPress={() => { setMode("idle"); setErrorMsg(null) }}
            accessibilityRole="button"
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        )}
      </View>

      {/* Manual entry for testing */}
      <View style={styles.footer}>
        <Text style={styles.footerHint}>
          Camera integration requires a physical device.{"
"}
          Use react-native-vision-camera in production.
        </Text>
        <Pressable
          style={styles.testBtn}
          onPress={() => {
            // Demo: pretend we scanned a loyalty card offer
            handleUri(`openid-credential-offer://?credential_offer_uri=${encodeURIComponent("http://localhost:3000/offer/demo")}`)
          }}
          accessibilityRole="button"
          accessibilityLabel="Load demo credential offer"
        >
          <Text style={styles.testBtnText}>Load demo offer</Text>
        </Pressable>
      </View>
    </View>
  )
}

function ViewfinderCorner({ position }: { position: "topLeft"|"topRight"|"bottomLeft"|"bottomRight" }) {
  const cornerStyles: Record<string, object> = {
    topLeft:     { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
    topRight:    { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
    bottomLeft:  { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
    bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  }
  return (
    <View style={[vcStyles.corner, cornerStyles[position]!]} />
  )
}

const vcStyles = StyleSheet.create({
  corner: { position: "absolute", width: 24, height: 24, borderColor: colors.white },
})

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.black },
  navBar:           { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.base, paddingBottom: spacing.sm },
  closeBtn:         { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  closeBtnText:     { color: colors.white, fontSize: 18 },
  navTitle:         { ...typography.labelLg, color: colors.white },
  viewport:         { flex: 1, justifyContent: "center", alignItems: "center", position: "relative" },
  viewfinder:       { width: 260, height: 260, position: "relative" },
  scanLine:         { position: "absolute", width: 260, height: 2, backgroundColor: colors.blue400, opacity: 0.8 },
  instructions:     { backgroundColor: colors.gray900, padding: spacing.xl, gap: spacing.sm },
  instructionTitle: { ...typography.h3, color: colors.white, textAlign: "center" },
  instructionBody:  { ...typography.body, color: colors.gray400, textAlign: "center" },
  retryBtn:         { marginTop: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, backgroundColor: semanticColors.primary, borderRadius: radius.lg, alignSelf: "center" },
  retryText:        { ...typography.labelLg, color: colors.white },
  footer:           { padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.gray900, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.gray800 },
  footerHint:       { ...typography.caption, color: colors.gray500, textAlign: "center" },
  testBtn:          { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.gray600, alignSelf: "center" },
  testBtnText:      { ...typography.label, color: colors.gray400 },
})
