import { CircleAlert, CircleCheck, Info } from "lucide-react-native";
import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius } from "@/theme";
import { AppText } from "./AppText";

type Tone = "info" | "error" | "success" | "warning";

const TONES: Record<Tone, { border: string; bg: string; text: string; icon: typeof Info }> = {
  info: { border: colors.line, bg: colors.glass, text: colors.subtle, icon: Info },
  error: { border: "rgba(248,113,113,0.3)", bg: "rgba(239,68,68,0.1)", text: "#fecaca", icon: CircleAlert },
  success: { border: "rgba(40,230,157,0.3)", bg: "rgba(40,230,157,0.1)", text: colors.green, icon: CircleCheck },
  warning: { border: "rgba(253,230,138,0.3)", bg: "rgba(251,191,36,0.1)", text: colors.amber, icon: CircleAlert },
};

/** Inline status message (web `Notice` / `FormAlert`). */
export function Notice({ tone = "info", children, icon = true, style }: { tone?: Tone; children: ReactNode; icon?: boolean; style?: StyleProp<ViewStyle> }) {
  const t = TONES[tone];
  const Icon = t.icon;
  return (
    <View
      accessibilityRole={tone === "error" ? "alert" : undefined}
      style={[styles.box, { borderColor: t.border, backgroundColor: t.bg }, style]}
    >
      {icon && <Icon size={18} strokeWidth={1.75} color={t.text} style={styles.icon} />}
      <View style={styles.body}>
        {typeof children === "string" ? (
          <AppText variant="sm" color={t.text}>
            {children}
          </AppText>
        ) : (
          children
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: "row", gap: 10, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 11 },
  icon: { marginTop: 2 },
  body: { flex: 1 },
});
