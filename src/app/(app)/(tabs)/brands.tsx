import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ArrowUpRight, CalendarClock, Search, SearchX, ShieldCheck, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Pressable } from "@/components/ui/Pressable";
import { Screen } from "@/components/layout/Screen";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { GradientText } from "@/components/ui/GradientText";
import { Photo } from "@/components/ui/Photo";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";
import { AppHeader } from "@/features/app/AppHeader";
import { BrandBanner, BrandLogo, brandAccent, monogram } from "@/features/brands/BrandVisuals";
import { discoverApi, type ApiBrandCard, type ApiSpotlight, type DirectorySort } from "@/features/discover/api";
import { errorMessage } from "@/lib/api/client";
import { colors, fonts, GUTTER, radius } from "@/theme";

// Same directory as the web's /brands page (User-Panel/src/features/brands/BrandsView.tsx).
const PAGE_SIZE = 24;
const SORTS: { value: DirectorySort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "new", label: "Newest" },
  { value: "az", label: "A–Z" },
];
const pieces = (n: number) => `${n.toLocaleString("en-IN")} ${n === 1 ? "piece" : "pieces"}`;
const dropIn = (iso: string) => {
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  return days <= 1 ? "Drop tomorrow" : `Drop in ${days} days`;
};
const openStore = (slug: string) => router.push({ pathname: "/brand/[slug]", params: { slug } });

type Loaded = { key: string; items: ApiBrandCard[]; page: number; hasMore: boolean; total: number; error: string };

