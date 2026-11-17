import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useScrollToTop } from "expo-router";
import { Plus, Search, SearchX, Shirt, X } from "lucide-react-native";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "@/components/layout/Screen";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Chip, TabSwitch } from "@/components/ui/Chip";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { Notice } from "@/components/ui/Notice";
import { ErrorState, Loader } from "@/components/ui/States";
import { WARDROBE_CATEGORIES, wardrobeContent as copy } from "@/data/studio-content";
import { AppHeader } from "@/features/app/AppHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import { isUnworn } from "@/features/wardrobe/combos";
import { AddItemSheet } from "@/features/wardrobe/components/AddItemSheet";
import { InsightsPanel } from "@/features/wardrobe/components/InsightsPanel";
import { ItemCard } from "@/features/wardrobe/components/ItemCard";
import { ItemDetailSheet } from "@/features/wardrobe/components/ItemDetailSheet";
import { OccasionPlanner } from "@/features/wardrobe/components/OccasionPlanner";
import { PriceSheet } from "@/features/wardrobe/components/PriceSheet";
import { TodayStyleWidget } from "@/features/wardrobe/components/TodayStyleWidget";
import { workspaceApi, type WardrobeItem } from "@/features/workspace/api";
import { useWardrobe, useWardrobeCache } from "@/features/workspace/hooks";
import { errorMessage } from "@/lib/api/client";
import { colors, fonts, gradients, GUTTER, radius, TAB_BAR_HEIGHT } from "@/theme";

