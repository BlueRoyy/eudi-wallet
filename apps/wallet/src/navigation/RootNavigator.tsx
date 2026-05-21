/**
 * Root Navigator — determines initial route based on onboarding state.
 * Uses a stack navigator with native transitions.
 */
import React, { useEffect } from "react"
import { NavigationContainer, DefaultTheme } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useWalletStore } from "../store/wallet.store"
import type { RootStackParamList } from "./types"

// Screens
import { OnboardingScreen }       from "../screens/OnboardingScreen"
import { HomeScreen }             from "../screens/HomeScreen"
import { CredentialDetailScreen } from "../screens/CredentialDetailScreen"
import { ScanScreen }             from "../screens/ScanScreen"
import { IssuanceScreen }         from "../screens/IssuanceScreen"
import { PresentScreen }          from "../screens/PresentScreen"
import { SettingsScreen }         from "../screens/SettingsScreen"

import { semanticColors, colors } from "../theme"

const Stack = createNativeStackNavigator<RootStackParamList>()

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: semanticColors.background,
    primary: semanticColors.primary,
    card: semanticColors.surface,
    text: semanticColors.text,
    border: semanticColors.border,
  },
}

export function RootNavigator() {
  const { onboarding, loadFromStorage } = useWalletStore()

  useEffect(() => {
    loadFromStorage()
  }, [])

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          gestureEnabled: true,
          contentStyle: { backgroundColor: semanticColors.background },
        }}
        initialRouteName={onboarding.completed ? "Home" : "Onboarding"}
      >
        <Stack.Screen name="Onboarding"       component={OnboardingScreen} options={{ animation: "fade" }} />
        <Stack.Screen name="Home"             component={HomeScreen} options={{ animation: "fade" }} />
        <Stack.Screen name="CredentialDetail" component={CredentialDetailScreen} />
        <Stack.Screen name="Scan"             component={ScanScreen} options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="Issuance"         component={IssuanceScreen} options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="Present"          component={PresentScreen} options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="Settings"         component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
