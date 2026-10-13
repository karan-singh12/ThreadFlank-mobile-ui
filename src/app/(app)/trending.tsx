import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Flame, Heart, MessageCircle, Sparkles } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Screen } from "@/components/layout/Screen";
import { StackHeader } from "@/components/layout/StackHeader";
import { AppText } from "@/components/ui/AppText";
import { Chip } from "@/components/ui/Chip";
import { GradientText } from "@/components/ui/GradientText";
import { Photo } from "@/components/ui/Photo";
import { Loader } from "@/components/ui/States";
import { useAuth } from "@/features/auth/AuthProvider";
import { discoverApi, type ApiBrandPost } from "@/features/discover/api";
import { drapeParams } from "@/features/discover/model";
import { colors, radius } from "@/theme";

const HOUR = 3_600_000;

/** Engagement with a time decay, so a fresh drop with momentum beats last month's hit. */
function score(p: ApiBrandPost) {
  const ageHours = Math.max(1, (Date.now() - new Date(p.publishedAt).getTime()) / HOUR);
  return (p.likesCount + p.commentsCount * 3 + 1) / Math.pow(ageHours + 2, 0.8);
}

/** The brand drops getting the most attention right now (web /trending). */
export default function TrendingScreen() {
  const { token } = useAuth();
  const [category, setCategory] = useState("All");
  const query = useQuery({ queryKey: ["trending", token], queryFn: async () => (await discoverApi.listBrandPosts(token, { limit: 60 })).posts, enabled: Boolean(token) });

  const ranked = useMemo(() => [...(query.data ?? [])].sort((a, b) => score(b) - score(a)), [query.data]);
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of ranked.slice(0, 30)) if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [ranked]);
  const shown = ranked.filter((p) => category === "All" || p.category === category).slice(0, 24);

  return (
    <Screen header={<StackHeader title="Trending" />} onRefresh={() => query.refetch()} refreshing={query.isRefetching}>
      <View style={styles.titleBlock}>
        <View style={styles.titleRow}>
          <Flame size={28} color="#fcd34d" />
          <GradientText variant="h2">Trending now</GradientText>
        </View>
        <AppText variant="sm" color={colors.muted}>
          The drops people are liking, discussing and draping this week.
        </AppText>
      </View>

      {categories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {[["All", ranked.length] as [string, number], ...categories].map(([c, n]) => (
            <Chip key={c} label={`#${c.toLowerCase().replace(/\s+/g, "")} ${n}`} selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </ScrollView>
      )}

      {query.isLoading ? (
        <Loader />
      ) : shown.length === 0 ? (
        <AppText variant="sm" color={colors.muted} align="center" style={styles.empty}>
          Nothing trending yet — check Discover for the latest drops.
        </AppText>
      ) : (
        <View style={styles.grid}>
          {shown.map((p, i) => {
            const image = p.images?.[0] ?? "";
            return (
              <Pressable key={p.id} onPress={() => router.push({ pathname: "/post/[id]", params: { id: p.id } })} style={styles.tile}>
                <View style={styles.media}>
                  {image ? <Photo src={image} alt={p.title ?? p.caption} style={StyleSheet.absoluteFill} /> : null}
                  <View style={[styles.rank, i < 3 ? styles.rankTop : null]}>
                    <AppText variant="sm" weight="semibold" color={i < 3 ? colors.canvas : "#fff"}>
                      {i + 1}
                    </AppText>
                  </View>
                  <Pressable onPress={() => router.push(drapeParams(image, p.brand.name, p.title || p.caption))} style={styles.try}>
                    <Sparkles size={14} color={colors.canvas} />
                    <AppText variant="xs" weight="medium" color={colors.canvas}>
                      Try on your twin
                    </AppText>
                  </Pressable>
                </View>
                <View style={styles.info}>
                  <AppText variant="sm" numberOfLines={1}>
                    {p.brand.name}
                  </AppText>
                  <AppText variant="xs" color={colors.muted} numberOfLines={1}>
                    {p.title || p.caption}
                  </AppText>
                  <View style={styles.stats}>
                    <View style={styles.stat}>
                      <Heart size={12} color={colors.subtle} />
                      <AppText variant="micro" color={colors.subtle}>
                        {p.likesCount}
                      </AppText>
                    </View>
                    <View style={styles.stat}>
                      <MessageCircle size={12} color={colors.subtle} />
                      <AppText variant="micro" color={colors.subtle}>
                        {p.commentsCount}
                      </AppText>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleBlock: { gap: 6 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  chips: { gap: 8 },
  empty: { marginTop: 32 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: { width: "47.8%", borderRadius: radius.card, overflow: "hidden", borderWidth: 1, borderColor: colors.lineSoft, backgroundColor: "rgba(255,255,255,0.02)" },
  media: { aspectRatio: 4 / 5, backgroundColor: colors.glass },
  rank: { position: "absolute", top: 8, left: 8, width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.6)" },
  rankTop: { backgroundColor: "#fcd34d" },
  try: { position: "absolute", left: 8, right: 8, bottom: 8, height: 34, borderRadius: 17, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#fff" },
  info: { padding: 12, gap: 2 },
  stats: { flexDirection: "row", gap: 12, marginTop: 6 },
  stat: { flexDirection: "row", alignItems: "center", gap: 4 },
});
