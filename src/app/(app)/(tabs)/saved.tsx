import { router, useLocalSearchParams, useScrollToTop } from "expo-router";
import { Bookmark, CalendarHeart, Filter, Plus, Search, Shirt, X } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "@/components/layout/Screen";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { ErrorState, Loader } from "@/components/ui/States";
import { OCCASIONS } from "@/data/studio-content";
import { AppHeader } from "@/features/app/AppHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import { EventsPanel } from "@/features/events/components/EventsPanel";
import { NewEventSheet } from "@/features/events/components/NewEventSheet";
import { LookCard } from "@/features/saved/LookCard";
import { workspaceApi, type Look } from "@/features/workspace/api";
import { useLooks, useLooksCache } from "@/features/workspace/hooks";
import { errorMessage } from "@/lib/api/client";
import { colors, fonts, GUTTER, radius, TAB_BAR_HEIGHT } from "@/theme";

type Tab = "looks" | "events";
const OCCASION_FILTERS = [{ id: "all", label: "All Occasions" }, ...OCCASIONS];

/** Saved looks and circle events share one screen, as on the web. */
export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string; look?: string }>();
  const [tab, setTab] = useState<Tab>(params.tab === "events" ? "events" : "looks");
  const [creatingEvent, setCreatingEvent] = useState(false);

  useEffect(() => {
    if (params.tab === "events" || params.tab === "looks") setTab(params.tab);
  }, [params.tab]);

  // Notification links point at /saved?look=<id>.
  useEffect(() => {
    if (params.look) router.push({ pathname: "/look/[id]", params: { id: params.look } });
  }, [params.look]);

  const tabs = (
    <View style={styles.tabs}>
      {(
        [
          { id: "looks", label: "Looks", icon: Bookmark },
          { id: "events", label: "Events", icon: CalendarHeart },
        ] as const
      ).map((t) => {
        const on = tab === t.id;
        return (
          <Pressable key={t.id} onPress={() => setTab(t.id)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={[styles.tab, on && styles.tabOn]}>
            <t.icon size={16} strokeWidth={1.75} color={on ? colors.ink : colors.muted} />
            <AppText variant="sm" weight={on ? "medium" : "regular"} color={on ? colors.ink : colors.muted}>
              {t.label}
            </AppText>
          </Pressable>
        );
      })}
      <Pressable onPress={() => setCreatingEvent(true)} style={styles.newEvent}>
        <Plus size={14} color={colors.subtle} />
        <AppText variant="xs" weight="medium" color={colors.subtle}>
          New event
        </AppText>
      </Pressable>
    </View>
  );

  return (
    <>
      {tab === "events" ? (
        <Screen header={<AppHeader />} tabBar>
          {tabs}
          <EventsPanel onCreate={() => setCreatingEvent(true)} />
        </Screen>
      ) : (
        <Screen header={<AppHeader />} scroll={false} padded={false}>
          <SavedLooks tabs={tabs} bottom={TAB_BAR_HEIGHT + insets.bottom + 16} />
        </Screen>
      )}
      <NewEventSheet open={creatingEvent} onClose={() => setCreatingEvent(false)} />
    </>
  );
}

