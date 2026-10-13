import { LinearGradient } from "expo-linear-gradient";
import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, gradients, radius, shadows } from "@/theme";
import { AppText } from "./AppText";

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: LucideIcon;
  size?: "sm" | "md";
  /** Leading content, e.g. a colour swatch. */
  leading?: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Pill chip; selected uses the web's off-white `.chip-on` with dark text. */
export function Chip({ label, selected = false, onPress, icon: Icon, size = "md", leading, disabled, style }: ChipProps) {
  const height = size === "sm" ? 30 : 36;
  const color = selected ? colors.chipOnText : colors.subtle;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      style={({ pressed }) => [
        styles.chip,
        { height, paddingHorizontal: size === "sm" ? 12 : 16 },
        selected ? shadows.chipOn : styles.idle,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {selected && <LinearGradient colors={gradients.chipOn} style={[StyleSheet.absoluteFill, styles.round]} />}
      {leading}
      {Icon && <Icon size={size === "sm" ? 14 : 15} color={color} strokeWidth={1.9} />}
      <AppText variant={size === "sm" ? "xs" : "sm"} weight={selected ? "medium" : "regular"} color={color} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

type Option<T extends string> = { id: T; label: string; icon?: LucideIcon };

/** Single-choice pill row (web `Segmented`). Scrolls horizontally when `scroll` is set. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  scroll = false,
  size = "md",
  style,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly Option<T>[];
  scroll?: boolean;
  size?: "sm" | "md";
  style?: StyleProp<ViewStyle>;
}) {
  const chips = options.map((o) => <Chip key={o.id} label={o.label} icon={o.icon} size={size} selected={value === o.id} onPress={() => onChange(o.id)} />);
  if (scroll) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollRow} style={style} accessibilityRole="radiogroup">
        {chips}
      </ScrollView>
    );
  }
  return (
    <View style={[styles.wrapRow, style]} accessibilityRole="radiogroup">
      {chips}
    </View>
  );
}

/** Underline-free tab switcher inside a glass track (web: rounded-full track with `.chip-on` active tab). */
export function TabSwitch<T extends string>({ value, onChange, options, style }: { value: T; onChange: (v: T) => void; options: readonly Option<T>[]; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.track, style]} accessibilityRole="tablist">
      {options.map((o) => {
        const active = value === o.id;
        const Icon = o.icon;
        return (
          <Pressable key={o.id} onPress={() => onChange(o.id)} accessibilityRole="tab" accessibilityState={{ selected: active }} style={[styles.tab, active && shadows.chipOn]}>
            {active && <LinearGradient colors={gradients.chipOn} style={[StyleSheet.absoluteFill, styles.round]} />}
            {Icon && <Icon size={15} strokeWidth={1.9} color={active ? colors.chipOnText : colors.subtle} />}
            <AppText variant="sm" weight={active ? "medium" : "regular"} color={active ? colors.chipOnText : colors.subtle} numberOfLines={1}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: radius.pill, overflow: "visible" },
  round: { borderRadius: radius.pill },
  idle: { borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.8 },
  scrollRow: { gap: 8, paddingRight: 16 },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  track: {
    flexDirection: "row",
    padding: 4,
    gap: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(11,11,30,0.7)",
  },
  tab: { flex: 1, height: 34, borderRadius: radius.pill, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 8 },
});
