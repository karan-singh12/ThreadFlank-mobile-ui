export { colors, gradients, tones } from "./colors";
export { fonts, type, type TypeVariant } from "./typography";

export const radius = {
  sm: 8,
  md: 12,
  card: 16,
  panel: 20,
  frame: 24,
  pill: 999,
} as const;

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/** Side gutter for every screen (web `px-4`). */
export const GUTTER = 16;

/** Height of the floating bottom tab bar, excluding the home-indicator inset. */
export const TAB_BAR_HEIGHT = 64;

export const shadows = {
  primaryGlow: {
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  chipOn: {
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
} as const;
