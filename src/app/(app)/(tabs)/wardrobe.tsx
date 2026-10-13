import { useLocalSearchParams, useScrollToTop } from "expo-router";
import { BarChart3, CheckSquare, Plus, Search, Shirt, X } from "lucide-react-native";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "@/components/layout/Screen";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { GlassCard } from "@/components/ui/GlassCard";
import { Notice } from "@/components/ui/Notice";
import { ErrorState, Loader } from "@/components/ui/States";
import { WARDROBE_CATEGORIES, wardrobeContent as copy } from "@/data/studio-content";
import { AppHeader } from "@/features/app/AppHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import { isUnworn, UNWORN_DAYS } from "@/features/wardrobe/combos";
import { AddItemSheet } from "@/features/wardrobe/components/AddItemSheet";
import { CombosPanel } from "@/features/wardrobe/components/CombosPanel";
import { InsightsPanel } from "@/features/wardrobe/components/InsightsPanel";
import { ItemCard } from "@/features/wardrobe/components/ItemCard";
import { LookBuilderSheet } from "@/features/wardrobe/components/LookBuilderSheet";
import { PlannerPanel } from "@/features/wardrobe/components/PlannerPanel";
import { PriceSheet } from "@/features/wardrobe/components/PriceSheet";
import { workspaceApi, type WardrobeItem } from "@/features/workspace/api";
import { useWardrobe, useWardrobeCache } from "@/features/workspace/hooks";
import { errorMessage } from "@/lib/api/client";
import { colors, fonts, GUTTER, radius, TAB_BAR_HEIGHT } from "@/theme";

