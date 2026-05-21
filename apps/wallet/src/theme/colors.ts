/**
 * EUDI Wallet design system — color palette
 *
 * Primary ramp: EU institutional blue
 * Accent: eIDAS gold (QES level indicator)
 * Surfaces: warm near-white for credential cards
 */

export const colors = {
  // EU blue — primary actions, navigation
  blue50:  "#EFF6FF",
  blue100: "#DBEAFE",
  blue200: "#BFDBFE",
  blue400: "#60A5FA",
  blue500: "#3B82F6",
  blue600: "#2563EB",
  blue700: "#1D4ED8",
  blue800: "#1E40AF",
  blue900: "#1E3A8A",

  // eIDAS gold — trust level indicator (QES)
  gold300: "#FCD34D",
  gold400: "#FBBF24",
  gold500: "#F59E0B",
  gold600: "#D97706",

  // Success green — verified credentials
  green400: "#4ADE80",
  green500: "#22C55E",
  green600: "#16A34A",
  green700: "#15803D",

  // Warning amber
  amber400: "#FB923C",
  amber500: "#F97316",

  // Danger red — revoked, expired
  red400: "#F87171",
  red500: "#EF4444",
  red600: "#DC2626",

  // Neutrals
  gray50:  "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",

  // Absolute
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
} as const

/** Credential card background gradients by type */
export const cardGradients = {
  mDL:        ["#1E3A8A", "#2563EB"],   // deep EU blue
  loyalty:    ["#1a3a5c", "#1D6FA4"],   // corporate blue
  library:    ["#1B4332", "#2D6A4F"],   // forest green
  airline:    ["#1d3461", "#3A5BA0"],   // aviation navy
  identity:   ["#1E3A8A", "#7C3AED"],   // blue-violet (PID)
  generic:    ["#374151", "#6B7280"],   // neutral gray
} as const

export const semanticColors = {
  // Trust levels (eIDAS)
  trustHigh:   colors.gold500,       // QES — Qualified
  trustSubst:  colors.blue600,       // AdES — Substantial
  trustLow:    colors.gray400,       // Basic

  // Credential status
  statusValid:   colors.green500,
  statusExpired: colors.amber500,
  statusRevoked: colors.red500,
  statusPending: colors.gray400,

  // UI semantic
  background:   colors.gray50,
  surface:      colors.white,
  surfaceAlt:   colors.gray100,
  border:       colors.gray200,
  borderStrong: colors.gray300,
  text:         colors.gray900,
  textSecondary:colors.gray500,
  textDisabled: colors.gray400,
  primary:      colors.blue600,
  primaryDark:  colors.blue800,
  danger:       colors.red500,
  success:      colors.green500,
  warning:      colors.amber500,
} as const