export default function BrandsScreen() {
  const [q, setQ] = useState("");
  const [text, setText] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<DirectorySort>("featured");
  const key = `${q}|${category}|${sort}`;
  const [reload, setReload] = useState(0);

  // Typing is instant; the request follows 350ms after the last keystroke.
  useEffect(() => {
    if (text.trim() === q) return;
    const t = setTimeout(() => setQ(text.trim()), 350);
    return () => clearTimeout(t);
  }, [text, q]);

  const [chips, setChips] = useState<{ name: string; count: number }[]>([]);
  const [spotlight, setSpotlight] = useState<ApiSpotlight["brands"]>([]);
  useEffect(() => {
    let live = true;
    discoverApi.directoryCategories().then((c) => live && setChips(c));
    discoverApi.spotlight().then((s) => live && setSpotlight(s.brands));
    return () => {
      live = false;
    };
  }, [reload]);

  const [data, setData] = useState<Loaded | null>(null);
  const [more, setMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    const ctrl = new AbortController();
    discoverApi
      .directory({ page: 1, limit: PAGE_SIZE, q, category, sort }, ctrl.signal)
      .then((r) => setData({ key, items: r.items, page: 1, hasMore: r.hasMore, total: r.total, error: "" }))
      .catch((e) => {
        if (!ctrl.signal.aborted) setData({ key, items: [], page: 1, hasMore: false, total: 0, error: errorMessage(e, "We couldn't load brands.") });
      })
      .finally(() => setRefreshing(false));
    return () => ctrl.abort();
  }, [key, q, category, sort, reload]);

  const current = data && data.key === key ? data : null;
  const loadMore = useCallback(() => {
    if (!current || !current.hasMore || more) return;
    setMore(true);
    discoverApi
      .directory({ page: current.page + 1, limit: PAGE_SIZE, q, category, sort })
      .then((r) => setData((d) => (d && d.key === key ? { ...d, items: [...d.items, ...r.items.filter((x) => !d.items.some((y) => y.id === x.id))], page: r.page, hasMore: r.hasMore, total: r.total } : d)))
      .catch(() => setData((d) => (d && d.key === key ? { ...d, hasMore: false, error: "We couldn't load more brands." } : d)))
      .finally(() => setMore(false));
  }, [current, more, q, category, sort, key]);

  const filtered = Boolean(q || category);
  const total = current?.total ?? 0;
  const chipList = useMemo(() => [{ name: "", count: 0 }, ...chips], [chips]);
  const reset = () => {
    setText("");
    setQ("");
    setCategory("");
  };

  const header = (
    <View style={styles.header}>
      <View style={styles.titleBlock}>
        <AppText variant="label" color={colors.cyan}>
          BRANDS
        </AppText>
        <GradientText variant="h2">Every house, on you first</GradientText>
        <AppText variant="sm" color={colors.muted}>
          Step into a brand&apos;s store and drape any piece on your own selfie before you buy.
        </AppText>
      </View>

      <View style={styles.search}>
        <Search size={16} color={colors.muted} />
        <TextInput value={text} onChangeText={setText} placeholder="Search brands by name…" placeholderTextColor={colors.muted} returnKeyType="search" style={styles.searchInput} accessibilityLabel="Search brands" />
        {text ? (
          <Pressable onPress={() => setText("")} hitSlop={8} accessibilityLabel="Clear search">
            <X size={15} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      {!filtered && spotlight.length > 0 && (
        <View style={styles.spotlight}>
          <AppText variant="label" color="#f6c453">
            BRANDS OF THE MONTH
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {spotlight.map((s) => (
              <Pressable key={s.brand.id} onPress={() => openStore(s.brand.slug)} style={styles.spotPill}>
                <BrandLogo src={s.brand.logoUrl} name={s.brand.name} size={40} />
                <View>
                  <View style={styles.row}>
                    <AppText variant="sm" weight="medium">
                      {s.brand.name}
                    </AppText>
                    {s.brand.isVerified && <ShieldCheck size={13} color={colors.accentBright} />}
                  </View>
                  <AppText variant="micro" color={colors.subtle}>
                    #{s.rank} · {s.category || s.slot}
                  </AppText>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow} style={styles.flex}>
          {chipList.map((c) => (
            <Chip key={c.name || "all"} size="sm" label={c.name ? `${c.name}  ${c.count}` : "All brands"} selected={category.toLowerCase() === c.name.toLowerCase()} onPress={() => setCategory(c.name)} />
          ))}
        </ScrollView>
      </View>
      <Select label="Sort brands" value={sort} options={SORTS} onChange={(v) => setSort(v as DirectorySort)} />

      {current && !current.error ? (
        <AppText variant="xs" color={colors.muted}>
          {total.toLocaleString("en-IN")} {total === 1 ? "brand" : "brands"}
          {filtered ? " match" : ""}
        </AppText>
      ) : null}
    </View>
  );

  const empty = !current ? (
    <View style={styles.skPlates} accessibilityLabel="Loading brands">
      {[0, 1].map((i) => (
        <View key={i} style={styles.skPlate}>
          <Skeleton radius={26} style={styles.skPlateArt} />
          <View style={styles.plateMeta}>
            <Skeleton width={64} height={10} radius={5} />
            <Skeleton width={88} height={14} radius={7} />
          </View>
        </View>
      ))}
    </View>
  ) : current.error ? (
    <EmptyState icon={SearchX} title="We couldn't load brands" description={current.error} action={<Button onPress={() => setReload((n) => n + 1)}>Try again</Button>} />
  ) : (
    <EmptyState
      icon={SearchX}
      title={filtered ? "No brands match that" : "No brands yet"}
      description={filtered ? "Try another name or category, or reset the filters." : "Partner brands will show up here as soon as they go live."}
      action={filtered ? <Button onPress={reset}>Reset filters</Button> : undefined}
    />
  );

  return (
    <Screen header={<AppHeader />} scroll={false} padded={false} tabBar>
      <FlatList
        data={current?.items ?? []}
        keyExtractor={(b) => b.id}
        renderItem={({ item }) => <BrandPlate brand={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={
          current && current.items.length > 0 ? (
            <View style={styles.loading}>
              {more ? <ActivityIndicator color={colors.subtle} /> : null}
              {!current.hasMore && current.items.length > PAGE_SIZE ? (
                <AppText variant="xs" color={colors.muted}>
                  You&apos;ve seen all {total.toLocaleString("en-IN")} brands
                </AppText>
              ) : null}
              {current.error ? (
                <AppText variant="xs" color="#fca5a5">
                  {current.error}
                </AppText>
              ) : null}
            </View>
          ) : undefined
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setReload((n) => n + 1);
            }}
            tintColor={colors.accentBright}
            colors={[colors.accentBright]}
            progressBackgroundColor={colors.surface}
          />
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

/** A tall plate that reads like the brand's own lookbook cover; the whole card opens its store. */
function BrandPlate({ brand }: { brand: ApiBrandCard }) {
  const accent = brandAccent(brand.themeAccent);
  const deck = brand.previews.filter((p) => p.image).slice(0, 3);
  return (
    <Pressable onPress={() => openStore(brand.slug)} accessibilityRole="link" accessibilityLabel={`Open ${brand.name}`} style={styles.plateWrap}>
      <View style={styles.plate}>
        <View style={styles.plateArt}>
          <BrandBanner src={brand.banner} accent={accent} />
          <LinearGradient colors={["rgba(1,2,20,0.35)", "rgba(1,2,20,0.05)", "rgba(1,2,20,0.55)", "rgba(1,2,20,0.96)"]} locations={[0, 0.3, 0.6, 1]} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={["transparent", `${accent}59`]} locations={[0.4, 1]} style={StyleSheet.absoluteFill} />
          <AppText style={[styles.monogram, { color: accent }]}>{monogram(brand.name)}</AppText>

          <View style={styles.plateTop}>
            <BrandLogo src={brand.logo} name={brand.name} size={44} ring={accent} />
            {brand.category ? (
              <View style={styles.catPill}>
                <AppText variant="micro" color="rgba(255,255,255,0.9)">
                  {brand.category.toUpperCase()}
                </AppText>
              </View>
            ) : null}
          </View>

          {deck.length > 0 && (
            <View style={styles.deck} pointerEvents="none">
              {deck.map((item, i) => {
                const off = i - (deck.length - 1) / 2;
                return (
                  <View key={item.id} style={[styles.deckCard, { zIndex: i, transform: [{ translateX: off * 7 }, { rotate: `${off * 4.5}deg` }] }]}>
                    <Photo src={item.image} style={StyleSheet.absoluteFill} />
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.plateBottom}>
            <View style={styles.row}>
              <AppText style={styles.plateName} numberOfLines={1}>
                {brand.name}
              </AppText>
              {brand.isVerified && <ShieldCheck size={18} color={accent} accessibilityLabel="Verified brand" />}
            </View>
            {brand.tagline ? (
              <AppText variant="sm" color="rgba(255,255,255,0.7)" numberOfLines={2} style={styles.tagline}>
                {brand.tagline}
              </AppText>
            ) : null}
            {brand.nextDrop ? (
              <View style={[styles.dropPill, { backgroundColor: `${accent}47`, borderColor: `${accent}8c` }]}>
                <CalendarClock size={12} color="#fff" />
                <AppText variant="micro" color="#fff">
                  {dropIn(brand.nextDrop)}
                </AppText>
              </View>
            ) : null}
          </View>
        </View>
        {brand.announcementText ? (
          <View style={styles.announce}>
            <View style={[styles.dot, { backgroundColor: accent }]} />
            <AppText variant="xs" color={colors.subtle} numberOfLines={1} style={styles.flex}>
              {brand.announcementText}
            </AppText>
          </View>
        ) : null}
      </View>
      <View style={styles.plateMeta}>
        <AppText variant="xs" color={colors.muted}>
          {pieces(brand.piecesCount)}
        </AppText>
        <View style={styles.row}>
          <AppText variant="sm" color="rgba(255,255,255,0.85)">
            Open store
          </AppText>
          <ArrowUpRight size={16} color={accent} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  list: { paddingHorizontal: GUTTER, paddingBottom: 120 },
  header: { gap: 14, paddingTop: 8, paddingBottom: 16 },
  titleBlock: { gap: 6 },
  search: { height: 48, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.04)", paddingHorizontal: 16 },
  searchInput: { flex: 1, color: colors.ink, fontFamily: fonts.regular, fontSize: 14 },
  spotlight: { gap: 10, borderRadius: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)", padding: 14 },
  spotPill: { flexDirection: "row", alignItems: "center", gap: 10, height: 52, borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.05)", paddingLeft: 6, paddingRight: 16 },
  filterRow: { flexDirection: "row", alignItems: "center" },
  chipRow: { gap: 8, paddingRight: 4 },
  loading: { minHeight: 72, alignItems: "center", justifyContent: "center" },
  skPlates: { gap: 28 },
  skPlate: { gap: 0 },
  skPlateArt: { aspectRatio: 4 / 5 },
  plateWrap: { marginBottom: 28 },
  plate: { borderRadius: 26, overflow: "hidden", backgroundColor: "#0b0c22", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  plateArt: { aspectRatio: 4 / 5 },
  monogram: { position: "absolute", right: -6, top: 0, fontFamily: fonts.medium, fontSize: 104, lineHeight: 112, letterSpacing: -8, opacity: 0.16 },
  plateTop: { position: "absolute", left: 16, top: 16, flexDirection: "row", alignItems: "center", gap: 10 },
  catPill: { borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.08)", paddingHorizontal: 10, paddingVertical: 4 },
  deck: { position: "absolute", right: 20, bottom: 140, width: 78, height: 100 },
  deckCard: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" },
  plateBottom: { position: "absolute", left: 20, right: 20, bottom: 20 },
  plateName: { flexShrink: 1, fontFamily: fonts.medium, fontSize: 26, lineHeight: 30, letterSpacing: -0.8, color: "#fff" },
  tagline: { marginTop: 6, maxWidth: "85%" },
  dropPill: { marginTop: 10, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  announce: { flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)", paddingHorizontal: 20, paddingVertical: 10 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  plateMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10, paddingHorizontal: 4 },
});
