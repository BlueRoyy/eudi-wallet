/**
 * CredentialCard — the primary UI element representing a stored credential.
 *
 * Visual design:
 *   - Credit-card aspect ratio (3.375 × 2.125 inches → 85.6 × 54mm)
 *   - Gradient background keyed to credential type
 *   - eIDAS trust level badge (top-right)
 *   - Holder name + credential type chip
 *   - Expiry indicator (bottom-right)
 *   - Subtle animated shimmer on "pending" status
 */
import React, { memo } from "react"
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  AccessibilityInfo,
} from "react-native"
import LinearGradient from "react-native-linear-gradient"
import { colors, cardGradients, semanticColors, typography, spacing, radius, shadow } from "../../theme"
import { TrustBadge } from "./TrustBadge"
import type { WalletCredential } from "../../store/wallet.store"
import { format, parseISO } from "date-fns"

const CARD_WIDTH  = Dimensions.get("window").width - spacing.base * 2
const CARD_HEIGHT = CARD_WIDTH * (54 / 85.6)   // ISO 7810 ID-1 ratio

function getGradient(type: string): [string, string] {
  if (type.includes("mDL") || type.includes("18013"))       return cardGradients.mDL
  if (type.includes("Loyalty") || type.includes("loyalty")) return cardGradients.loyalty
  if (type.includes("Library") || type.includes("library")) return cardGradients.library
  if (type.includes("Airline") || type.includes("airline")) return cardGradients.airline
  if (type.includes("PID")    || type.includes("identity")) return cardGradients.identity
  return cardGradients.generic
}

function getTrustLevel(credential: WalletCredential): "high" | "substantial" | "low" {
  if (credential.type.includes("mDL") || credential.type.includes("PID")) return "high"
  if (credential.issuer.startsWith("https://")) return "substantial"
  return "low"
}

function getStatusColor(status: WalletCredential["status"]): string {
  switch (status) {
    case "valid":   return semanticColors.statusValid
    case "expired": return semanticColors.statusExpired
    case "revoked": return semanticColors.statusRevoked
    default:        return semanticColors.statusPending
  }
}

interface CredentialCardProps {
  credential: WalletCredential
  onPress?: () => void
  compact?: boolean
  accessibilityHint?: string
}

export const CredentialCard = memo(function CredentialCard({
  credential,
  onPress,
  compact = false,
  accessibilityHint,
}: CredentialCardProps) {
  const gradient = getGradient(credential.type)
  const trustLevel = getTrustLevel(credential)
  const height = compact ? CARD_HEIGHT * 0.72 : CARD_HEIGHT

  const expiryLabel = credential.expiresAt
    ? format(parseISO(credential.expiresAt), "MM/yy")
    : null

  const preview = Object.entries(credential.previewClaims).slice(0, 2)

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${credential.displayName} credential`}
      accessibilityHint={accessibilityHint ?? "Tap to view details"}
      accessibilityState={{ disabled: credential.status === "revoked" }}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { height }, shadow.card]}
      >
        {/* Top row: chip + trust badge */}
        <View style={styles.topRow}>
          {/* SIM-card chip decoration */}
          <View style={styles.chip}>
            <View style={styles.chipInner} />
          </View>
          <TrustBadge level={trustLevel} />
        </View>

        {/* Middle: primary claim preview */}
        <View style={styles.middle}>
          {preview.map(([key, value]) => (
            <Text key={key} style={styles.claimValue} numberOfLines={1}>
              {value}
            </Text>
          ))}
        </View>

        {/* Bottom row: credential name + expiry + status */}
        <View style={styles.bottomRow}>
          <View style={styles.bottomLeft}>
            <Text style={styles.credentialType} numberOfLines={1}>
              {credential.displayName}
            </Text>
            <Text style={styles.issuerLabel} numberOfLines={1}>
              {extractDomain(credential.issuer)}
            </Text>
          </View>

          <View style={styles.bottomRight}>
            {expiryLabel && (
              <Text style={styles.expiryLabel}>{expiryLabel}</Text>
            )}
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(credential.status) }]} />
          </View>
        </View>

        {/* Revoked overlay */}
        {credential.status === "revoked" && (
          <View style={styles.revokedOverlay}>
            <Text style={styles.revokedText}>REVOKED</Text>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  )
})

function extractDomain(url: string): string {
  try { return new URL(url).hostname } catch { return url }
}

const styles = StyleSheet.create({
  pressable:   { width: CARD_WIDTH, borderRadius: radius.card, overflow: "hidden" },
  pressed:     { opacity: 0.92, transform: [{ scale: 0.985 }] },
  card: {
    width: CARD_WIDTH,
    borderRadius: radius.card,
    padding: spacing.base,
    justifyContent: "space-between",
  },
  topRow:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  chip: {
    width: 36, height: 28,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.20)",
    justifyContent: "center", alignItems: "center",
  },
  chipInner:   { width: 24, height: 18, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.35)" },
  middle:      { flex: 1, justifyContent: "flex-end", paddingBottom: spacing.sm },
  claimValue:  { ...typography.h3, color: colors.white, opacity: 0.95 },
  bottomRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  bottomLeft:  { flex: 1 },
  credentialType: { ...typography.labelLg, color: colors.white, opacity: 0.90 },
  issuerLabel: { ...typography.caption, color: colors.white, opacity: 0.65, marginTop: 2 },
  bottomRight: { alignItems: "flex-end", gap: 4 },
  expiryLabel: { ...typography.label, color: colors.white, opacity: 0.75 },
  statusDot:   { width: 8, height: 8, borderRadius: 4 },
  revokedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center", alignItems: "center",
    borderRadius: radius.card,
  },
  revokedText: { ...typography.h3, color: colors.red400, letterSpacing: 3 },
})
