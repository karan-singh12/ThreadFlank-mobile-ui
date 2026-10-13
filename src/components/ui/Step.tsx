import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { colors } from "@/theme";
import { AppText } from "./AppText";
import { GlassCard } from "./GlassCard";

export type Glow = { color: string; at: "top-right" | "bottom-left" | "top-left" | "bottom-right" };

const SPOT: Record<Glow["at"], ViewStyle> = {
  "top-right": { top: -70, right: -50 },
  "bottom-left": { bottom: -70, left: -50 },
  "top-left": { top: -70, left: -50 },
  "bottom-right": { bottom: -70, right: -50 },
};

/** Soft colour glow inside a card (the web's blurred circle), drawn as a radial gradient. */
export function CardGlow({ glow, size = 200 }: { glow: Glow; size?: number }) {
  const id = `glow-${glow.at}-${glow.color.replace("#", "")}`;
  return (
    <View pointerEvents="none" style={[styles.glow, SPOT[glow.at], { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={glow.color} stopOpacity={0.28} />
            <Stop offset="1" stopColor={glow.color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/** Small dark keycap holding an icon (web `.keycap` + `.icon-silver`). */
export function Keycap({ icon: Icon, size = 28, iconSize = 14 }: { icon: LucideIcon; size?: number; iconSize?: number }) {
  return (
    <View style={[styles.keycap, { width: size, height: size, borderRadius: size * 0.3 }]}>
      <Icon size={iconSize} color="#e9e9f2" strokeWidth={2.25} />
    </View>
  );
}

/** One card in a control rail: violet glass with a colour glow, a keycap icon and a title row. */
export function Step({ label, icon, glow, aside, children, style }: { label: string; icon: LucideIcon; glow: Glow; aside?: ReactNode; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <GlassCard padding={14} style={style}>
      <CardGlow glow={glow} />
      <View style={styles.header}>
        <Keycap icon={icon} />
        <AppText variant="sm" weight="medium" numberOfLines={1} style={styles.title}>
          {label}
        </AppText>
        {aside}
      </View>
      {children}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  glow: { position: "absolute" },
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  title: { flex: 1 },
  keycap: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a1540",
    borderWidth: 1,
    borderColor: "rgba(160,140,255,0.28)",
  },
});

export const stepAsideStyle = { color: colors.muted };
