import type { TextStyle } from "react-native";

/** Familjen Grotesk, as on the web (`--font-sans`). Loaded in the root layout. */
export const fonts = {
  regular: "FamiljenGrotesk_400Regular",
  medium: "FamiljenGrotesk_500Medium",
  semibold: "FamiljenGrotesk_600SemiBold",
  bold: "FamiljenGrotesk_700Bold",
} as const;

/** Mobile sizes of the web type scale (the clamp() minimums at 390px). */
export const type = {
  display: { fontSize: 44, lineHeight: 50, letterSpacing: -1.3, fontFamily: fonts.medium },
  h1: { fontSize: 34, lineHeight: 40, letterSpacing: -1.2, fontFamily: fonts.medium },
  h2: { fontSize: 28, lineHeight: 34, letterSpacing: -0.6, fontFamily: fonts.medium },
  h3: { fontSize: 22, lineHeight: 27, letterSpacing: -0.3, fontFamily: fonts.medium },
  title: { fontSize: 20, lineHeight: 28, fontFamily: fonts.medium },
  bodyLg: { fontSize: 18, lineHeight: 27, fontFamily: fonts.regular },
  body: { fontSize: 16, lineHeight: 25, fontFamily: fonts.regular },
  sm: { fontSize: 14, lineHeight: 21, fontFamily: fonts.regular },
  xs: { fontSize: 12, lineHeight: 18, fontFamily: fonts.regular },
  micro: { fontSize: 11, lineHeight: 14, fontFamily: fonts.regular },
  label: { fontSize: 12, lineHeight: 16, letterSpacing: 0.96, fontFamily: fonts.medium, textTransform: "uppercase" },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;