const TABS = [
  { id: "items", label: "My items" },
  { id: "insights", label: "Insights" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export default function WardrobeScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(params.tab === "insights" ? "insights" : "items");
  const bottom = TAB_BAR_HEIGHT + insets.bottom + 16;

  const tabs = (
    <View style={styles.tabs} accessibilityRole="tablist">
      {TABS.map((t) => (
        <Pressable key={t.id} onPress={() => setTab(t.id)} accessibilityRole="tab" accessibilityState={{ selected: tab === t.id }} style={[styles.tab, tab === t.id && styles.tabOn]}>
          <AppText variant="sm" color={tab === t.id ? colors.ink : colors.muted}>
            {t.label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );

  if (tab === "insights") {
    return (
      <Screen header={<AppHeader />} tabBar>
        {tabs}
        <InsightsPanel />
      </Screen>
    );
  }
  return (
    <Screen header={<AppHeader />} scroll={false} padded={false}>
      <ItemsTab tabs={tabs} bottom={bottom} onInsights={() => setTab("insights")} />
    </Screen>
  );
}

function ItemsTab({ tabs, bottom, onInsights }: { tabs: ReactNode; bottom: number; onInsights: () => void }) {
  const { token } = useAuth();
  const wardrobe = useWardrobe();
  const cache = useWardrobeCache();
  const items = useMemo(() => wardrobe.data ?? [], [wardrobe.data]);
  const listRef = useRef<FlatList<WardrobeItem>>(null);
  useScrollToTop(listRef);

  const [adding, setAdding] = useState(false);
  const [category, setCategory] = useState<string>(copy.all);
  const [query, setQuery] = useState("");
  const [unwornOnly, setUnwornOnly] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [building, setBuilding] = useState(false);
  const [pricing, setPricing] = useState<WardrobeItem | null>(null);

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
    Alert.alert(`Remove ${item.name}?`, "It will be deleted from your wardrobe.", [
      { text: "Cancel", style: "cancel" },
      {
        text: copy.remove,
        style: "destructive",
        onPress: () =>
          act(item.id, async (t) => {
            await workspaceApi.removeWardrobeItem(t, item.id);
            cache.remove(item.id);
          }),
      },
    ]);

  const toggleSelect = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id].slice(0, 6)));

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
            {[copy.all, ...present].map((c) => (
              <Chip key={c} label={c === copy.all ? c : `${c}  ${items.filter((i) => i.category === c).length}`} selected={category === c} onPress={() => setCategory(c)} />
            ))}
            <Pressable onPress={() => setUnwornOnly((v) => !v)} accessibilityState={{ selected: unwornOnly }} style={[styles.unworn, unwornOnly && styles.unwornOn]}>
              <AppText variant="sm" color={unwornOnly ? colors.canvas : colors.subtle}>
                Unworn {UNWORN_DAYS}+ days {unwornCount}
              </AppText>
            </Pressable>
          </ScrollView>
          <View style={styles.actions}>
            <Button icon={Plus} onPress={() => setAdding(true)}>
              {copy.add}
            </Button>
            <Button
              variant="ghost"
              icon={CheckSquare}
              onPress={() => {
                setSelecting((v) => !v);
                setSelected([]);
              }}
            >
              {selecting ? "Cancel" : "Build a look"}
            </Button>
          </View>
          {selecting ? (
            <View style={styles.selectBar}>
              <AppText variant="sm" color={colors.muted} style={styles.flex}>
                {selected.length ? `${selected.length} selected` : "Tap items to combine (up to 6)"}
              </AppText>
              <Button size="sm" disabled={selected.length < 2} onPress={() => setBuilding(true)}>
                Continue
              </Button>
            </View>
          ) : (
            <Pressable onPress={onInsights} style={styles.insightsLink}>
              <BarChart3 size={16} color={colors.accentBright} />
              <AppText variant="sm" color={colors.accentBright}>
                Cost-per-wear insights
              </AppText>
            </Pressable>
          )}
          {actionError ? <Notice tone="error">{actionError}</Notice> : null}
        </>
      )}
    </View>
  );

  return (
    <>
      <FlatList
        ref={listRef}
        data={items.length ? (shown.length % 2 ? [...shown, SPACER] : shown) : []}
        keyExtractor={(i) => i.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={header}
        renderItem={({ item }) =>
          item === SPACER ? (
            <View style={styles.flex} />
          ) : (
            <ItemCard
              item={item}
              busy={busy === item.id}
              selecting={selecting}
              selected={selected.includes(item.id)}
              onSelect={() => toggleSelect(item.id)}
              onWorn={() => act(item.id, (t) => workspaceApi.markWorn(t, item.id))}
              onUndo={() => act(item.id, (t) => workspaceApi.undoWorn(t, item.id))}
              onPrice={() => setPricing(item)}
              onRemove={() => remove(item)}
            />
          )
        }
        ListEmptyComponent={
          items.length === 0 ? (
            <GlassCard padding={28}>
              <View style={styles.empty}>
                <Shirt size={40} color={colors.muted} strokeWidth={1.5} />
                <AppText variant="title" align="center">
                  {copy.emptyTitle}
                </AppText>
                <AppText variant="sm" color={colors.muted} align="center">
                  {copy.emptyDescription}
                </AppText>
                <Button icon={Plus} onPress={() => setAdding(true)} style={styles.center}>
                  {copy.add}
                </Button>
              </View>
            </GlassCard>
          ) : null
        }
        ListFooterComponent={
          items.length > 0 ? (
            <View style={styles.footer}>
              {shown.length === 0 && (
                <AppText variant="sm" color={colors.muted} align="center">
                  {copy.noMatch}
                </AppText>
              )}
              <CombosPanel items={items} />
              <PlannerPanel items={items} />
            </View>
          ) : null
        }
        contentContainerStyle={[styles.list, { paddingBottom: bottom }]}
        refreshControl={<RefreshControl refreshing={wardrobe.isRefetching} onRefresh={() => wardrobe.refetch()} tintColor={colors.accentBright} colors={[colors.accentBright]} progressBackgroundColor={colors.surface} />}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
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
      <LookBuilderSheet
        open={building}
        items={items.filter((i) => selected.includes(i.id))}
        onClose={() => {
          setBuilding(false);
          setSelecting(false);
          setSelected([]);
        }}
      />
    </>
  );
}

const SPACER = { id: "__spacer" } as WardrobeItem;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { paddingHorizontal: GUTTER, gap: 16 },
  center: { alignSelf: "center" },
  tabs: { flexDirection: "row", gap: 8, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  tab: { height: 44, justifyContent: "center", paddingHorizontal: 12, borderBottomWidth: 2, borderBottomColor: "transparent", marginBottom: -1 },
  tabOn: { borderBottomColor: colors.accentBright },
  list: { paddingHorizontal: GUTTER },
  header: { gap: 14, marginBottom: 14 },
  search: {
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.glass,
  },
  searchInput: { flex: 1, color: colors.ink, fontFamily: fonts.regular, fontSize: 15, paddingVertical: 0 },
  chips: { gap: 8 },
  unworn: { height: 36, justifyContent: "center", paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  unwornOn: { backgroundColor: "#fcd34d", borderColor: "transparent" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  selectBar: { flexDirection: "row", alignItems: "center", gap: 12 },
  insightsLink: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  row: { gap: 12, marginBottom: 12 },
  empty: { alignItems: "center", gap: 10 },
  footer: { gap: 16, marginTop: 8 },
});
