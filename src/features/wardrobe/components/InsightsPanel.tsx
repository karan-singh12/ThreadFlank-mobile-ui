import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { TrendingDown, TrendingUp } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { BarChart, CHART_COLORS } from "@/components/ui/BarChart";
import { GlassCard } from "@/components/ui/GlassCard";
import { Notice } from "@/components/ui/Notice";
import { Photo } from "@/components/ui/Photo";
import { Loader } from "@/components/ui/States";
import { useAuth } from "@/features/auth/AuthProvider";
import { workspaceApi, type AnalyticsRow } from "@/features/workspace/api";
import { errorMessage } from "@/lib/api/client";
import { rupees } from "@/lib/format";
import { queryKeys } from "@/lib/queryKeys";
import { colors, radius } from "@/theme";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const money = (n: number | null | undefined) => (n == null ? "—" : rupees(n));

/** Wardrobe value, cost-per-wear and under-used items. */
export function InsightsPanel() {
  const { token } = useAuth();
  const query = useQuery({ queryKey: queryKeys.analytics(token), queryFn: () => workspaceApi.wardrobeAnalytics(token!), enabled: Boolean(token) });

  if (query.isError) return <Notice tone="error">{errorMessage(query.error)}</Notice>;
  if (!query.data) return <Loader />;

  const data = query.data;
  const t = data.totals;
  if (t.items === 0) return <Notice>Add items to your wardrobe to see insights.</Notice>;

  return (
    <View style={styles.wrap}>
      <View style={styles.tiles}>
        <Tile label="Wardrobe value" value={money(t.totalValue)} hint={`${t.pricedItems} of ${t.items} items priced`} />
        <Tile label="Average cost per wear" value={money(t.averageCostPerWear)} hint="across priced items" />
        <Tile label="Total wears logged" value={t.totalWears.toLocaleString()} hint={`${t.neverWornCount} never worn`} />
        <Tile label={`Unworn ${t.unwornDays}+ days`} value={String(t.unwornCount)} hint="give these an outing" />
      </View>

      {t.pricedItems < t.items && <Notice>Add what you paid to more items in My items to get a truer cost per wear.</Notice>}

      <GlassCard>
        <BarChart
          title="Wears logged per month"
          height={140}
          rows={data.wearsByMonth.map((m) => ({ label: `${MONTHS[Number(m.month.slice(5, 7)) - 1]} ${m.month.slice(2, 4)}`, values: { wears: m.wears } }))}
          series={[{ key: "wears", label: "Wears", color: CHART_COLORS.series1 }]}
        />
      </GlassCard>

      <RankList title="Best value" icon={<TrendingDown size={16} color={colors.green} />} rows={data.bestValue} empty="Log a few wears on priced items to see this." />
      <RankList title="Highest cost per wear" icon={<TrendingUp size={16} color="#fde68a" />} rows={data.worstValue} empty="Add prices to your items to see this." />

      <View style={styles.section}>
        <AppText variant="body" weight="medium">
          Waiting for an outing
        </AppText>
        <AppText variant="sm" color={colors.muted}>
          Not worn in {t.unwornDays}+ days. Try them in a new combination.
        </AppText>
        {data.unworn.length === 0 ? (
          <AppText variant="sm" color={colors.muted} style={styles.gap}>
            Nothing — you&apos;re getting good use out of your wardrobe.
          </AppText>
        ) : (
          <View style={styles.unworn}>
            {data.unworn.map((r) => (
              <Pressable key={r.id} onPress={() => router.navigate({ pathname: "/drape", params: { item: r.id } })} style={styles.unwornItem}>
                <View style={styles.unwornImage}>
                  <Photo src={r.image} alt={r.name} fit="contain" style={StyleSheet.absoluteFill} />
                </View>
                <AppText variant="xs" numberOfLines={1} style={styles.pad}>
                  {r.name}
                </AppText>
                <AppText variant="micro" color={colors.muted} style={styles.padBottom}>
                  {r.daysSinceWorn != null ? `${r.daysSinceWorn} days ago` : "Never worn"}
                </AppText>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <GlassCard>
        <AppText variant="body" weight="medium" style={styles.tableTitle}>
          By category
        </AppText>
        <View style={styles.tableRow}>
          {["Category", "Items", "Wears", "Value"].map((h, i) => (
            <AppText key={h} variant="label" color={colors.muted} style={i === 0 ? styles.cellWide : styles.cell}>
              {h}
            </AppText>
          ))}
        </View>
        {data.byCategory.map((c) => (
          <View key={c.category} style={[styles.tableRow, styles.tableBorder]}>
            <AppText variant="sm" style={styles.cellWide}>
              {c.category}
            </AppText>
            <AppText variant="sm" color={colors.subtle} style={styles.cell}>
              {c.items}
            </AppText>
            <AppText variant="sm" color={colors.subtle} style={styles.cell}>
              {c.wears}
            </AppText>
            <AppText variant="sm" color={colors.subtle} style={styles.cell}>
              {money(c.value)}
            </AppText>
          </View>
        ))}
      </GlassCard>
    </View>
  );
}

function Tile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <GlassCard padding={14} radius={radius.card} style={styles.tile}>
      <AppText variant="micro" color={colors.muted} style={styles.tileLabel}>
        {label}
      </AppText>
      <AppText style={styles.tileValue} weight="medium">
        {value}
      </AppText>
      <AppText variant="xs" color={colors.muted}>
        {hint}
      </AppText>
    </GlassCard>
  );
}

function RankList({ title, icon, rows, empty }: { title: string; icon: ReactNode; rows: AnalyticsRow[]; empty: string }) {
  return (
    <GlassCard>
      <View style={styles.rankTitle}>
        {icon}
        <AppText variant="body" weight="medium">
          {title}
        </AppText>
      </View>
      {rows.length === 0 ? (
        <AppText variant="sm" color={colors.muted} style={styles.gap}>
          {empty}
        </AppText>
      ) : (
        <View style={styles.rankList}>
          {rows.map((r) => (
            <View key={r.id} style={styles.rankRow}>
              <View style={styles.rankThumb}>
                <Photo src={r.image} alt="" fit="contain" style={StyleSheet.absoluteFill} />
              </View>
              <View style={styles.flex}>
                <AppText variant="sm" numberOfLines={1}>
                  {r.name}
                </AppText>
                <AppText variant="xs" color={colors.muted}>
                  {money(r.costPaid)} · worn {r.wornCount}×
                </AppText>
              </View>
              <AppText variant="sm">{money(r.costPerWear)}</AppText>
            </View>
          ))}
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  flex: { flex: 1 },
  gap: { marginTop: 12 },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: { width: "48.5%" },
  tileLabel: { textTransform: "uppercase", letterSpacing: 0.9 },
  tileValue: { fontSize: 24, lineHeight: 30, marginTop: 4, color: "#fff" },
  section: { gap: 4 },
  unworn: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  unwornItem: { width: "31%", borderRadius: radius.md, overflow: "hidden", borderWidth: 1, borderColor: colors.lineSoft, backgroundColor: "rgba(255,255,255,0.02)" },
  unwornImage: { aspectRatio: 3 / 4, backgroundColor: "rgba(255,255,255,0.05)" },
  pad: { paddingHorizontal: 8, paddingTop: 6 },
  padBottom: { paddingHorizontal: 8, paddingBottom: 8 },
  tableTitle: { marginBottom: 8 },
  tableRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  tableBorder: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" },
  cellWide: { flex: 1.6 },
  cell: { flex: 1, textAlign: "right" },
  rankTitle: { flexDirection: "row", alignItems: "center", gap: 8 },
  rankList: { marginTop: 12, gap: 10 },
  rankRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  rankThumb: { width: 40, height: 40, borderRadius: 8, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.05)" },
});
