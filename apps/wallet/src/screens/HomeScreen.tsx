/**
 * Wallet Home Screen
 * Shows all stored credentials in a scrollable card stack.
 * Quick actions: scan QR, present, settings.
 */
import React, { useEffect, useCallback, useRef } from "react"
import {
  View, Text, FlatList, Pressable, StyleSheet,
  StatusBar, RefreshControl, Animated,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../navigation/types"
import { useCredentials } from "../hooks/useCredentials"
import { useWalletStore } from "../store/wallet.store"
import { CredentialCard } from "../components/cards/CredentialCard"
import { checkAllCredentialsRevocation } from "../services/revocation.service"
import {
  colors, semanticColors, typography, spacing, radius, shadow,
} from "../theme"
import type { WalletCredential } from "../store/wallet.store"

type Props = NativeStackScreenProps<RootStackParamList, "Home">

export function HomeScreen({ navigation }: Props) {
  const insets  = useSafeAreaInsets()
  const { credentials, expiringSoon } = useCredentials()
  const { settings, isLoading, loadFromStorage } = useWalletStore()
  const [refreshing, setRefreshing] = React.useState(false)
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start()
  }, [fadeAnim])

  useEffect(() => {
    if (settings.autoRevocationCheck) {
      checkAllCredentialsRevocation().catch(console.warn)
    }
  }, [settings.autoRevocationCheck])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await checkAllCredentialsRevocation()
    setRefreshing(false)
  }, [])

  const renderItem = useCallback(
    ({ item }: { item: WalletCredential }) => (
      <CredentialCard
        credential={item}
        onPress={() => navigation.navigate("CredentialDetail", { credentialId: item.id })}
        accessibilityHint="Tap to view credential details and present options"
      />
    ),
    [navigation]
  )

  const EmptyState = () => (
    <View style={styles.empty} accessibilityRole="none">
      <View style={styles.emptyIcon}>
        <View style={styles.emptyIconCard} />
        <View style={[styles.emptyIconCard, styles.emptyIconCard2]} />
      </View>
      <Text style={styles.emptyTitle}>Your wallet is empty</Text>
      <Text style={styles.emptySubtitle}>
        Scan a QR code from any eIDAS-compatible issuer to add your first credential.
      </Text>
      <Pressable
        style={styles.emptyCta}
        onPress={() => navigation.navigate("Scan")}
        accessibilityRole="button"
        accessibilityLabel="Scan QR code to add credential"
      >
        <Text style={styles.emptyCtaText}>Scan QR code</Text>
      </Pressable>
    </View>
  )

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={semanticColors.background} />

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <View>
          <Text style={styles.headerGreeting}>My Wallet</Text>
          <Text style={styles.headerCount} accessibilityLiveRegion="polite">
            {credentials.length} credential{credentials.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <Pressable
          style={styles.settingsBtn}
          onPress={() => navigation.navigate("Settings")}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
        >
          <SettingsIcon />
        </Pressable>
      </Animated.View>

      {/* Expiry warning banner */}
      {expiringSoon.length > 0 && (
        <View style={styles.warningBanner} accessibilityRole="alert">
          <Text style={styles.warningText}>
            {expiringSoon.length} credential{expiringSoon.length > 1 ? "s" : ""} expiring soon
          </Text>
        </View>
      )}

      {/* Credential list */}
      <FlatList
        data={credentials}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing["2xl"] + 80 },
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={!isLoading ? <EmptyState /> : null}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={semanticColors.primary} />
        }
        showsVerticalScrollIndicator={false}
        accessibilityLabel="Credentials list"
      />

      {/* FAB — Scan QR */}
      <Pressable
        style={[styles.fab, { bottom: insets.bottom + spacing.lg }]}
        onPress={() => navigation.navigate("Scan")}
        accessibilityRole="button"
        accessibilityLabel="Scan QR code to add or present credential"
      >
        <ScanIcon />
        <Text style={styles.fabText}>Scan</Text>
      </Pressable>
    </View>
  )
}

// Inline icon components (no external icon library dependency)
function SettingsIcon() {
  return (
    <View style={{ width: 22, height: 22, justifyContent: "center", alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ width: 18, height: 2, backgroundColor: semanticColors.textSecondary, borderRadius: 1, marginVertical: 2 }} />
      ))}
    </View>
  )
}

function ScanIcon() {
  return (
    <View style={{ width: 20, height: 20, borderWidth: 2.5, borderColor: colors.white, borderRadius: 3 }}>
      <View style={{ position: "absolute", top: 2, left: 2, width: 6, height: 6, borderTopWidth: 2, borderLeftWidth: 2, borderColor: colors.white }} />
      <View style={{ position: "absolute", bottom: 2, right: 2, width: 6, height: 6, borderBottomWidth: 2, borderRightWidth: 2, borderColor: colors.white }} />
    </View>
  )
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: semanticColors.background },
  header:          { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  headerGreeting:  { ...typography.h1, color: semanticColors.text },
  headerCount:     { ...typography.body, color: semanticColors.textSecondary, marginTop: 2 },
  settingsBtn:     { width: 44, height: 44, justifyContent: "center", alignItems: "center", borderRadius: radius.pill, backgroundColor: semanticColors.surfaceAlt },
  warningBanner:   { marginHorizontal: spacing.base, marginBottom: spacing.sm, padding: spacing.md, backgroundColor: colors.amber400 + "20", borderRadius: radius.md, borderLeftWidth: 3, borderLeftColor: colors.amber500 },
  warningText:     { ...typography.bodySm, color: colors.amber600, fontWeight: "600" },
  listContent:     { paddingHorizontal: spacing.base, paddingTop: spacing.sm },
  separator:       { height: spacing.md },
  empty:           { flex: 1, alignItems: "center", paddingHorizontal: spacing["2xl"], paddingTop: spacing["3xl"] },
  emptyIcon:       { width: 80, height: 80, marginBottom: spacing.lg, position: "relative" },
  emptyIconCard:   { position: "absolute", width: 56, height: 36, borderRadius: 8, backgroundColor: semanticColors.border, top: 8, left: 4 },
  emptyIconCard2:  { top: 20, left: 16, backgroundColor: colors.blue100 },
  emptyTitle:      { ...typography.h3, color: semanticColors.text, textAlign: "center", marginBottom: spacing.sm },
  emptySubtitle:   { ...typography.body, color: semanticColors.textSecondary, textAlign: "center", lineHeight: 22 },
  emptyCta:        { marginTop: spacing.xl, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, backgroundColor: semanticColors.primary, borderRadius: radius.lg },
  emptyCtaText:    { ...typography.labelLg, color: colors.white },
  fab: {
    position: "absolute", right: spacing.lg,
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: semanticColors.primary,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderRadius: radius.pill,
    ...shadow.md,
  },
  fabText:         { ...typography.labelLg, color: colors.white },
})
