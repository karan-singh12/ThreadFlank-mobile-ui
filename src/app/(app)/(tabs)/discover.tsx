import { useScrollToTop } from "expo-router";
import { Loader2, SearchX } from "lucide-react-native";
import { useMemo, useRef, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "@/components/layout/Screen";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Loader } from "@/components/ui/States";
import { discoverContent as copy } from "@/data/app-content";
import { AppHeader } from "@/features/app/AppHeader";
import { BrandStories } from "@/features/discover/components/BrandStories";
import { CategoryFilter, SearchBar, ViewToggle } from "@/features/discover/components/FeedControls";
import { PostCard } from "@/features/discover/components/PostCard";
import { PostGridTile } from "@/features/discover/components/PostGridTile";
import { StoryViewer } from "@/features/discover/components/StoryViewer";
import { useBrands, usePosts, useStories } from "@/features/discover/hooks";
import { brandFromPost, type Brand, type BrandPost } from "@/features/discover/model";
import { colors, radius, TAB_BAR_HEIGHT } from "@/theme";

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<BrandPost>>(null);
  useScrollToTop(listRef);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(copy.categories[0]);
  const [story, setStory] = useState("all");
  const [watching, setWatching] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"feed" | "grid">("feed");

  const brandsQuery = useBrands();
  const brands = useMemo(() => brandsQuery.data ?? [], [brandsQuery.data]);
  const { brandsWithStories, groups, markSeen, refetch: refetchStories } = useStories(brands);
  const postsQuery = usePosts(category, story);

  const brandById = useMemo(() => new Map(brands.map((b) => [b.id, b])), [brands]);
  const rawById = useMemo(() => new Map((postsQuery.data?.raw ?? []).map((p) => [p.id, p])), [postsQuery.data]);
  const brandOf = (post: BrandPost): Brand => brandById.get(post.brandId) ?? brandFromPost(rawById.get(post.id), post.brandId);

  const posts = useMemo(() => {
    const list = postsQuery.data?.posts ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => {
      const brandName = (brandById.get(p.brandId)?.name ?? "").toLowerCase();
      return p.caption.toLowerCase().includes(q) || brandName.includes(q) || p.tags.some((t) => t.name.toLowerCase().includes(q));
    });
  }, [postsQuery.data, search, brandById]);

  const filtered = Boolean(search) || category !== copy.categories[0] || story !== "all";
  const refreshing = postsQuery.isRefetching;
  const refresh = () => {
    void postsQuery.refetch();
    void brandsQuery.refetch();
    void refetchStories();
  };

  const header = (
    <View style={styles.headerBlock}>
      <View style={styles.controls}>
        <SearchBar value={search} onChange={setSearch} placeholder={copy.searchPlaceholder} />
        <CategoryFilter options={copy.categories} value={category} onChange={setCategory} />
        <ViewToggle value={viewMode} onChange={setViewMode} />
      </View>
      {brands.length > 0 && <BrandStories brands={brandsWithStories} selected={story} onSelect={setStory} onOpen={setWatching} />}
    </View>
  );

  const empty = postsQuery.isLoading ? (
    <GlassCard style={styles.state}>
      <Loader label="Loading fresh looks..." />
    </GlassCard>
  ) : (
    <GlassCard style={styles.state} padding={32}>
      <View style={styles.emptyInner}>
        {postsQuery.isError ? <Loader2 size={40} color={colors.muted} strokeWidth={1.5} /> : <SearchX size={40} color={colors.muted} strokeWidth={1.5} />}
        <AppText variant="title" align="center">
          {postsQuery.isError ? "Couldn't load the feed" : filtered ? copy.emptyTitle : copy.noPostsTitle}
        </AppText>
        <AppText variant="sm" color={colors.muted} align="center">
          {postsQuery.isError ? "Check your connection and pull down to retry." : filtered ? copy.emptyDescription : copy.noPostsDescription}
        </AppText>
        {filtered && (
          <Button
            variant="glass"
            size="sm"
            onPress={() => {
              setSearch("");
              setCategory(copy.categories[0]);
              setStory("all");
            }}
          >
            Reset filters
          </Button>
        )}
      </View>
    </GlassCard>
  );

  const bottomPad = TAB_BAR_HEIGHT + insets.bottom + 24;
  const refreshControl = <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accentBright} colors={[colors.accentBright]} progressBackgroundColor={colors.surface} />;

  return (
    <Screen header={<AppHeader />} scroll={false} padded={false}>
      {viewMode === "grid" ? (
        <FlatList
          key="grid"
          ref={listRef}
          // An invisible spacer keeps the last tile half-width when the count is odd.
          data={posts.length % 2 ? [...posts, GRID_SPACER] : posts}
          numColumns={2}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (item === GRID_SPACER ? <View style={styles.spacer} /> : <PostGridTile post={item} brand={brandOf(item)} />)}
          columnWrapperStyle={styles.gridRow}
          ListHeaderComponent={header}
          ListEmptyComponent={empty}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad }]}
          refreshControl={refreshControl}
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          key="feed"
          ref={listRef}
          data={posts}
          keyExtractor={(p) => p.id}
          renderItem={({ item, index }) => (
            <View style={[styles.feedItem, index === 0 && styles.feedFirst, index === posts.length - 1 && styles.feedLast]}>
              <PostCard post={item} brand={brandOf(item)} />
            </View>
          )}
          ItemSeparatorComponent={FeedSeparator}
          ListHeaderComponent={header}
          ListEmptyComponent={empty}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad }]}
          refreshControl={refreshControl}
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          initialNumToRender={3}
          windowSize={7}
        />
      )}

      {watching && groups.length > 0 && (
        <StoryViewer
          groups={groups}
          startBrandId={watching}
          onClose={() => setWatching(null)}
          onSeen={markSeen}
          onShowPosts={(brandId) => {
            setWatching(null);
            setStory(brandId);
          }}
        />
      )}
    </Screen>
  );
}

function FeedSeparator() {
  return <View style={styles.separator} />;
}

const GRID_SPACER = { id: "__spacer" } as BrandPost;

const styles = StyleSheet.create({
  list: { paddingHorizontal: 12, paddingTop: 4 },
  headerBlock: { gap: 12, marginBottom: 12 },
  controls: { flexDirection: "row", alignItems: "center", gap: 8 },
  gridRow: { gap: 8, marginBottom: 8 },
  spacer: { flex: 1 },
  feedItem: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.line, overflow: "hidden", backgroundColor: "rgba(13,12,29,0.6)" },
  feedFirst: { borderTopWidth: 1, borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card },
  feedLast: { borderBottomWidth: 1, borderBottomLeftRadius: radius.card, borderBottomRightRadius: radius.card },
  separator: { height: 1, backgroundColor: colors.line },
  state: { marginTop: 4 },
  emptyInner: { alignItems: "center", gap: 8 },
});
