import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { colors } from "@/theme";
import { AppText } from "./AppText";

export type ChartSeries = { key: string; label: string; color: string };
export type ChartRow = { label: string; values: Record<string, number> };

/** Validated pair for success/failure stacks on the dark surface (same as the web). */
export const CHART_COLORS = { series1: "#3987e5", critical: "#d03b3b" } as const;

/**
 * Small column chart (single or stacked series), as the web's BarChart: ≤24px columns with a
 * rounded data end, a legend for 2+ series, and tap-to-inspect instead of hover.
 */
export function BarChart({
  rows,
  series,
  height = 120,
  format = (n: number) => n.toLocaleString(),
  title,
}: {
  rows: ChartRow[];
  series: ChartSeries[];
  height?: number;
  format?: (n: number) => string;
  title: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const totals = rows.map((r) => series.reduce((s, x) => s + (r.values[x.key] ?? 0), 0));
  const max = Math.max(1, ...totals);
  const current = active !== null ? rows[active] : null;

  return (
    <View style={styles.wrap} accessibilityLabel={`${title}: ${rows.map((r, i) => `${r.label} ${format(totals[i])}`).join(", ")}`}>
      <View style={styles.head}>
        <AppText variant="xs" color={colors.muted}>
          {title}
        </AppText>
        {series.length > 1 && (
          <View style={styles.legend}>
            {series.map((s) => (
              <View key={s.key} style={styles.legendItem}>
                <View style={[styles.legendSwatch, { backgroundColor: s.color }]} />
                <AppText variant="micro" color={colors.subtle}>
                  {s.label}
                </AppText>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={{ height }}>
        <View style={styles.topLine} />
        <View style={styles.baseLine} />
        <AppText variant="micro" color={colors.muted} style={styles.max}>
          {format(max)}
        </AppText>
        <View style={styles.columns}>
          {rows.map((r, i) => (
            <Pressable key={r.label} onPress={() => setActive(active === i ? null : i)} style={styles.column} accessibilityLabel={`${r.label}: ${format(totals[i])}`}>
              <View style={[styles.stack, active !== null && active !== i && styles.dim]}>
                {series.map((s, si) => {
                  const v = r.values[s.key] ?? 0;
                  if (!v) return null;
                  const top = series.slice(si + 1).every((x) => !(r.values[x.key] ?? 0));
                  return <View key={s.key} style={[{ height: Math.max(2, (v / max) * (height - 4)), backgroundColor: s.color }, top && styles.topRadius]} />;
                })}
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.axis}>
        <AppText variant="micro" color={colors.muted}>
          {rows[0]?.label}
        </AppText>
        {current ? (
          <AppText variant="micro" color={colors.ink}>
            {current.label}: {series.map((s) => format(current.values[s.key] ?? 0)).join(" / ")}
          </AppText>
        ) : null}
        <AppText variant="micro" color={colors.muted}>
          {rows[rows.length - 1]?.label}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  head: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 },
  legend: { flexDirection: "row", gap: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendSwatch: { width: 10, height: 10, borderRadius: 2 },
  topLine: { position: "absolute", top: 0, left: 0, right: 0, borderTopWidth: 1, borderStyle: "dashed", borderColor: "rgba(255,255,255,0.06)" },
  baseLine: { position: "absolute", bottom: 0, left: 0, right: 0, borderTopWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  max: { position: "absolute", top: -16, right: 0 },
  columns: { ...StyleSheet.absoluteFill, flexDirection: "row", alignItems: "flex-end", gap: 2 },
  column: { flex: 1, height: "100%", alignItems: "center", justifyContent: "flex-end" },
  stack: { width: "100%", maxWidth: 24, flexDirection: "column-reverse", gap: 2 },
  dim: { opacity: 0.6 },
  topRadius: { borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  axis: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
});
