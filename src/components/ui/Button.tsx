import { LinearGradient } from "expo-linear-gradient";
import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, gradients, radius, shadows } from "@/theme";
import { AppText } from "./AppText";

export type ButtonVariant = "primary" | "light" | "ghost" | "danger" | "glass";
type Size = "sm" | "md" | "lg";

const HEIGHT: Record<Size, number> = { sm: 36, md: 44, lg: 52 };
const PAD: Record<Size, number> = { sm: 14, md: 20, lg: 24 };
const TEXT_COLOR: Record<ButtonVariant, string> = {
  primary: colors.btnPrimaryText,
  light: colors.btnLightText,
  ghost: colors.subtle,
  danger: colors.red,
  glass: colors.ink,
};

export type ButtonProps = {
  children?: ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/** Pill button with the web's variants: `.btn-primary`, `.btn-light`, ghost, danger and glass. */
export function Button({
  children,
  onPress,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  loadingText,
  disabled = false,
  fullWidth = false,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const inactive = disabled || loading;
  const color = TEXT_COLOR[variant];
  const iconSize = size === "lg" ? 18 : 16;

  const content = (
    <View style={[styles.row, { paddingHorizontal: PAD[size] }]}>
      {loading ? <ActivityIndicator size="small" color={color} /> : Icon ? <Icon size={iconSize} color={color} strokeWidth={1.9} /> : null}
      {children != null && (
        <AppText variant={size === "lg" ? "body" : "sm"} weight="medium" color={color} numberOfLines={1}>
          {loading && loadingText ? loadingText : children}
        </AppText>
      )}
      {IconRight && !loading && <IconRight size={iconSize} color={color} strokeWidth={1.9} />}
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        { height: HEIGHT[size] },
        fullWidth && styles.full,
        variant === "primary" && shadows.primaryGlow,
        variant === "ghost" && styles.ghost,
        variant === "danger" && styles.danger,
        variant === "glass" && styles.glass,
        inactive && styles.disabled,
        pressed && !inactive && styles.pressed,
        style,
      ]}
    >
      {variant === "primary" || variant === "light" ? (
        <LinearGradient
          colors={variant === "primary" ? gradients.primary : gradients.light}
          style={[styles.fill, variant === "primary" ? styles.primaryRim : styles.lightRim]}
        >
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.pill, overflow: "visible", alignSelf: "flex-start" },
  full: { alignSelf: "stretch" },
  fill: { flex: 1, borderRadius: radius.pill, justifyContent: "center" },
  primaryRim: { borderWidth: 1, borderColor: "rgba(127,98,246,0.45)" },
  lightRim: { borderWidth: 1, borderColor: "rgba(255,255,255,0.6)" },
  row: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  ghost: { borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", justifyContent: "center" },
  danger: { borderWidth: 1, borderColor: "rgba(248,113,113,0.3)", justifyContent: "center" },
  glass: { borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.08)", justifyContent: "center" },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
});
