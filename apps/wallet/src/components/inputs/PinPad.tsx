/**
 * PIN pad — used for tx_code entry during issuance and wallet unlock.
 * Accessible, haptic, animated.
 */
import React, { useState, useCallback } from "react"
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Vibration,
  Animated,
} from "react-native"
import { colors, semanticColors, typography, spacing, radius, shadow } from "../../theme"

interface PinPadProps {
  length: number
  onComplete: (pin: string) => void
  label?: string
  error?: string | null
  onClear?: () => void
}

const KEYS = ["1","2","3","4","5","6","7","8","9","","0","⌫"]

export function PinPad({ length, onComplete, label, error, onClear }: PinPadProps) {
  const [digits, setDigits] = useState<string[]>([])
  const [shakeAnim] = useState(new Animated.Value(0))

  const shake = useCallback(() => {
    Vibration.vibrate(50)
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start()
  }, [shakeAnim])

  const handleKey = useCallback((key: string) => {
    if (key === "⌫") {
      setDigits((d) => d.slice(0, -1))
      onClear?.()
      return
    }
    if (key === "") return
    if (digits.length >= length) return

    const next = [...digits, key]
    setDigits(next)
    Vibration.vibrate(20)

    if (next.length === length) {
      onComplete(next.join(""))
    }
  }, [digits, length, onComplete, onClear])

  React.useEffect(() => {
    if (error) { shake(); setDigits([]) }
  }, [error, shake])

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Dot indicator */}
      <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
        {Array.from({ length }).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i < digits.length && styles.dotFilled]}
            accessibilityLabel={i < digits.length ? "Filled" : "Empty"}
          />
        ))}
      </Animated.View>

      {error && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}

      {/* Key grid */}
      <View style={styles.grid}>
        {KEYS.map((key, i) => (
          <Pressable
            key={i}
            onPress={() => handleKey(key)}
            disabled={!key}
            accessibilityRole="button"
            accessibilityLabel={key === "⌫" ? "Delete" : key || undefined}
            style={({ pressed }) => [
              styles.key,
              !key && styles.keyInvisible,
              key === "⌫" && styles.keyDelete,
              pressed && key && styles.keyPressed,
            ]}
          >
            <Text style={[styles.keyText, key === "⌫" && styles.keyDeleteText]}>
              {key}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:    { alignItems: "center", gap: spacing.lg },
  label:        { ...typography.body, color: semanticColors.text, textAlign: "center" },
  dotsRow:      { flexDirection: "row", gap: spacing.base },
  dot: {
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 1.5, borderColor: semanticColors.borderStrong,
  },
  dotFilled:    { backgroundColor: semanticColors.primary, borderColor: semanticColors.primary },
  error:        { ...typography.bodySm, color: semanticColors.danger, textAlign: "center" },
  grid:         { flexDirection: "row", flexWrap: "wrap", width: 260, gap: spacing.md },
  key: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: semanticColors.surface,
    justifyContent: "center", alignItems: "center",
    ...shadow.sm,
  },
  keyInvisible: { backgroundColor: colors.transparent, shadowOpacity: 0, elevation: 0 },
  keyDelete:    { backgroundColor: colors.transparent, shadowOpacity: 0, elevation: 0 },
  keyPressed:   { backgroundColor: semanticColors.surfaceAlt },
  keyText:      { ...typography.h2, color: semanticColors.text },
  keyDeleteText:{ ...typography.h3, color: semanticColors.textSecondary },
})