function SavedLooks({ tabs, bottom }: { tabs: ReactElement; bottom: number }) {
  const { token } = useAuth();
  const looksQuery = useLooks();
  const cache = useLooksCache();
  const looks = useMemo(() => looksQuery.data ?? [], [looksQuery.data]);
  const [occasion, setOccasion] = useState("all");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const listRef = useRef<FlatList<Look>>(null);
  useScrollToTop(listRef);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return looks.filter(
      (l) =>
        (occasion === "all" || l.occasion.toLowerCase() === occasion.toLowerCase()) &&
        (!q || l.name.toLowerCase().includes(q) || l.occasion.toLowerCase().includes(q) || l.pieces.some((p) => p.toLowerCase().includes(q)))
    );
  }, [looks, occasion, query]);

  const toggleLike = async (look: Look) => {
    if (!token) return;
    cache.upsert({ ...look, liked: !look.liked });
    try {
      await workspaceApi.toggleLookLike(token, look.id);
    } catch {
      cache.upsert(look);
    }
  };

  const remove = (look: Look) =>
    Alert.alert("Remove look?", `Remove "${look.name}" from your saved looks?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          if (!token) return;
          setBusyId(look.id);
          try {
            await workspaceApi.removeLook(token, look.id);
            cache.remove(look.id);
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);

  const header = (
    <View style={styles.header}>
      {tabs}
      {looks.length > 0 && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {OCCASION_FILTERS.map((o) => {
              const on = occasion === o.id;
              return (
                <Pressable key={o.id} onPress={() => setOccasion(o.id)} style={[styles.occasionChip, on && styles.occasionOn]}>
                  <AppText variant="xs" weight="medium" color={on ? "#fff" : colors.subtle}>
                    {o.label}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={styles.search}>
            <Search size={16} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search looks or pieces…"
              placeholderTextColor={colors.muted}
              selectionColor={colors.accentBright}
              style={styles.searchInput}
            />
            {query ? (
              <Pressable onPress={() => setQuery("")} hitSlop={8} accessibilityLabel="Clear search">
                <X size={14} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
        </>
      )}
    </View>
  );

  if (looksQuery.isLoading) {
    return (
      <View style={styles.pad}>
        {tabs}
        <Loader />
      </View>
    );
  }
  if (looksQuery.isError) {
    return (
      <View style={styles.pad}>
        {tabs}
        <ErrorState message={errorMessage(looksQuery.error, "Failed to load saved looks")} onRetry={() => looksQuery.refetch()} />
      </View>
    );
  }

  return (
    <FlatList
      ref={listRef}
      data={filtered.length % 2 ? [...filtered, SPACER] : filtered}
      numColumns={2}
      keyExtractor={(l) => l.id}
      columnWrapperStyle={styles.row}
      ListHeaderComponent={header}
      renderItem={({ item }) =>
        item === SPACER ? (
          <View style={styles.flex} />
        ) : (
          <LookCard look={item} busy={busyId === item.id} onOpen={() => router.push({ pathname: "/look/[id]", params: { id: item.id } })} onToggleLike={() => toggleLike(item)} onRemove={() => remove(item)} />
        )
      }
      ListEmptyComponent={
        looks.length === 0 ? (
          <GlassCard padding={28}>
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Bookmark size={32} strokeWidth={1.5} color={colors.accentBright} />
              </View>
              <AppText variant="title" align="center">
                No saved looks yet
              </AppText>
              <AppText variant="sm" color={colors.subtle} align="center">
                Experiment with virtual drape, mix-and-match your wardrobe pieces, and save your favourite outfit combinations here.
              </AppText>
              <Button icon={Shirt} onPress={() => router.navigate("/drape")} style={styles.center}>
                Open Drape Studio
              </Button>
            </View>
          </GlassCard>
        ) : (
          <View style={styles.noMatch}>
            <Filter size={32} color={colors.muted} />
            <AppText variant="sm" weight="medium">
              No looks match your filter
            </AppText>
            <AppText variant="xs" color={colors.subtle} align="center">
              Try searching for another keyword or selecting “All Occasions”.
            </AppText>
            <Button
              variant="glass"
              size="sm"
              onPress={() => {
                setOccasion("all");
                setQuery("");
              }}
            >
              Reset filters
            </Button>
          </View>
        )
      }
      contentContainerStyle={[styles.list, { paddingBottom: bottom }]}
      refreshControl={<RefreshControl refreshing={looksQuery.isRefetching} onRefresh={() => looksQuery.refetch()} tintColor={colors.accentBright} colors={[colors.accentBright]} progressBackgroundColor={colors.surface} />}
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
    />
  );
}

const SPACER = { id: "__spacer" } as Look;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { paddingHorizontal: GUTTER, gap: 16 },
  center: { alignSelf: "center" },
  tabs: { flexDirection: "row", alignItems: "center", gap: 8, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  tab: { height: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, borderBottomWidth: 2, borderBottomColor: "transparent", marginBottom: -1 },
  tabOn: { borderBottomColor: colors.accentBright },
  newEvent: {
    marginLeft: 8,
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  list: { paddingHorizontal: GUTTER },
  header: { gap: 14, marginBottom: 16 },
  chips: { gap: 6 },
  occasionChip: { borderRadius: 999, borderWidth: 1, borderColor: colors.line, backgroundColor: "rgba(255,255,255,0.03)", paddingHorizontal: 14, paddingVertical: 6 },
  occasionOn: { backgroundColor: colors.accentBright, borderColor: "transparent" },
  search: {
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.glass,
  },
  searchInput: { flex: 1, color: colors.ink, fontFamily: fonts.regular, fontSize: 14, paddingVertical: 0 },
  row: { gap: 12, marginBottom: 12 },
  empty: { alignItems: "center", gap: 10 },
  emptyIcon: { width: 64, height: 64, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(102,69,235,0.2)", borderWidth: 1, borderColor: colors.line },
  noMatch: { alignItems: "center", gap: 8, paddingVertical: 40, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: "rgba(255,255,255,0.02)" },
});
