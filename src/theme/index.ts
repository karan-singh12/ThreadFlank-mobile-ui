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
    shadowColor: "#621ded",
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 8,
  },
  chipOn: {
    shadowColor: "#c8b0f7",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
} as const;
