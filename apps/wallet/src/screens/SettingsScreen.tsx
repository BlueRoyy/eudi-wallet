import React, { useCallback } from "react"
import { View, Text, StyleSheet, Switch, ScrollView, Pressable, Alert, Linking } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../navigation/types"
import { useWalletStore } from "../store/wallet.store"
import { useBiometrics } from "../hooks/useBiometrics"
import { colors, semanticColors, typography, spacing, radius, shadow } from "../theme"

type Props = NativeStackScreenProps<RootStackParamList, "Settings">

export function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  const { settings, updateSettings, credentials } = useWalletStore()
  const { capabilities } = useBiometrics()

  const toggle = useCallback((key: keyof typeof settings) => {
    updateSettings({ [key]: !settings[key] })
  }, [settings, updateSettings])

  const confirmClearAll = useCallback(() => {
    Alert.alert(
      "Clear all credentials",
      "This will permanently remove all credentials from your wallet. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear all", style: "destructive",
          onPress: async () => {
            const { removeCredential } = useWalletStore.getState()
            for (const c of credentials) await removeCredential(c.id)
          },
        },
      ]
    )
  }, [credentials])

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.navBar}>
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.navTitle} accessibilityRole="header">Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing["2xl"] }} showsVerticalScrollIndicator={false}>

        <Section title="Security">
          <SettingRow
            label={capabilities.biometryType === "FaceID" ? "Face ID" : capabilities.biometryType === "TouchID" ? "Touch ID" : "Biometrics"}
            description="Unlock wallet with biometrics"
            value={settings.biometricEnabled && capabilities.available}
            onToggle={() => toggle("biometricEnabled")}
            disabled={!capabilities.available}
          />
          <SettingRow
            label="Require on open"
            description="Authenticate every time you open the wallet"
            value={settings.requireBiometricOnOpen}
            onToggle={() => toggle("requireBiometricOnOpen")}
            disabled={!settings.biometricEnabled}
          />
          <SettingRow
            label="Require on present"
            description="Authenticate before sharing credentials"
            value={settings.requireBiometricOnPresent}
            onToggle={() => toggle("requireBiometricOnPresent")}
            disabled={!settings.biometricEnabled}
          />
        </Section>

        <Section title="Privacy">
          <SettingRow
            label="Auto revocation check"
            description="Periodically verify credentials are still valid"
            value={settings.autoRevocationCheck}
            onToggle={() => toggle("autoRevocationCheck")}
          />
          <SettingRow
            label="Analytics"
            description="Send anonymous usage statistics"
            value={settings.analyticsEnabled}
            onToggle={() => toggle("analyticsEnabled")}
          />
        </Section>

        <Section title="About">
          <InfoRow label="App version" value="1.0.0 (eIDAS v2)" />
          <InfoRow label="ARF version" value="1.4" />
          <InfoRow label="Credentials stored" value={String(credentials.length)} />
          <LinkRow label="Privacy policy" onPress={() => Linking.openURL("https://example.com/privacy")} />
          <LinkRow label="Open source licences" onPress={() => Linking.openURL("https://example.com/licences")} />
        </Section>

        <Section title="Danger zone">
          <Pressable
            style={styles.dangerBtn}
            onPress={confirmClearAll}
            accessibilityRole="button"
            accessibilityLabel="Remove all credentials from wallet"
          >
            <Text style={styles.dangerBtnText}>Remove all credentials</Text>
          </Pressable>
        </Section>

      </ScrollView>
    </View>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={secStyles.container}>
      <Text style={secStyles.title} accessibilityRole="header">{title}</Text>
      <View style={secStyles.card}>{children}</View>
    </View>
  )
}
const secStyles = StyleSheet.create({
  container: { marginHorizontal: spacing.base, marginBottom: spacing.base },
  title:     { ...typography.label, color: semanticColors.textSecondary, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: spacing.sm },
  card:      { backgroundColor: semanticColors.surface, borderRadius: radius.lg, overflow: "hidden", ...shadow.sm },
})

function SettingRow({ label, description, value, onToggle, disabled }: {
  label: string; description: string; value: boolean; onToggle: () => void; disabled?: boolean
}) {
  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.info}>
        <Text style={[rowStyles.label, disabled && rowStyles.disabled]}>{label}</Text>
        <Text style={rowStyles.desc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: colors.gray200, true: semanticColors.primary }}
        thumbColor={colors.white}
        accessibilityLabel={label}
      />
    </View>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  )
}

function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={rowStyles.row} onPress={onPress} accessibilityRole="link" accessibilityLabel={label}>
      <Text style={[rowStyles.label, { color: semanticColors.primary }]}>{label}</Text>
      <Text style={rowStyles.chevron}>›</Text>
    </Pressable>
  )
}

const rowStyles = StyleSheet.create({
  row:      { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: semanticColors.border },
  info:     { flex: 1 },
  label:    { ...typography.body, color: semanticColors.text },
  desc:     { ...typography.caption, color: semanticColors.textSecondary, marginTop: 2 },
  disabled: { color: semanticColors.textDisabled },
  value:    { ...typography.bodySm, color: semanticColors.textSecondary },
  chevron:  { ...typography.h3, color: semanticColors.textSecondary },
})

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: semanticColors.background },
  navBar:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.base, paddingVertical: spacing.sm },
  backText:   { ...typography.bodyLg, color: semanticColors.primary },
  navTitle:   { ...typography.h3, color: semanticColors.text },
  dangerBtn:  { margin: spacing.md, paddingVertical: spacing.md, borderRadius: radius.lg, borderWidth: 1.5, borderColor: semanticColors.danger, alignItems: "center" },
  dangerBtnText: { ...typography.labelLg, color: semanticColors.danger },
})
