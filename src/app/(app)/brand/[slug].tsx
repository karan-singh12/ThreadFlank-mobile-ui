import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { ExternalLink, MapPin, Search, SearchX, ShieldCheck, ShoppingBag, Shirt, Sparkles, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Linking, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "@/components/layout/Screen";
import { StackHeader } from "@/components/layout/StackHeader";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Photo } from "@/components/ui/Photo";
import { Select } from "@/components/ui/Select";
import { EmptyState, ErrorState, Loader } from "@/components/ui/States";
import { useAuth } from "@/features/auth/AuthProvider";
import { BrandBanner, BrandLogo, brandAccent } from "@/features/brands/BrandVisuals";
import { DropsStrip, PieceCard, QuickViewSheet, SectionTitle, drapePiece, likeOf, rupees, type LikeMap } from "@/features/brands/StoreParts";
import { discoverApi, type ApiStore, type ApiStorePiece, type StoreSort } from "@/features/discover/api";
import { ApiError, errorMessage } from "@/lib/api/client";
import { colors, fonts, GUTTER, radius } from "@/theme";

type Filters = { q: string; category: string; occasion: string; collection: string; sort: StoreSort; inStock: boolean };
const NO_FILTERS: Filters = { q: "", category: "", occasion: "", collection: "", sort: "new", inStock: false };
const SORTS: { value: StoreSort; label: string }[] = [
  { value: "new", label: "Newest" },
  { value: "featured", label: "Featured first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];
const SOCIAL_LABEL: Record<string, string> = { instagram: "Instagram", facebook: "Facebook", twitter: "X", youtube: "YouTube", tiktok: "TikTok", pinterest: "Pinterest" };
const PAGE = 24;

type Page = { key: string; items: ApiStorePiece[]; cursor: string | null; total: number | null; error: string };

/** One brand's virtual store, the phone version of the web's /brands/[slug]. */
export default function BrandStoreScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { token } = useAuth();
  const query = useQuery({ queryKey: ["brand-store", slug, token], queryFn: () => discoverApi.store(slug, token), enabled: Boolean(slug) });

  if (query.isLoading) {
    return (
      <Screen header={<StackHeader title="Store" />} scroll={false}>
        <Loader label="Loading store" />
      </Screen>
    );
  }
  if (!query.data) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <Screen header={<StackHeader title="Store" />}>
        {notFound ? (
          <EmptyState icon={SearchX} title="We couldn't find that brand" description="It may have been removed, or the link is not right." action={<Button onPress={() => router.replace("/brands")}>See all brands</Button>} />
        ) : (
          <ErrorState message={errorMessage(query.error, "We couldn't load this store.")} onRetry={() => query.refetch()} />
        )}
      </Screen>
    );
  }
  return <Store key={query.data.brand.id} store={query.data} />;
}

