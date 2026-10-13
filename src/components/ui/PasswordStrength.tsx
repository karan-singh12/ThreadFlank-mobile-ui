import { StyleSheet, View } from "react-native";
import { colors } from "@/theme";
import { AppText } from "./AppText";

const LEVELS = [
  { label: "Too weak", bar: "#f87171" },
  { label: "Weak", bar: "#fb923c" },
  { label: "Fair", bar: "#fde047" },
  { label: "Good", bar: colors.cyan },
  { label: "Strong", bar: colors.green },
];

export function scorePassword(value: string) {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return Math.min(score, 4);
}

export function PasswordStrength({ value }: { value: string }) {
  if (!value) return null;
  const score = scorePassword(value);
  const level = LEVELS[score];
  return (
    <View style={styles.row} accessibilityLiveRegion="polite">
      <View style={styles.bars}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.bar, { backgroundColor: i < Math.max(score, 1) ? level.bar : "rgba(255,255,255,0.1)" }]} />
        ))}
      </View>
      <AppText variant="xs" color={colors.muted} style={styles.label}>
        {level.label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  bars: { flex: 1, flexDirection: "row", gap: 6 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  label: { width: 64, textAlign: "right" },
});
