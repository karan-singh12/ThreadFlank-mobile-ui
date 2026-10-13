import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { gradients, radius } from "@/theme";

type Props = {
  children?: ReactNode;
  strong?: boolean;
  padding?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/** The web's `.card-violet`: violet-tinted glass with a lavender light along the top edge. */
export function GlassCard({ children, strong = false, padding = 20, radius: r = radius.panel, style }: Props) {
  return (
    <View style={[styles.card, { borderRadius: r, borderColor: strong ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.08)" }, style]}>
      <LinearGradient colors={strong ? gradients.cardStrong : gradients.card} style={[StyleSheet.absoluteFill, { borderRadius: r }]} />
      <LinearGradient
        colors={gradients.cardEdge}
        locations={[0.08, 0.5, 0.92]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.edge}
      />
      <View style={{ padding }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, overflow: "hidden" },
  edge: { position: "absolute", top: 0, left: 0, right: 0, height: 1 },
});
