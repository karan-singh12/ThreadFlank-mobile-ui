import { Pressable, StyleSheet, View } from "react-native";
import { colors } from "@/theme";
import { AppText } from "./AppText";

/** Colour swatch picker (makeup shades, skin tones). */
export function Swatches({
  label,
  options,
  value,
  onChange,
  allowNone = false,
}: {
  label: string;
  options: readonly { name: string; hex: string }[];
  value: string | null;
  onChange: (v: string | null) => void;
  allowNone?: boolean;
}) {
  const current = options.find((o) => o.hex === value);
  return (
    <View style={styles.wrap}>
      <AppText variant="label" color={colors.muted}>
        {label}
        {current ? (
          <AppText variant="xs" color={colors.subtle}>
            {"  "}· {current.name}
          </AppText>
        ) : null}
      </AppText>
      <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {allowNone && (
          <Pressable onPress={() => onChange(null)} style={[styles.none, value === null && styles.noneOn]} accessibilityRole="radio" accessibilityState={{ selected: value === null }}>
            <AppText variant="micro" color={value === null ? "#fff" : colors.muted}>
              None
            </AppText>
          </Pressable>
        )}
        {options.map((o) => {
          const on = value === o.hex;
          return (
            <Pressable key={o.hex} onPress={() => onChange(o.hex)} accessibilityRole="radio" accessibilityLabel={o.name} accessibilityState={{ selected: on }} style={[styles.ring, on && styles.ringOn]}>
              <View style={[styles.swatch, { backgroundColor: o.hex }]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  none: { height: 32, paddingHorizontal: 10, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", justifyContent: "center" },
  noneOn: { borderColor: colors.accentBright },
  ring: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  ringOn: { borderColor: colors.accentBright },
  swatch: { width: 26, height: 26, borderRadius: 13 },
});