function Store({ store }: { store: ApiStore }) {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const { brand, stats, facets } = store;
  const accent = brandAccent(brand.themeAccent);
  const slug = brand.slug;

  // ── Follow ──
  const [follow, setFollow] = useState({ following: Boolean(brand.following), followers: brand.followers ?? 0 });
  const [followBusy, setFollowBusy] = useState(false);
  const onFollow = async () => {
    if (!token) return router.push("/login");
    if (followBusy) return;
    setFollowBusy(true);
    try {
      setFollow(follow.following ? await discoverApi.unfollow(token, slug) : await discoverApi.follow(token, slug));
    } catch {
      /* the button simply stays as it was */
    } finally {
      setFollowBusy(false);
    }
  };

  // ── Likes: optimistic, settled with the server's answer ──
  const [likes, setLikes] = useState<LikeMap>({});
  const likesRef = useRef(likes);
  useEffect(() => {
    likesRef.current = likes;
  });
  const onLike = useCallback(
    async (p: ApiStorePiece) => {
      if (!token) return router.push("/login");
      const cur = likesRef.current[p.id] ?? likeOf({}, p);
      setLikes((m) => ({ ...m, [p.id]: { liked: !cur.liked, count: Math.max(0, cur.count + (cur.liked ? -1 : 1)) } }));
      try {
        const r = await discoverApi.toggleLike(token, p.id);
        setLikes((m) => ({ ...m, [p.id]: { liked: r.liked, count: r.likesCount } }));
      } catch {
        setLikes((m) => ({ ...m, [p.id]: cur }));
      }
    },
    [token]
  );
  const [open, setOpen] = useState<ApiStorePiece | null>(null);

  // ── Shop: filters + cursor-paginated pieces ──
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const key = JSON.stringify(filters);
  const [text, setText] = useState("");
  useEffect(() => {
    if (text.trim() === filters.q) return;
    const t = setTimeout(() => setFilters((f) => ({ ...f, q: text.trim() })), 350);
    return () => clearTimeout(t);
  }, [text, filters.q]);

  const [page, setPage] = useState<Page | null>(null);
  const [more, setMore] = useState(false);
  useEffect(() => {
    const ctrl = new AbortController();
    discoverApi
      .pieces(slug, { ...filters, limit: PAGE }, token, ctrl.signal)
      .then((r) => setPage({ key, items: r.products, cursor: r.nextCursor, total: r.total, error: "" }))
      .catch((e) => {
        if (!ctrl.signal.aborted) setPage({ key, items: [], cursor: null, total: 0, error: errorMessage(e, "We couldn't load pieces.") });
      });
    return () => ctrl.abort();
    // `filters` is represented by `key`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, key, token]);
  const current = page && page.key === key ? page : null;

  const loadMore = () => {
    if (!current || !current.cursor || more) return;
    setMore(true);
    discoverApi
      .pieces(slug, { ...filters, limit: PAGE, cursor: current.cursor }, token)
      .then((r) => setPage((p) => (p && p.key === key ? { ...p, items: [...p.items, ...r.products.filter((x) => !p.items.some((y) => y.id === x.id))], cursor: r.nextCursor } : p)))
      .catch(() => setPage((p) => (p && p.key === key ? { ...p, cursor: null, error: "We couldn't load more pieces." } : p)))
      .finally(() => setMore(false));
  };

  // ── Section jumps (the web's sticky "Store sections" nav) ──
  const listRef = useRef<FlatList<ApiStorePiece>>(null);
  const offsets = useRef<Record<string, number>>({});
  const mark = (id: string) => ({ onLayout: (e: { nativeEvent: { layout: { y: number } } }) => (offsets.current[id] = e.nativeEvent.layout.y) });
  const jump = (id: string) => listRef.current?.scrollToOffset({ offset: Math.max(0, (offsets.current[id] ?? 0) - 8), animated: true });
  const shopBy = (patch: Partial<Filters>) => {
    setText("");
    setFilters({ ...NO_FILTERS, ...patch });
    jump("shop");
  };
  const nav = useMemo(
    () =>
      [
        { id: "showcase", label: "The Edit", show: store.showcase.pieces.length > 0 },
        { id: "collections", label: "Collections", show: facets.collections.length > 0 },
        { id: "categories", label: "Categories", show: facets.categories.length > 1 },
        { id: "new", label: "New in", show: store.newIn.length > 0 },
        { id: "drops", label: "Drops", show: store.drops.length > 0 },
        { id: "shop", label: "Shop all", show: true },
        { id: "about", label: "About", show: true },
      ].filter((n) => n.show),
    [store, facets.categories.length, facets.collections.length]
  );

  const active = Boolean(filters.q || filters.category || filters.occasion || filters.collection || filters.inStock);
  const clear = () => {
    setText("");
    setFilters(NO_FILTERS);
  };
  const links = Object.entries(brand.links);
  const since = new Date(brand.memberSince).getFullYear();
  const priceRange = stats.minPrice !== null && stats.maxPrice !== null ? (stats.minPrice === stats.maxPrice ? rupees(stats.minPrice) : `${rupees(stats.minPrice)} – ${rupees(stats.maxPrice)}`) : "At store";

  const header = (
    <View style={styles.headerWrap}>
      {/* ── Hero ── */}
      <View style={styles.hero}>
        <View style={styles.heroArt}>
          <BrandBanner src={brand.banner} accent={accent} dim={0.7} />
          <LinearGradient colors={["transparent", "rgba(7,9,25,0.6)", "#070919"]} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
          {brand.announcementText ? (
            <View style={styles.announce}>
              <View style={[styles.dot, { backgroundColor: accent }]} />
              <AppText variant="micro" weight="medium" numberOfLines={1} style={styles.flexShrink}>
                {brand.announcementText.toUpperCase()}
              </AppText>
            </View>
          ) : null}
          <View style={styles.heroBottom}>
            <View style={styles.identity}>
              <BrandLogo src={brand.logo} name={brand.name} size={72} ring={accent} />
              <View style={styles.flex}>
                {brand.category || brand.gstRegistered ? (
                  <View style={styles.rowWrap}>
                    {brand.category ? (
                      <AppText variant="micro" color="rgba(255,255,255,0.7)">
                        {brand.category.toUpperCase()}
                      </AppText>
                    ) : null}
                    {brand.gstRegistered ? (
                      <View style={styles.gst}>
                        <AppText variant="micro" color="rgba(255,255,255,0.85)">
                          GST REGISTERED
                        </AppText>
                      </View>
                    ) : null}
                  </View>
                ) : null}
                <View style={styles.row}>
                  <AppText variant="h3" weight="semibold" numberOfLines={1} style={styles.flexShrink}>
                    {brand.name}
                  </AppText>
                  {brand.isVerified && <ShieldCheck size={20} color={accent} accessibilityLabel="Verified brand" />}
                </View>
                {brand.tagline ? (
                  <AppText variant="sm" color="rgba(255,255,255,0.75)" numberOfLines={2}>
                    {brand.tagline}
                  </AppText>
                ) : null}
              </View>
            </View>
            <View style={styles.rowWrap}>
              <Button size="sm" onPress={() => jump("shop")}>
                Shop the store
              </Button>
              <Button size="sm" variant="glass" loading={followBusy} onPress={onFollow}>
                {`${follow.following ? "Following" : "Follow"}  ${follow.followers.toLocaleString("en-IN")}`}
              </Button>
              {brand.websiteUrl ? (
                <Button size="sm" variant="glass" iconRight={ExternalLink} onPress={() => void Linking.openURL(brand.websiteUrl)}>
                  Official site
                </Button>
              ) : null}
            </View>
          </View>
        </View>
        <View style={styles.stats}>
          {[
            ["Pieces", stats.pieces.toLocaleString("en-IN")],
            ["Categories", String(stats.categories)],
            ["Price range", priceRange],
            ["Upcoming drops", String(stats.upcomingDrops)],
          ].map(([k, v]) => (
            <View key={k} style={styles.stat}>
              <AppText variant="micro" color={colors.subtle}>
                {k.toUpperCase()}
              </AppText>
              <AppText variant="sm" weight="medium" numberOfLines={1}>
                {v}
              </AppText>
            </View>
          ))}
        </View>
      </View>

      {/* ── Store sections ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navRow}>
        {nav.map((n) => (
          <Chip key={n.id} label={n.label} size="sm" onPress={() => jump(n.id)} />
        ))}
      </ScrollView>

      <Showcase store={store} accent={accent} likes={likes} onLike={onLike} onOpen={setOpen} layout={mark("showcase")} />

      {facets.collections.length > 0 && (
        <View {...mark("collections")}>
          <SectionTitle title="Collections" sub="Edits and drops from the brand." />
          <CoverRail items={facets.collections.slice(0, 8)} onPick={(name) => shopBy({ collection: name })} />
        </View>
      )}

      {facets.categories.length > 1 && (
        <View {...mark("categories")}>
          <SectionTitle title="Shop by category" sub="Jump straight to what you came for." />
          <CoverRail items={facets.categories.slice(0, 8)} onPick={(name) => shopBy({ category: name })} />
        </View>
      )}

      {store.newIn.length > 0 && (
        <View {...mark("new")}>
          <SectionTitle title="New in" sub="Just landed." />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
            {store.newIn.map((p) => (
              <PieceCard key={p.id} piece={p} likes={likes} accent={accent} onLike={onLike} onOpen={setOpen} width={168} />
            ))}
          </ScrollView>
        </View>
      )}

      {store.drops.length > 0 && (
        <View {...mark("drops")}>
          <DropsStrip drops={store.drops} collections={facets.collections.map((c) => c.name)} accent={accent} onShop={(name) => shopBy({ collection: name })} />
        </View>
      )}

      {/* ── Shop all: filters ── */}
      <View {...mark("shop")} style={styles.shopHead}>
        <SectionTitle icon={<ShoppingBag size={13} color={colors.subtle} />} title="Shop all" sub={`${stats.pieces.toLocaleString("en-IN")} pieces from ${brand.name}`} />
        <View style={styles.search}>
          <Search size={16} color={colors.muted} />
          <TextInput value={text} onChangeText={setText} placeholder={`Search ${brand.name}…`} placeholderTextColor={colors.muted} returnKeyType="search" style={styles.searchInput} accessibilityLabel="Search this store" />
          {text ? (
            <Pressable onPress={() => setText("")} hitSlop={8} accessibilityLabel="Clear search">
              <X size={15} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
        <View style={[styles.row, styles.bottomAlign]}>
          <Select label="Sort pieces" value={filters.sort} options={SORTS} onChange={(v) => setFilters({ ...filters, sort: v as StoreSort })} style={styles.flex} />
          <Chip label="In stock" selected={filters.inStock} onPress={() => setFilters({ ...filters, inStock: !filters.inStock })} />
        </View>
        {facets.collections.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            <Chip size="sm" label="All collections" selected={!filters.collection} onPress={() => setFilters({ ...filters, collection: "" })} />
            {facets.collections.map((c) => (
              <Chip key={c.name} size="sm" label={`${c.name}  ${c.count}`} selected={filters.collection === c.name} onPress={() => setFilters({ ...filters, collection: filters.collection === c.name ? "" : c.name })} />
            ))}
          </ScrollView>
        )}
        {facets.categories.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            <Chip size="sm" label="All" selected={!filters.category} onPress={() => setFilters({ ...filters, category: "" })} />
            {facets.categories.map((c) => (
              <Chip key={c.name} size="sm" label={`${c.name}  ${c.count}`} selected={filters.category === c.name} onPress={() => setFilters({ ...filters, category: filters.category === c.name ? "" : c.name })} />
            ))}
          </ScrollView>
        )}
        {facets.occasions.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {facets.occasions.map((o) => (
              <Chip key={o.name} size="sm" label={`${o.name}  ${o.count}`} selected={filters.occasion === o.name} onPress={() => setFilters({ ...filters, occasion: filters.occasion === o.name ? "" : o.name })} />
            ))}
          </ScrollView>
        )}
        {current && !current.error && current.total !== null ? (
          <View style={styles.row}>
            <AppText variant="xs" color={colors.muted}>
              {current.total.toLocaleString("en-IN")} {current.total === 1 ? "piece" : "pieces"}
            </AppText>
            {active ? (
              <Pressable onPress={clear} hitSlop={6} style={styles.row}>
                <X size={12} color={colors.accentBright} />
                <AppText variant="xs" color={colors.accentBright}>
                  Clear filters
                </AppText>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );

  const footer = (
    <View style={styles.footerWrap}>
      <View style={styles.moreRow}>
        {more ? <ActivityIndicator color={colors.subtle} /> : null}
        {current && !current.cursor && current.items.length > PAGE ? (
          <AppText variant="xs" color={colors.muted}>
            That&apos;s all {current.items.length.toLocaleString("en-IN")} pieces
          </AppText>
        ) : null}
        {current?.error && current.items.length > 0 ? (
          <AppText variant="xs" color="#fca5a5">
            {current.error}
          </AppText>
        ) : null}
      </View>

      <View {...mark("about")}>
        <SectionTitle title={`About ${brand.name}`} />
        <View style={styles.about}>
          <AppText variant="sm" color={colors.muted}>
            {brand.story || `${brand.name} has not written its story yet.`}
          </AppText>
          <View style={styles.row}>
            <MapPin size={15} color={colors.subtle} />
            <AppText variant="sm" color="rgba(255,255,255,0.85)" style={styles.flexShrink}>
              {brand.isOnlineOnly ? "Online store" : brand.flagshipAddress || "Flagship store"}
            </AppText>
          </View>
          <AppText variant="sm" color={colors.subtle}>
            On Threadflank since {since}
          </AppText>
          {links.length > 0 && (
            <View style={styles.rowWrap}>
              {links.map(([k, url]) => (
                <Chip key={k} size="sm" label={SOCIAL_LABEL[k] ?? k} onPress={() => void Linking.openURL(url)} />
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const empty = !current ? (
    <View style={styles.moreRow}>
      <ActivityIndicator color={colors.subtle} />
    </View>
  ) : current.error ? (
    <AppText variant="sm" color="#fca5a5" align="center" style={styles.emptyPad}>
      {current.error}
    </AppText>
  ) : (
    <EmptyState
      icon={SearchX}
      title={active ? "No pieces match those filters" : "This brand has not added any pieces yet."}
      action={active ? <Button onPress={clear}>Clear filters</Button> : undefined}
      style={styles.emptyPad}
    />
  );

  return (
    <Screen header={<StackHeader title={brand.name} />} scroll={false} padded={false}>
      <FlatList
        ref={listRef}
        data={current?.items ?? []}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }) => <PieceCard piece={item} likes={likes} accent={accent} onLike={onLike} onOpen={setOpen} />}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={footer}
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      />
      <QuickViewSheet piece={open} brand={brand.name} slug={slug} likes={likes} accent={accent} onLike={onLike} onClose={() => setOpen(null)} />
    </Screen>
  );
}

/* ── The Edit: the brand's chosen pieces on a stage ── */
function Showcase({ store, accent, likes, onLike, onOpen, layout }: { store: ApiStore; accent: string; likes: LikeMap; onLike: (p: ApiStorePiece) => void; onOpen: (p: ApiStorePiece) => void; layout: { onLayout: (e: { nativeEvent: { layout: { y: number } } }) => void } }) {
  const list = store.showcase.pieces.filter((p) => p.images[0]);
  const [sel, setSel] = useState(0);
  if (list.length === 0) return null;
  const lead = list[Math.min(sel, list.length - 1)];
  const like = likeOf(likes, lead);
  return (
    <View {...layout}>
      <SectionTitle
        icon={<Sparkles size={13} color={colors.subtle} />}
        title={store.showcase.isFallback ? "Latest from the store" : "The Edit"}
        sub={store.showcase.isFallback ? "The newest pieces, until the brand picks its favourites." : `${store.brand.name}'s own picks.`}
      />
      <View style={styles.stage}>
        <Pressable onPress={() => onOpen(lead)} accessibilityLabel={`Quick view: ${lead.title}`} style={styles.stageImage}>
          <Photo key={lead.id} src={lead.images[0]} alt={lead.title} style={StyleSheet.absoluteFill} />
        </Pressable>
        <AppText variant="micro" color={colors.subtle}>
          {lead.category.toUpperCase()}
        </AppText>
        <AppText variant="title">{lead.title}</AppText>
        <AppText variant="bodyLg" weight="semibold">
          {rupees(lead.price)}
        </AppText>
        {lead.description ? (
          <AppText variant="sm" color={colors.muted} numberOfLines={4}>
            {lead.description}
          </AppText>
        ) : null}
        <View style={styles.rowWrap}>
          <Button size="sm" onPress={() => onOpen(lead)}>
            Quick view
          </Button>
          {lead.isDrapeReady ? (
            <Button size="sm" variant="glass" icon={Shirt} onPress={() => drapePiece(lead, store.brand.name)}>
              Drape it
            </Button>
          ) : null}
          <Pressable onPress={() => onLike(lead)} accessibilityLabel={like.liked ? "Unlike" : "Like"} style={styles.roundBtn}>
            <AppText color={like.liked ? "#ff5c8a" : "#fff"}>{like.liked ? "♥" : "♡"}</AppText>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
          {list.map((p, n) => (
            <Pressable key={p.id} onPress={() => setSel(n)} accessibilityLabel={p.title} style={[styles.edThumb, n === sel ? { borderColor: accent, borderWidth: 2 } : styles.edThumbOff]}>
              <Photo src={p.images[0]} style={StyleSheet.absoluteFill} />
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

/** Picture cards for collections and categories, as on the web. */
function CoverRail({ items, onPick }: { items: { name: string; count: number; cover: string }[]; onPick: (name: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
      {items.map((c) => (
        <Pressable key={c.name} onPress={() => onPick(c.name)} accessibilityLabel={c.name} style={styles.cover}>
          {c.cover ? <Photo src={c.cover} style={StyleSheet.absoluteFill} /> : null}
          <LinearGradient colors={["transparent", "rgba(0,0,0,0.85)"]} locations={[0.35, 1]} style={StyleSheet.absoluteFill} />
          <View style={styles.coverText}>
            <AppText variant="sm" weight="medium" numberOfLines={1}>
              {c.name}
            </AppText>
            <AppText variant="micro" color="rgba(255,255,255,0.65)">
              {c.count} {c.count === 1 ? "piece" : "pieces"}
            </AppText>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  bottomAlign: { alignItems: "flex-end" },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  list: { paddingHorizontal: GUTTER },
  gridRow: { gap: 12, marginBottom: 12 },
  headerWrap: { gap: 32, paddingBottom: 16 },
  hero: { borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginTop: 4 },
  heroArt: { minHeight: 340, justifyContent: "flex-end" },
  announce: { position: "absolute", left: 12, top: 12, right: 12, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", backgroundColor: "rgba(0,0,0,0.7)", paddingHorizontal: 12, paddingVertical: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  heroBottom: { padding: 16, gap: 16 },
  identity: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  gst: { borderRadius: radius.pill, backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 8, paddingVertical: 2 },
  stats: { flexDirection: "row", flexWrap: "wrap", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(0,0,0,0.4)" },
  stat: { width: "50%", paddingHorizontal: 16, paddingVertical: 10, gap: 2 },
  navRow: { gap: 8, marginTop: -16 },
  stage: { gap: 8, borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "#0e0f26", padding: 14 },
  stageImage: { aspectRatio: 3 / 4, borderRadius: radius.card, overflow: "hidden", marginBottom: 6 },
  roundBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  rail: { gap: 12, paddingRight: 4 },
  edThumb: { width: 72, height: 96, borderRadius: radius.md, overflow: "hidden" },
  edThumbOff: { borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", opacity: 0.6 },
  cover: { width: 160, aspectRatio: 4 / 5, borderRadius: radius.card, overflow: "hidden", backgroundColor: "#0b0c22", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  coverText: { position: "absolute", left: 10, right: 10, bottom: 10 },
  shopHead: { gap: 10 },
  search: { height: 44, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.04)", paddingHorizontal: 14 },
  searchInput: { flex: 1, color: colors.ink, fontFamily: fonts.regular, fontSize: 14 },
  chipRow: { gap: 8, paddingRight: 4 },
  footerWrap: { gap: 24 },
  moreRow: { minHeight: 56, alignItems: "center", justifyContent: "center" },
  about: { gap: 12, borderRadius: radius.panel, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)", padding: 16 },
  emptyPad: { paddingVertical: 32 },
});
