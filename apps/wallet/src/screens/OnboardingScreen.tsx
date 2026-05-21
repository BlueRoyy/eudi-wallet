/**
 * Onboarding — 3-step intro explaining eIDAS 2 wallet concepts.
 */
import React, { useRef, useState } from "react"
import { View, Text, StyleSheet, Pressable, Dimensions, ScrollView } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../navigation/types"
import { useWalletStore } from "../store/wallet.store"
import { colors, semanticColors, typography, spacing, radius } from "../theme"

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">

const { width } = Dimensions.get("window")

const STEPS = [
  {
    title: "Your digital identity wallet",
    body: "Securely store government-issued IDs, licences, loyalty cards, boarding passes and more — all in one place, compliant with eIDAS 2.0.",
    illustration: "🪪",
    accent: colors.blue600,
  },
  {
    title: "Share only what's needed",
    body: "You control which information you share. Selective disclosure means a verifier sees only the claims they need — nothing more.",
    illustration: "🔐",
    accent: colors.green600,
  },
  {
    title: "Trusted across Europe",
    body: "Every credential is cryptographically signed and verifiable. The eIDAS trust framework ensures your credentials are recognised by organisations and governments.",
    illustration: "🌍",
    accent: colors.gold600,
  },
]

export function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  const { completeOnboarding } = useWalletStore()
  const [step, setStep] = useState(0)
  const scrollRef = useRef<ScrollView>(null)

  const goToStep = (idx: number) => {
    setStep(idx)
    scrollRef.current?.scrollTo({ x: idx * width, animated: true })
  }

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      goToStep(step + 1)
    } else {
      completeOnboarding()
      navigation.replace("Home")
    }
  }

  const currentStep = STEPS[step]!

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
      >
        {STEPS.map((s, i) => (
          <View key={i} style={[styles.page, { width }]}>
            <View style={[styles.illustrationCircle, { backgroundColor: s.accent + "15" }]}>
              <Text style={styles.illustration}>{s.illustration}</Text>
            </View>
            <Text style={styles.title} accessibilityRole="header">{s.title}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dot indicators */}
      <View style={styles.dots} accessibilityLabel={`Step ${step + 1} of ${STEPS.length}`}>
        {STEPS.map((_, i) => (
          <Pressable
            key={i}
            onPress={() => goToStep(i)}
            style={[styles.dot, i === step && { backgroundColor: currentStep.accent, width: 24 }]}
            accessibilityRole="button"
            accessibilityLabel={`Go to step ${i + 1}`}
          />
        ))}
      </View>

      <View style={styles.actions}>
        {step > 0 && (
          <Pressable onPress={() => goToStep(step - 1)} style={styles.backBtn} accessibilityRole="button">
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        )}
        <Pressable
          onPress={handleNext}
          style={[styles.nextBtn, { backgroundColor: currentStep.accent, flex: step > 0 ? 2 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel={step < STEPS.length - 1 ? "Continue" : "Get started"}
        >
          <Text style={styles.nextText}>{step < STEPS.length - 1 ? "Continue" : "Get started"}</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: semanticColors.background },
  page:               { paddingHorizontal: spacing["2xl"], justifyContent: "center", alignItems: "center", gap: spacing.xl },
  illustrationCircle: { width: 140, height: 140, borderRadius: 70, justifyContent: "center", alignItems: "center" },
  illustration:       { fontSize: 64 },
  title:              { ...typography.h1, color: semanticColors.text, textAlign: "center" },
  body:               { ...typography.bodyLg, color: semanticColors.textSecondary, textAlign: "center", lineHeight: 26 },
  dots:               { flexDirection: "row", gap: spacing.sm, justifyContent: "center", paddingBottom: spacing.lg },
  dot:                { width: 8, height: 8, borderRadius: 4, backgroundColor: semanticColors.border, overflow: "hidden" },
  actions:            { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  backBtn:            { flex: 1, paddingVertical: spacing.md, borderRadius: radius.lg, borderWidth: 1.5, borderColor: semanticColors.border, alignItems: "center" },
  backText:           { ...typography.labelLg, color: semanticColors.textSecondary },
  nextBtn:            { paddingVertical: spacing.md, borderRadius: radius.lg, alignItems: "center" },
  nextText:           { ...typography.labelLg, color: colors.white },
})
