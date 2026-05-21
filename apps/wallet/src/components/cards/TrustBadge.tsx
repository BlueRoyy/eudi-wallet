/**
 * eIDAS Trust Level badge.
 *
 * Three levels per eIDAS 2.0:
 *   High        — QES (Qualified Electronic Signature) / national ID
 *   Substantial — Government-issued, advanced signature
 *   Low         — Self-asserted or basic
 */
import React from "react"
import { View, Text, StyleSheet } from "react-native"
import { colors, semanticColors, typography, spacing, radius } from "../../theme"

type TrustLevel = "high" | "substantial" | "low"

interface Props {
  level: TrustLevel
  showLabel?: boolean
}

const LEVEL_CONFIG: Record<TrustLevel, { label: string; color: string; bg: string }> = {
  high:        { label: "HIGH",  color: colors.gold600, bg: "rgba(251,191,36,0.20)" },
  substantial: { label: "SUBS", color: colors.blue200,  bg: "rgba(96,165,250,0.20)" },
  low:         { label: "LOW",  color: colors.gray300,  bg: "rgba(209,213,219,0.15)" },
}

export function TrustBadge({ level, showLabel = true }: Props) {
  const cfg = LEVEL_CONFIG[level]
  return (
    <View
      style={[styles.badge, { backgroundColor: cfg.bg, borderColor: cfg.color }]}
      accessibilityLabel={`eIDAS trust level: ${level}`}
    >
      {/* Shield icon — 3 horizontal lines */}
      <View style={styles.shield}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.shieldLine, { backgroundColor: cfg.color, width: i === 1 ? 8 : 6 }]} />
        ))}
      </View>
      {showLabel && <Text style={[styles.label, { color: cfg.color }]}>{cfg.label}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 6, paddingVertical: 3,
    borderRadius: radius.sm, borderWidth: 0.8,
  },
  shield:     { gap: 2, alignItems: "flex-start" },
  shieldLine: { height: 1.5, borderRadius: 1 },
  label:      { ...typography.labelSm },
})
