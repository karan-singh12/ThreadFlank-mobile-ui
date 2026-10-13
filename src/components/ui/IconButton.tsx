import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors } from "@/theme";

type Props = {
  icon: LucideIcon;
  onPress?: () => void;
  label: string;
  size?: number;
  iconSize?: number;
  color?: string;
  variant?: "glass" | "plain" | "solid";
  disabled?: boolean;
  /** Small dot or count in the corner, e.g. unread notifications. */
  badge?: ReactNode;
  style?: StyleProp<ViewStyle>;
  fill?: string;
};

/** Round icon-only button (web: `size-10 rounded-full border border-white/12`). */
export function IconButton({ icon: Icon, onPress, label, size = 40, iconSize = 18, color = colors.ink, variant = "glass", disabled, badge, style, fill }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
        variant === "glass" && styles.glass,
        variant === "solid" && styles.solid,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Icon size={iconSize} color={color} strokeWidth={1.8} fill={fill ?? "transparent"} />
      {badge != null && <View style={styles.badge}>{badge}</View>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center" },
  glass: { borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(11,11,30,0.6)" },
  solid: { backgroundColor: "rgba(1,2,20,0.65)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
  badge: { position: "absolute", top: -2, right: -2 },
});