// Same three sections as the web's Wardrobe page (User-Panel/src/features/wardrobe/WardrobeView.tsx).
const TABS = [
  { id: "items", label: "My Wardrobe" },
  { id: "planner", label: "Outfit Planner" },
  { id: "insights", label: "Insights" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export default function WardrobeScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(TABS.some((t) => t.id === params.tab) ? (params.tab as Tab) : "items");
  const bottom = TAB_BAR_HEIGHT + insets.bottom + 16;
  const wardrobe = useWardrobe();

  const tabs = <TabSwitch value={tab} onChange={setTab} options={TABS} />;

  if (tab === "insights") {
    return (
      <Screen header={<AppHeader />} tabBar>
        <View style={styles.stack}>
          {tabs}
          <InsightsPanel />
        </View>
      </Screen>
    );
  }
  if (tab === "planner") {
    return (
      <Screen header={<AppHeader />} tabBar keyboard>
        <View style={styles.stack}>
          {tabs}
          <OccasionPlanner items={wardrobe.data ?? []} />
        </View>
      </Screen>
    );
  }
  return (
    <Screen header={<AppHeader />} scroll={false} padded={false}>
      <ItemsTab tabs={tabs} bottom={bottom} />
    </Screen>
  );
}

function ItemsTab({ tabs, bottom }: { tabs: ReactNode; bottom: number }) {
  const { token } = useAuth();
  const wardrobe = useWardrobe();
  const cache = useWardrobeCache();
  const items = useMemo(() => wardrobe.data ?? [], [wardrobe.data]);
  const listRef = useRef<FlatList<WardrobeItem | typeof ADD>>(null);
  useScrollToTop(listRef);

  const [adding, setAdding] = useState(false);
  const [category, setCategory] = useState<string>(copy.all);
  const [query, setQuery] = useState("");
  const [unwornOnly, setUnwornOnly] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [pricing, setPricing] = useState<WardrobeItem | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewing = items.find((i) => i.id === viewingId) ?? null;

  const present = useMemo(() => WARDROBE_CATEGORIES.filter((c) => items.some((i) => i.category === c)), [items]);
  const unwornCount = useMemo(() => items.filter(isUnworn).length, [items]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) =>
        (category === copy.all || i.category === category) &&
        (!unwornOnly || isUnworn(i)) &&
        (!q || i.name.toLowerCase().includes(q) || i.brand?.toLowerCase().includes(q) || i.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }, [items, category, query, unwornOnly]);

  const act = async (id: string, fn: (t: string) => Promise<WardrobeItem | void>) => {
    if (!token) return;
    setBusy(id);
    setActionError("");
    try {
      const next = await fn(token);
      if (next) cache.upsert(next);
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };
  const remove = (item: WardrobeItem) =>
    act(item.id, async (t) => {
      await workspaceApi.removeWardrobeItem(t, item.id);
      cache.remove(item.id);
    });
  const clear = () => {
    setQuery("");
    setCategory(copy.all);
    setUnwornOnly(false);
  };

  if (wardrobe.isLoading) {
    return (
      <View style={styles.pad}>
        {tabs}
        <Loader />
      </View>
    );
  }
  if (wardrobe.isError) {
    return (
      <View style={styles.pad}>
        {tabs}
        <ErrorState message={errorMessage(wardrobe.error)} onRetry={() => wardrobe.refetch()} />
      </View>
    );
  }

  const header = (
    <View style={styles.header}>
      {tabs}
      {items.length > 0 && (
        <>
          <TodayStyleWidget items={items} />
          <View style={styles.search}>
            <Search size={16} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={copy.searchPlaceholder}
              placeholderTextColor="rgba(141,144,165,0.7)"
              selectionColor={colors.accentBright}
              style={styles.searchInput}
              accessibilityLabel={copy.searchPlaceholder}
            />
            {query ? (
              <Pressable onPress={() => setQuery("")} hitSlop={8} accessibilityLabel="Clear search">
                <X size={16} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Chip size="sm" label={`All · ${items.length}`} selected={category === copy.all} onPress={() => setCategory(copy.all)} />
            {present.map((c) => (
              <Chip key={c} size="sm" label={`${c} · ${items.filter((i) => i.category === c).length}`} selected={category === c} onPress={() => setCategory(c)} />
            ))}
            <Pressable onPress={() => setUnwornOnly((v) => !v)} accessibilityState={{ selected: unwornOnly }} accessibilityLabel="Show items unworn for 90+ days" style={[styles.unworn, unwornOnly && styles.unwornOn]}>
              <AppText variant="xs" weight={unwornOnly ? "medium" : undefined} color={unwornOnly ? colors.canvas : "#f6c453"}>
                Unworn 90d+{unwornCount > 0 ? ` · ${unwornCount}` : ""}
              </AppText>
            </Pressable>
          </ScrollView>
          {actionError ? <Notice tone="error">{actionError}</Notice> : null}
        </>
      )}
    </View>
  );

  // The first cell is the "Add a piece" tile, as on the web; a spacer keeps an odd last row half-width.
  const cells: (WardrobeItem | typeof ADD)[] = items.length ? [ADD, ...shown] : [];
  if (cells.length % 2) cells.push(SPACER);

  return (
    <>
      <FlatList
        ref={listRef}
        data={cells}
        keyExtractor={(i) => i.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={header}
        renderItem={({ item }) =>
          item === SPACER ? (
            <View style={styles.flex} />
          ) : item === ADD ? (
            <Pressable onPress={() => setAdding(true)} accessibilityLabel="Add a piece" style={styles.addTile}>
              <View style={styles.addIcon}>
                <LinearGradient colors={gradients.primary} style={StyleSheet.absoluteFill} />
                <Plus size={20} color={colors.btnPrimaryText} strokeWidth={2} />
              </View>
              <AppText variant="sm" color={colors.inkSoft}>
                Add a piece
              </AppText>
            </Pressable>
          ) : (
            <ItemCard item={item as WardrobeItem} onOpen={() => setViewingId(item.id)} />
          )
        }
        ListEmptyComponent={
          items.length === 0 ? (
            <GlassCard padding={28}>
              <View style={styles.empty}>
                <View style={styles.keycap}>
                  <Shirt size={22} color="#c9bcff" strokeWidth={1.75} />
                </View>
                <GradientText variant="h3" tone="chromeSoft" style={styles.centerText}>
                  {copy.emptyTitle}
                </GradientText>
                <AppText variant="sm" color={colors.muted} align="center">
                  {copy.emptyDescription}
                </AppText>
                <Button icon={Plus} onPress={() => setAdding(true)} style={styles.center}>
                  {copy.add}
                </Button>
              </View>
            </GlassCard>
          ) : undefined
        }
        ListFooterComponent={
          items.length > 0 && shown.length === 0 ? (
            <View style={styles.noMatch}>
              <SearchX size={22} color={colors.muted} strokeWidth={1.75} />
              <AppText variant="sm" color={colors.subtle}>
                Nothing in your closet matches that.
              </AppText>
              <Button variant="ghost" onPress={clear}>
                Clear filters
              </Button>
            </View>
          ) : undefined
        }
        contentContainerStyle={[styles.list, { paddingBottom: bottom }]}
        refreshControl={<RefreshControl refreshing={wardrobe.isRefetching} onRefresh={() => void wardrobe.refetch()} tintColor={colors.accentBright} colors={[colors.accentBright]} progressBackgroundColor={colors.surface} />}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      />

      <ItemDetailSheet
        item={viewing}
        busy={busy === viewing?.id}
        onClose={() => setViewingId(null)}
        onWorn={(item) => act(item.id, (t) => workspaceApi.markWorn(t, item.id))}
        onUndo={(item) => act(item.id, (t) => workspaceApi.undoWorn(t, item.id))}
        onEditPrice={(item) => setPricing(item)}
        onRemove={remove}
      />
      <AddItemSheet
        open={adding}
        onClose={() => setAdding(false)}
        onAdded={(item) => {
          cache.upsert(item);
          setAdding(false);
        }}
      />
      <PriceSheet
        item={pricing}
        onClose={() => setPricing(null)}
        onSaved={(next) => {
          cache.upsert(next);
          setPricing(null);
        }}
      />
    </>
  );
}

const ADD = { id: "__add" } as const;
const SPACER = { id: "__spacer" } as WardrobeItem;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  stack: { gap: 20 },
  pad: { paddingHorizontal: GUTTER, gap: 16 },
  center: { alignSelf: "center" },
  centerText: { textAlign: "center" },
  list: { paddingHorizontal: GUTTER },
  header: { gap: 14, marginBottom: 18 },
  search: { height: 48, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.glass },
  searchInput: { flex: 1, color: colors.ink, fontFamily: fonts.regular, fontSize: 15, paddingVertical: 0 },
  chips: { gap: 8 },
  unworn: { height: 36, justifyContent: "center", paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.04)" },
  unwornOn: { backgroundColor: "#f6c453", borderColor: "transparent" },
  row: { gap: 12, marginBottom: 18 },
  addTile: { flex: 1, aspectRatio: 3 / 4, borderRadius: 18, borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(127,98,246,0.4)", backgroundColor: "rgba(102,69,235,0.08)", alignItems: "center", justifyContent: "center", gap: 12 },
  addIcon: { width: 48, height: 48, borderRadius: 24, overflow: "hidden", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(127,98,246,0.45)" },
  empty: { alignItems: "center", gap: 12 },
  keycap: { width: 56, height: 56, borderRadius: radius.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(201,188,255,0.3)", backgroundColor: "rgba(102,69,235,0.15)" },
  noMatch: { alignItems: "center", gap: 10, marginTop: 8, borderRadius: radius.panel, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)", paddingVertical: 28 },
});
