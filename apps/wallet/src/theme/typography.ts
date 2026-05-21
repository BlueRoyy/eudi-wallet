import { Platform } from "react-native"

const fontFamily = Platform.select({
  ios:     { regular: "System",  medium: "System",  semibold: "System",  bold: "System" },
  android: { regular: "Roboto",  medium: "Roboto",  semibold: "Roboto",  bold: "Roboto" },
  default: { regular: "System",  medium: "System",  semibold: "System",  bold: "System" },
})!

export const typography = {
  // Headings
  h1: { fontSize: 28, fontWeight: "700" as const, letterSpacing: -0.5, fontFamily: fontFamily.bold },
  h2: { fontSize: 22, fontWeight: "700" as const, letterSpacing: -0.3, fontFamily: fontFamily.bold },
  h3: { fontSize: 18, fontWeight: "600" as const, letterSpacing: -0.2, fontFamily: fontFamily.semibold },
  h4: { fontSize: 16, fontWeight: "600" as const, letterSpacing: 0,    fontFamily: fontFamily.semibold },

  // Body
  bodyLg: { fontSize: 16, fontWeight: "400" as const, lineHeight: 24, fontFamily: fontFamily.regular },
  body:   { fontSize: 14, fontWeight: "400" as const, lineHeight: 22, fontFamily: fontFamily.regular },
  bodySm: { fontSize: 13, fontWeight: "400" as const, lineHeight: 20, fontFamily: fontFamily.regular },

  // Labels
  labelLg: { fontSize: 14, fontWeight: "600" as const, letterSpacing: 0.1,  fontFamily: fontFamily.semibold },
  label:   { fontSize: 12, fontWeight: "600" as const, letterSpacing: 0.3,  fontFamily: fontFamily.semibold },
  labelSm: { fontSize: 11, fontWeight: "500" as const, letterSpacing: 0.4,  fontFamily: fontFamily.medium },

  // Caption / metadata
  caption: { fontSize: 12, fontWeight: "400" as const, lineHeight: 16, fontFamily: fontFamily.regular },
  mono:    { fontSize: 13, fontWeight: "400" as const, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }) },
} as const
