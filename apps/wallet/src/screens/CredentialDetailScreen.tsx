/**
 * Credential Detail Screen
 * Full view of a single credential with all claims, trust info, and actions.
 */
import React, { useMemo, useCallback, useState } from "react"
import {
  View, Text, ScrollView, Pressable, StyleSheet, Alert,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../navigation/types"
import { useWalletStore } from "../store/wallet.store"
import { CredentialCard } from "../components/cards/CredentialCard"
import { TrustBadge } from "../components/cards/TrustBadge"
import {
  colors, semanticColors, typography, spacing, radius, shadow,
} from "../theme"
import { parseSdJwtVc, revealAllClaims } from "@eudi-wallet/core"
import { format, parseISO } from "date-fns"

type Props = NativeStackScreenProps<RootStackParamList, "CredentialDetail">

const HIDDEN_KEYS = new Set(["iss","iat","exp","vct","_sd","_sd_alg","cnf","status","jti","sub"])

export function CredentialDetailScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets()
  const { credentialId } = route.params
  const { credentials, removeCredential, pinCredential } = useWalletStore()
  const credential = credentials.find((c) => c.id === credentialId)
  const [showRaw, setShowRaw] = useState(false)

  const claims = useMemo(() => {
    if (!credential) return {}
    try {
      const parsed = parseSdJwtVc(credential.raw)
      const all = revealAllClaims(parsed)
      return Object.fromEntries(Object.entries(all).filter(([k]) => !HIDDEN_KEYS.has(k)))
    } catch {
      return credential.displayClaims
    }
  }, [credential])

  const handleDelete = useCallback(() => {
    Alert.alert(
      "Remove credential",
      `Are you sure you want to remove "${credential?.displayName}" from your wallet? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove", style: "destructive",
          onPress: async () => {
            if (credential) {
              await removeCredential(credential.id)
              navigation.goBack()
            }
          },
        },
      ]
    )
  }, [credential, removeCredential, navigation])

  if (!credential) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Credential not found</Text>
      </View>
    )
  }

  const expiryDate  = credential.expiresAt ? format(parseISO(credential.expiresAt), "d MMMM yyyy") : "No expiry"
  const issuedDate  = format(parseISO(credential.issuedAt), "d MMMM yyyy")
  const trustLevel  = credential.type.includes("mDL") || credential.type.includes("PID") ? "high" : "substantial"

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Go back" style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Pressable
          onPress={() => pinCredential(credential.id, !credential.pinned)}
          accessibilityRole="button"
          accessibilityLabel={credential.pinned ? "Unpin credential" : "Pin credential"}
          style={styles.pinBtn}
        >
          <Text style={styles.pinText}>{credential.pinned ? "★" : "☆"}</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing["2xl"] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Card preview */}
        <View style={styles.cardWrap}>
          <CredentialCard credential={credential} />
        </View>

        {/* Status + trust */}
        <View style={styles.metaRow}>
          <StatusPill status={credential.status} />
          <TrustBadge level={trustLevel} showLabel />
        </View>

        {/* Dates */}
        <InfoSection title="Validity">
          <InfoRow label="Issued" value={issuedDate} />
          <InfoRow label="Expires" value={expiryDate} />
          {credential.lastVerified && (
            <InfoRow label="Last checked" value={format(parseISO(credential.lastVerified), "d MMM yyyy HH:mm")} />
          )}
        </InfoSection>

        {/* Issuer */}
        <InfoSection title="Issuer">
          <InfoRow label="URL" value={credential.issuer} mono />
        </InfoSection>

        {/* Claims */}
        <InfoSection title="Credential data">
          {Object.entries(claims).map(([key, value]) => (
            <InfoRow key={key} label={formatKey(key)} value={String(value ?? "—")} />
          ))}
        </InfoSection>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={styles.presentBtn}
            onPress={() => navigation.navigate("Present", { credentialId: credential.id })}
            accessibilityRole="button"
            accessibilityLabel="Present this credential"
          >
            <Text style={styles.presentBtnText}>Present credential</Text>
          </Pressable>

          <Pressable
            onPress={() => setShowRaw((v) => !v)}
            style={styles.rawToggle}
            accessibilityRole="button"
          >
            <Text style={styles.rawToggleText}>{showRaw ? "Hide raw JWT" : "Show raw JWT"}</Text>
          </Pressable>

          {showRaw && (
            <ScrollView horizontal style={styles.rawContainer} showsHorizontalScrollIndicator>
              <Text style={styles.rawText} selectable accessibilityLabel="Raw JWT credential data">
                {credential.raw}
              </Text>
            </ScrollView>
          )}

          <Pressable
            onPress={handleDelete}
            style={styles.deleteBtn}
            accessibilityRole="button"
            accessibilityLabel="Delete this credential"
          >
            <Text style={styles.deleteBtnText}>Remove from wallet</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  )
}

function StatusPill({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; color: string }> = {
    valid:   { label: "Valid",   bg: colors.green500 + "20", color: colors.green700 },
    expired: { label: "Expired", bg: colors.amber500 + "20", color: colors.amber500 },
    revoked: { label: "Revoked", bg: colors.red500   + "20", color: colors.red600 },
    pending: { label: "Pending", bg: colors.gray200,          color: colors.gray600 },
  }
  const c = config[status] ?? config["pending"]!
  return (
    <View style={[pillStyles.pill, { backgroundColor: c.bg }]}>
      <Text style={[pillStyles.text, { color: c.color }]}>{c.label}</Text>
    </View>
  )
}
const pillStyles = StyleSheet.create({
  pill: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill },
  text: { ...typography.label },
})

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.container}>
      <Text style={sectionStyles.title} accessibilityRole="header">{title}</Text>
      <View style={sectionStyles.card}>{children}</View>
    </View>
  )
}
const sectionStyles = StyleSheet.create({
  container: { marginHorizontal: spacing.base, marginBottom: spacing.base },
  title:     { ...typography.label, color: semanticColors.textSecondary, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: spacing.sm },
  card:      { backgroundColor: semanticColors.surface, borderRadius: radius.lg, overflow: "hidden", ...shadow.sm },
})

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={[rowStyles.value, mono && rowStyles.mono]} selectable numberOfLines={2}>
        {value}
      </Text>
    </View>
  )
}
const rowStyles = StyleSheet.create({
  row:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: semanticColors.border },
  label: { ...typography.bodySm, color: semanticColors.textSecondary, flex: 1 },
  value: { ...typography.bodySm, color: semanticColors.text, flex: 2, textAlign: "right" },
  mono:  { fontFamily: "monospace", fontSize: 11 },
})

function formatKey(k: string) {
  return k.replace(/_/g, " ").replace(/\w/g, (c) => c.toUpperCase())
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: semanticColors.background },
  navBar:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  backBtn:        { padding: spacing.sm },
  backText:       { ...typography.bodyLg, color: semanticColors.primary },
  pinBtn:         { padding: spacing.sm },
  pinText:        { fontSize: 22, color: colors.gold500 },
  scroll:         { flex: 1 },
  cardWrap:       { alignItems: "center", paddingHorizontal: spacing.base, marginVertical: spacing.lg },
  metaRow:        { flexDirection: "row", gap: spacing.md, marginHorizontal: spacing.base, marginBottom: spacing.md },
  actions:        { marginHorizontal: spacing.base, gap: spacing.sm, marginTop: spacing.sm },
  presentBtn:     { backgroundColor: semanticColors.primary, paddingVertical: spacing.md, borderRadius: radius.lg, alignItems: "center" },
  presentBtnText: { ...typography.labelLg, color: colors.white },
  rawToggle:      { alignItems: "center", paddingVertical: spacing.md },
  rawToggleText:  { ...typography.bodySm, color: semanticColors.textSecondary },
  rawContainer:   { backgroundColor: colors.gray900, borderRadius: radius.md, padding: spacing.sm, maxHeight: 160 },
  rawText:        { ...typography.mono, color: colors.green400, fontSize: 11 },
  deleteBtn:      { paddingVertical: spacing.md, alignItems: "center", marginTop: spacing.sm },
  deleteBtnText:  { ...typography.labelLg, color: semanticColors.danger },
  notFound:       { flex: 1, justifyContent: "center", alignItems: "center" },
  notFoundText:   { ...typography.body, color: semanticColors.textSecondary },
})
