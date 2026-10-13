import { Check } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { colors } from "@/theme";
import { AppText } from "./AppText";

type Props = { checked: boolean; onChange: (checked: boolean) => void; label: ReactNode; error?: string };

export function Checkbox({ checked, onChange, label, error }: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => onChange(!checked)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        style={styles.row}
        hitSlop={4}
      >
        <View style={[styles.box, checked && styles.boxOn, error ? styles.boxError : null]}>
          {checked && <Check size={14} strokeWidth={3} color="#fff" />}
        </View>
        <View style={styles.label}>{typeof label === "string" ? <AppText variant="sm" color={colors.subtle}>{label}</AppText> : label}</View>
      </Pressable>
      {error && (
        <AppText variant="xs" color={colors.red}>
          {error}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  box: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  boxOn: { backgroundColor: colors.accent, borderColor: colors.accentBright },
  boxError: { borderColor: "rgba(248,113,113,0.6)" },
  label: { flex: 1 },
});
