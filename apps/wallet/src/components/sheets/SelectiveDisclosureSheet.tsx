/**
 * Selective Disclosure Consent Sheet.
 *
 * Shown before presenting a credential. Lets the user:
 *   - See which verifier is requesting data
 *   - See exactly which claims will be shared
 *   - Toggle optional claims on/off
 *   - Review what stays private
 *   - Confirm or cancel
 *
 * GDPR Article 7 / eIDAS 2 Art. 5a compliance: explicit, granular consent.
 */
import React, { useCallback } from "react"
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Switch,
} from "react-native"
import {
  colors, semanticColors, typography, spacing, radius, shadow,
} from "../../theme"
import { TrustBadge } from "../cards/TrustBadge"
import type { WalletCredential } from "../../store/wallet.store"
import { parseSdJwtVc, listDisclosableClaims, revealAllClaims } from "@eudi-wallet/core"

interface Props {
  credential: WalletCredential
  verifierName: string
  requiredClaims: string[]       // from presentation definition
  optionalClaims: string[]       // user can toggle
  selectedClaims: string[]
  onToggleClaim: (claim: string) => void
  onConfirm: () => void
  onCancel: () => void
}

function formatClaimName(key: string): string {
  return key.replace(/_/g, " ").replace(/\w/g, (c) => c.toUpperCase())
}

export function SelectiveDisclosureSheet({
  credential,
  verifierName,
  requiredClaims,
  optionalClaims,
  selectedClaims,
  onToggleClaim,
  onConfirm,
  onCancel,
}: Props) {
  let allClaims: Record<string, unknown> = {}
  try {
    const parsed = parseSdJwtVc(credential.raw)
    allClaims = revealAllClaims(parsed)
  } catch { /* show raw displayClaims */ allClaims = credential.displayClaims }

  const totalShared = requiredClaims.length + selectedClaims.filter((c) => optionalClaims.includes(c)).length

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.handle} />
        <Text style={styles.title} accessibilityRole="header">Share credentials</Text>
        <Text style={styles.subtitle}>
          <Text style={styles.bold}>{verifierName}</Text> is requesting the following information
        </Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Credential being presented */}
        <View style={styles.credRow}>
          <View style={styles.credIcon}>
            <Text style={styles.credIconText}>{credential.displayName.charAt(0)}</Text>
          </View>
          <View style={styles.credInfo}>
            <Text style={styles.credName}>{credential.displayName}</Text>
            <TrustBadge level="substantial" showLabel />
          </View>
        </View>

        {/* Required claims */}
        {requiredClaims.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel} accessibilityRole="header">
              Required ({requiredClaims.length})
            </Text>
            {requiredClaims.map((claim) => (
              <ClaimRow
                key={claim}
                name={formatClaimName(claim)}
                value={String(allClaims[claim] ?? "—")}
                required
                selected
              />
            ))}
          </View>
        )}

        {/* Optional claims */}
        {optionalClaims.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel} accessibilityRole="header">
              Optional — you choose
            </Text>
            {optionalClaims.map((claim) => (
              <ClaimRow
                key={claim}
                name={formatClaimName(claim)}
                value={String(allClaims[claim] ?? "—")}
                selected={selectedClaims.includes(claim)}
                onToggle={() => onToggleClaim(claim)}
              />
            ))}
          </View>
        )}

        {/* Privacy notice */}
        <View style={styles.privacyNotice}>
          <Text style={styles.privacyText}>
            You are sharing {totalShared} item{totalShared !== 1 ? "s" : ""}. The remaining{" "}
            {Object.keys(allClaims).length - totalShared} fields stay private.{"
"}
            You can revoke access at any time from Settings.
          </Text>
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Pressable
          onPress={onCancel}
          style={styles.cancelBtn}
          accessibilityRole="button"
          accessibilityLabel="Cancel — do not share"
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={onConfirm}
          style={styles.confirmBtn}
          accessibilityRole="button"
          accessibilityLabel={`Share ${totalShared} items with ${verifierName}`}
        >
          <Text style={styles.confirmText}>Share {totalShared} item{totalShared !== 1 ? "s" : ""}</Text>
        </Pressable>
      </View>
    </View>
  )
}

interface ClaimRowProps {
  name: string; value: string; required?: boolean; selected?: boolean; onToggle?: () => void
}

function ClaimRow({ name, value, required, selected, onToggle }: ClaimRowProps) {
  return (
    <View style={claimStyles.row}>
      <View style={claimStyles.info}>
        <Text style={claimStyles.name}>{name}</Text>
        <Text style={claimStyles.value} numberOfLines={1}>{selected ? value : "••••••"}</Text>
      </View>
      {required ? (
        <View style={claimStyles.requiredBadge}>
          <Text style={claimStyles.requiredText}>Required</Text>
        </View>
      ) : (
        <Switch
          value={selected}
          onValueChange={onToggle}
          trackColor={{ false: colors.gray200, true: semanticColors.primary }}
          thumbColor={colors.white}
          accessibilityLabel={`${selected ? "Hide" : "Share"} ${name}`}
        />
      )}
    </View>
  )
}

const claimStyles = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: semanticColors.border,
  },
  info:          { flex: 1 },
  name:          { ...typography.labelLg, color: semanticColors.text },
  value:         { ...typography.bodySm, color: semanticColors.textSecondary, marginTop: 2 },
  requiredBadge: {
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    backgroundColor: colors.blue50, borderRadius: radius.sm,
  },
  requiredText:  { ...typography.labelSm, color: semanticColors.primary },
})

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: semanticColors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  header:        { alignItems: "center", padding: spacing.lg, paddingTop: spacing.md },
  handle:        { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.gray200, marginBottom: spacing.md },
  title:         { ...typography.h2, color: semanticColors.text },
  subtitle:      { ...typography.body, color: semanticColors.textSecondary, textAlign: "center", marginTop: spacing.xs },
  bold:          { fontWeight: "600", color: semanticColors.text },
  scroll:        { flex: 1, paddingHorizontal: spacing.lg },
  credRow:       { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md },
  credIcon:      { width: 44, height: 44, borderRadius: radius.md, backgroundColor: semanticColors.primary, justifyContent: "center", alignItems: "center" },
  credIconText:  { ...typography.h3, color: colors.white },
  credInfo:      { flex: 1, gap: 4 },
  credName:      { ...typography.labelLg, color: semanticColors.text },
  section:       { marginTop: spacing.md },
  sectionLabel:  { ...typography.label, color: semanticColors.textSecondary, marginBottom: spacing.sm, textTransform: "uppercase", letterSpacing: 0.8 },
  privacyNotice: { margin: spacing.base, padding: spacing.md, backgroundColor: colors.blue50, borderRadius: radius.md, marginBottom: spacing["2xl"] },
  privacyText:   { ...typography.caption, color: colors.blue800, lineHeight: 18 },
  actions:       { flexDirection: "row", gap: spacing.md, padding: spacing.lg, paddingBottom: spacing["2xl"] },
  cancelBtn:     { flex: 1, paddingVertical: spacing.md, borderRadius: radius.lg, borderWidth: 1.5, borderColor: semanticColors.border, alignItems: "center" },
  cancelText:    { ...typography.labelLg, color: semanticColors.textSecondary },
  confirmBtn:    { flex: 2, paddingVertical: spacing.md, borderRadius: radius.lg, backgroundColor: semanticColors.primary, alignItems: "center" },
  confirmText:   { ...typography.labelLg, color: colors.white },
})
