import { Check, ChevronDown } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius } from "@/theme";
import { AppText } from "./AppText";
import { Sheet } from "./Sheet";

type Option = { value: string; label: string };

type Props = {
  label: string;
  value: string;
  options: readonly Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
};

/** The web's `<select>` as a field that opens a bottom-sheet list. */
export function Select({ label, value, options, onChange, placeholder = "Choose…", style }: Props) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <View style={[styles.wrap, style]}>
      <AppText variant="label" color={colors.muted}>
        {label}
      </AppText>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel={`${label}: ${current?.label ?? placeholder}`} style={({ pressed }) => [styles.box, pressed && styles.pressed]}>
        <AppText variant="sm" color={current ? colors.ink : "rgba(141,144,165,0.7)"} numberOfLines={1} style={styles.value}>
          {current?.label ?? placeholder}
        </AppText>
        <ChevronDown size={16} color={colors.muted} />
      </Pressable>
      <Sheet open={open} onClose={() => setOpen(false)} title={label} maxHeight={0.7}>
        <View style={styles.list}>
          {options.map((o) => {
            const selected = o.value === value;
            return (
              <Pressable
                key={o.value || "__empty"}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                style={({ pressed }) => [styles.option, selected && styles.optionOn, pressed && styles.pressed]}
              >
                <AppText variant="body" color={selected ? "#fff" : colors.subtle}>
                  {o.label}
                </AppText>
                {selected && <Check size={18} color={colors.accentBright} />}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  box: {
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.glass,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  value: { flex: 1 },
  pressed: { opacity: 0.75 },
  list: { gap: 4 },
  option: { height: 48, borderRadius: radius.md, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  optionOn: { backgroundColor: "rgba(196,181,253,0.12)" },
});
