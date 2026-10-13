import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { GradientText } from "@/components/ui/GradientText";
import { colors } from "@/theme";

/** Page heading: chrome title with a muted description and optional trailing action. */
export function PageTitle({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <GradientText variant="h2">{title}</GradientText>
        {description && (
          <AppText variant="sm" color={colors.muted}>
            {description}
          </AppText>
        )}
      </View>
      {action}
    </View>
  );
}

/** Small uppercase section label (web `text-xs uppercase tracking-[0.08em] text-muted`). */
export function SectionLabel({ children, action }: { children: string; action?: ReactNode }) {
  return (
    <View style={styles.labelRow}>
      <AppText variant="label" color={colors.muted}>
        {children}
      </AppText>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  text: { flex: 1, gap: 4 },
  labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
