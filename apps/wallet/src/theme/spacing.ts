import { Platform } from "react-native"

export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  "2xl": 32,
  "3xl": 48,
  "4xl": 64,
} as const

export const radius = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  card: 16,
  pill: 999,
} as const

export const shadow = {
  sm: Platform.select({
    ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
    android: { elevation: 2 },
    default: {},
  })!,
  md: Platform.select({
    ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 10 },
    android: { elevation: 5 },
    default: {},
  })!,
  lg: Platform.select({
    ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 20 },
    android: { elevation: 10 },
    default: {},
  })!,
  card: Platform.select({
    ios:     { shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 16 },
    android: { elevation: 8 },
    default: {},
  })!,
} as const
