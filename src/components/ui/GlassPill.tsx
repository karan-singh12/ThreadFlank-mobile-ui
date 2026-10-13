import { LinearGradient } from "expo-linear-gradient";
import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, gradients, radius } from "@/theme";
import { AppText } from "./AppText";

/** The web's `.glass-pill`: small frosted label, e.g. "Studio online" or feature pills. */
export function GlassPill({ children, icon: Icon, iconColor = colors.ink, style }: { children: ReactNode; icon?: LucideIcon; iconColor?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.pill, style]}>
      <LinearGradient colors={gradients.glassPill} style={[StyleSheet.absoluteFill, styles.round]} />
      {Icon && <Icon size={14} color={iconColor} strokeWidth={2} />}
      {typeof children === "string" ? (
        <AppText variant="xs" color="#fff" numberOfLines={1}>
          {children}
        </AppText>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignSelf: "flex-start",
    overflow: "hidden",
  },
  round: { borderRadius: radius.pill },
});
