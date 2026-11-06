/** Design tokens mirrored from the web app's globals.css (`@theme inline`). */
export const colors = {
  canvas: "#010214",
  surface: "#0b0b1e",
  ink: "#ffffff",
  inkSoft: "#f2f3f4",
  subtle: "#babbc4",
  muted: "#8d90a5",
  dim: "#585463",
  accent: "#6645eb",
  accentBright: "#7f62f6",
  accentDeep: "#3f20be",
  cyan: "#1fc5db",
  green: "#28e69d",
  amber: "#fde68a",
  red: "#fca5a5",
  redStrong: "#f87171",
  line: "rgba(255,255,255,0.1)",
  lineSoft: "rgba(255,255,255,0.08)",
  lineStrong: "rgba(255,255,255,0.16)",
  glass: "rgba(255,255,255,0.04)",
  glassStrong: "rgba(255,255,255,0.06)",
  overlay: "rgba(1,2,20,0.72)",
  chipOnText: "#ffffff",
  btnPrimaryText: "#ffffff",
  btnLightText: "#090a1a",
} as const;

/** Linear gradients (top → bottom unless noted) behind the web's utility classes. */
export const gradients = {
  /** .btn-primary — modern, vibrant executive violet */
  primary: ["#6342f0", "#4d2ad9"] as const,
  /** .btn-light */
  light: ["#ffffff", "#f1f0f7"] as const,
  /** .chip-on — selected chip, tab or segment */
  chipOn: ["rgba(127,98,246,0.22)", "rgba(102,69,235,0.15)"] as const,
  /** .card-violet */
  card: ["rgba(102,69,235,0.12)", "rgba(14,15,27,0.55)"] as const,
  /** .card-violet-strong */
  cardStrong: ["rgba(102,69,235,0.17)", "rgba(21,22,38,0.55)"] as const,
  /** Lavender light along the top edge of glass cards (horizontal). */
  cardEdge: ["transparent", "rgba(196,177,250,0.45)", "transparent"] as const,
  /** .glass-pill */
  glassPill: ["rgba(255,255,255,0.15)", "rgba(171,171,171,0.05)"] as const,
  /** .bubble-mine */
  bubbleMine: ["#7b5cf2", "#6645eb", "#3f63dd"] as const,
  /** .chrome heading text */
  chrome: ["#ffffff", "#ffffff", "#85849a"] as const,
  chromeSoft: ["#ffffff", "#b9b8c9"] as const,
  chromeDim: ["#c3c2d2", "#6c6a80"] as const,
  /** Story ring (unseen). */
  storyRing: ["#7f62f6", "#1fc5db"] as const,
};

/** Placeholder tones for images that haven't loaded (the web `Art` component's TONES). */
export const tones: Record<string, readonly [string, string, ...string[]]> = {
  violet: ["#e5ddff", "#8b6cf2", "#2b1c66"],
  slate: ["#e3e6ee", "#8d93a8", "#3a3f55"],
  rose: ["#ffd0d0", "#e0463f", "#5a1420"],
  amber: ["#ffe4c2", "#d99a5c", "#5c3a24"],
  teal: ["#d2f5ef", "#4fb3a6", "#1b3f45"],
  ember: ["#f08a3c", "#e2552f", "#7a1d22"],
  meadow: ["#9fd46b", "#4f9a3a", "#2f6b3a"],
  dusk: ["#f07aa5", "#b0407e", "#3a2360"],
  neon: ["#ff4fa8", "#b8367c", "#1c1a55"],
  brain: ["#7fb3ff", "#3c62f0", "#1a1d6e"],
};
