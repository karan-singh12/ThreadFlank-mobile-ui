import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ArrowRight, CheckCircle2, ExternalLink, Search, SearchX, Share2, ShieldCheck, Shirt, ShoppingBag, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, Share, StyleSheet, TextInput, View } from "react-native";
import { Screen } from "@/components/layout/Screen";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { GradientText } from "@/components/ui/GradientText";
import { Photo } from "@/components/ui/Photo";
import { Sheet } from "@/components/ui/Sheet";
import { EmptyState } from "@/components/ui/States";
import { type ShelfOutfit } from "@/data/discover-shelves";
import { AppHeader } from "@/features/app/AppHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import { BrandLogo } from "@/features/brands/BrandVisuals";
import { useDynamicDiscover } from "@/features/discover/dynamicData";
import { WEB_ORIGIN } from "@/lib/api/config";
import { colors, fonts, gradients, GUTTER, radius, TAB_BAR_HEIGHT } from "@/theme";

// Same copy as the web's Discover page (User-Panel/src/features/discover/DiscoverView.tsx).
const copy = {
  eyebrow: "Discover",
  title: "Fresh drops, on you first",
  blurb: "Every look here is one tap from a drape on your own selfie.",
  search: "Search outfits, brands, fabrics…",
  clearSearch: "Clear search",
  promoted: "Promoted brands",
  brandsOnApp: "Brands on Threadflank",
  allBrands: "All brands",
  tryOn: "Try on",
  priceUnknown: "Price at store",
  noLooksTitle: "No looks yet",
  noLooksBody: "Brands are still adding their first looks. Check back soon.",
  emptyTitle: "Nothing matches that yet",
  emptyBody: "Try another word, or clear the filters to see every shelf.",
  clearFilters: "Clear filters",
};

const rupees = (n: number) => (n > 0 ? `₹${n.toLocaleString("en-IN")}` : copy.priceUnknown);
const drape = (o: ShelfOutfit) => router.push({ pathname: "/drape", params: { image: o.imageUrl, title: o.title.slice(0, 50), brand: o.brandName, category: o.category || "" } });

export default function DiscoverScreen() {
  const { token } = useAuth();
  const { loading, biddingWinners, promotedIsAuction, shelves, categories, refetch } = useDynamicDiscover(token);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedOutfit, setSelectedOutfit] = useState<ShelfOutfit | null>(null);

  const filteredShelves = useMemo(() => {
    const q = search.trim().toLowerCase();
    return shelves.filter((shelf) => {
      const matchesTab = activeCategory === "all" || shelf.category === activeCategory;
      const matchesSearch = !q || shelf.title.toLowerCase().includes(q) || shelf.items.some((i) => i.title.toLowerCase().includes(q) || i.brandName.toLowerCase().includes(q));
      return matchesTab && matchesSearch;
    });
  }, [shelves, activeCategory, search]);

  if (loading) {
    return (
      <Screen header={<AppHeader />} scroll={false} padded={false} tabBar>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.accentBright} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={<AppHeader />} scroll={false} padded={false} tabBar>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.accentBright} colors={[colors.accentBright]} progressBackgroundColor={colors.surface} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <AppText variant="label" color={colors.cyan}>
            {copy.eyebrow.toUpperCase()}
          </AppText>
          <GradientText variant="h2">{copy.title}</GradientText>
          <AppText variant="sm" color={colors.muted}>
            {copy.blurb}
          </AppText>
          <View style={styles.search}>
            <Search size={16} color={colors.muted} />
            <TextInput value={search} onChangeText={setSearch} placeholder={copy.search} placeholderTextColor={colors.muted} returnKeyType="search" style={styles.searchInput} accessibilityLabel="Search" />
            {search ? (
              <Pressable onPress={() => setSearch("")} hitSlop={8} accessibilityLabel={copy.clearSearch}>
                <X size={15} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Promoted brands: story rings, each opening the brand's store */}
        {biddingWinners.length > 0 && (
          <View style={styles.promoted}>
            <View style={styles.promotedHead}>
              <AppText variant="label" color={colors.subtle}>
                {(promotedIsAuction ? copy.promoted : copy.brandsOnApp).toUpperCase()}
              </AppText>
              <Pressable onPress={() => router.push("/brands")} hitSlop={8} style={styles.row}>
                <AppText variant="xs" color={colors.accentBright}>
                  {copy.allBrands}
                </AppText>
                <ArrowRight size={13} color={colors.accentBright} />
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ringTrack}>
              {biddingWinners.map((brand) => (
                <Pressable
                  key={brand.id}
                  onPress={() => router.push({ pathname: "/brand/[slug]", params: { slug: brand.slug } })}
                  accessibilityLabel={promotedIsAuction ? `${brand.name}, rank ${brand.rank}` : brand.name}
                  style={styles.ringItem}
                >
                  <LinearGradient colors={["#6645eb", "#d61fff", "#f6c453", "#6645eb"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ring}>
                    <View style={styles.ringInner}>
                      <BrandLogo src={brand.logo} name={brand.name} size={60} />
                    </View>
                  </LinearGradient>
                  {promotedIsAuction && (
                    <View style={styles.rankTag}>
                      <AppText variant="micro" weight="medium" color="#f6c453">
                        {String(brand.rank).padStart(2, "0")}
                      </AppText>
                    </View>
                  )}
                  <AppText variant="micro" color={colors.subtle} numberOfLines={1} align="center" style={styles.ringName}>
                    {brand.name}
                  </AppText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {categories.map((cat) => (
            <Chip key={cat.id} size="sm" label={cat.label} selected={activeCategory === cat.id} onPress={() => setActiveCategory(cat.id)} />
          ))}
        </ScrollView>

        {/* Shelves */}
        {filteredShelves.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={shelves.length === 0 ? copy.noLooksTitle : copy.emptyTitle}
            description={shelves.length === 0 ? copy.noLooksBody : copy.emptyBody}
            action={
              shelves.length > 0 ? (
                <Button
                  onPress={() => {
                    setSearch("");
                    setActiveCategory("all");
                  }}
                >
                  {copy.clearFilters}
                </Button>
              ) : undefined
            }
            style={styles.empty}
          />
        ) : (
          filteredShelves.map((shelf) => (
            <View key={shelf.id} style={styles.shelf}>
              <View style={styles.shelfHead}>
                {shelf.badge ? (
                  <AppText variant="label" color={colors.cyan}>
                    {shelf.badge.toUpperCase()}
                  </AppText>
                ) : null}
                <GradientText variant="h3" tone="chromeSoft">
                  {shelf.title}
                </GradientText>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={184} decelerationRate="fast" contentContainerStyle={styles.track}>
                {shelf.items.map((outfit) => (
                  <OutfitCard key={outfit.id} outfit={outfit} onOpen={() => setSelectedOutfit(outfit)} />
                ))}
              </ScrollView>
            </View>
          ))
        )}
      </ScrollView>

      <OutfitQuickSheet outfit={selectedOutfit} onClose={() => setSelectedOutfit(null)} />
    </Screen>
  );
}

/* ── Outfit card: photo first, rank numeral for ranked shelves, "Try on" always reachable ── */
function OutfitCard({ outfit, onOpen }: { outfit: ShelfOutfit; onOpen: () => void }) {
  const ranked = typeof outfit.rank === "number";
  const podium = ranked && outfit.rank! <= 3;
  return (
    <View style={styles.card}>
      <Pressable onPress={onOpen} accessibilityLabel={`Open ${outfit.title}`} style={styles.cardImage}>
        <Photo src={outfit.imageUrl} alt={`${outfit.title} by ${outfit.brandName}`} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={["rgba(1,2,20,0.25)", "transparent", "transparent", "rgba(1,2,20,0.92)"]} locations={[0, 0.3, 0.55, 1]} style={StyleSheet.absoluteFill} />
        {ranked ? (
          <AppText style={[styles.rank, { color: podium ? "#f6c453" : "#fff" }]} accessibilityLabel={`Rank ${outfit.rank}`}>
            {String(outfit.rank).padStart(2, "0")}
          </AppText>
        ) : outfit.fabric ? (
          <View style={styles.fabric}>
            <AppText variant="micro" color="rgba(255,255,255,0.9)">
              {outfit.fabric}
            </AppText>
          </View>
        ) : null}
        <Pressable onPress={() => drape(outfit)} accessibilityLabel={`${copy.tryOn}: ${outfit.title}`} style={styles.tryOn}>
          <LinearGradient colors={gradients.primary} style={[StyleSheet.absoluteFill, styles.tryOnFill]} />
          <Shirt size={13} color={colors.btnPrimaryText} strokeWidth={2} />
          <AppText variant="xs" weight="medium" color={colors.btnPrimaryText}>
            {copy.tryOn}
          </AppText>
        </Pressable>
      </Pressable>
      <View style={styles.cardBody}>
        <View style={styles.row}>
          <AppText variant="micro" color={colors.muted} numberOfLines={1} style={styles.flexShrink}>
            {outfit.brandName.toUpperCase()}
          </AppText>
          {outfit.isVerified && <ShieldCheck size={12} color={colors.accentBright} accessibilityLabel="Verified brand" />}
        </View>
        <AppText variant="sm" numberOfLines={2}>
          {outfit.title}
        </AppText>
        <AppText variant="sm" weight={outfit.price > 0 ? "medium" : undefined} color={outfit.price > 0 ? colors.inkSoft : colors.muted}>
          {rupees(outfit.price)}
        </AppText>
      </View>
    </View>
  );
}

/* ── Quick view, as the web's OutfitQuickModal ── */
function OutfitQuickSheet({ outfit, onClose }: { outfit: ShelfOutfit | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  if (!outfit) return null;
  const share = async () => {
    const url = outfit.brandSlug ? `${WEB_ORIGIN}/brands/${outfit.brandSlug}` : `${WEB_ORIGIN}/discover`;
    try {
      await Share.share({ title: `${outfit.title} — Threadflank`, message: `Check out ${outfit.title} by ${outfit.brandName} on Threadflank!\n${url}` });
    } catch {
      await Clipboard.setStringAsync(url).catch(() => undefined);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <Sheet
      open
      onClose={onClose}
      maxHeight={0.92}
      footer={
        <View style={styles.row}>
          <Button
            icon={Shirt}
            fullWidth
            style={styles.flex}
            onPress={() => {
              onClose();
              drape(outfit);
            }}
          >
            Drape on My Twin
          </Button>
          {outfit.buyUrl ? (
            <Button variant="glass" icon={ShoppingBag} iconRight={ExternalLink} onPress={() => void Linking.openURL(outfit.buyUrl)}>
              Buy
            </Button>
          ) : null}
        </View>
      }
    >
      <View style={styles.qvImage}>
        <Photo src={outfit.imageUrl} alt={outfit.title} style={StyleSheet.absoluteFill} />
        {outfit.rank ? (
          <View style={styles.qvRank}>
            <AppText variant="micro" weight="semibold">
              Rank #{outfit.rank}
            </AppText>
          </View>
        ) : null}
        <View style={styles.qvBottom}>
          <View style={styles.qvPill}>
            <CheckCircle2 size={12} color="#34d399" />
            <AppText variant="micro" weight="medium" color="#34d399">
              Drape Ready
            </AppText>
          </View>
          {outfit.likesCount > 0 ? (
            <View style={styles.qvPill}>
              <AppText variant="micro" color="rgba(255,255,255,0.8)">
                {outfit.likesCount.toLocaleString()} {outfit.likesCount === 1 ? "like" : "likes"}
              </AppText>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.qvBrand}>
        <View style={styles.row}>
          <BrandLogo src={outfit.brandLogo} name={outfit.brandName} size={32} />
          <AppText variant="xs" weight="semibold">
            {outfit.brandName}
          </AppText>
          {outfit.isVerified && <ShieldCheck size={14} color={colors.accentBright} />}
        </View>
        <Pressable onPress={share} accessibilityLabel="Share" style={styles.round}>
          <Share2 size={14} color={colors.subtle} />
        </Pressable>
      </View>

      <View style={styles.qvTitle}>
        <AppText variant="title" weight="semibold">
          {outfit.title}
        </AppText>
        <AppText variant="h3" weight="bold">
          {rupees(outfit.price)}
        </AppText>
      </View>

      {outfit.fabric || outfit.occasion ? (
        <View style={styles.row}>
          {outfit.fabric ? (
            <View style={styles.spec}>
              <AppText variant="micro" weight="semibold" color={colors.subtle}>
                FABRIC
              </AppText>
              <AppText variant="xs" weight="medium">
                {outfit.fabric}
              </AppText>
            </View>
          ) : null}
          {outfit.occasion ? (
            <View style={styles.spec}>
              <AppText variant="micro" weight="semibold" color={colors.subtle}>
                OCCASION
              </AppText>
              <AppText variant="xs" weight="medium">
                {outfit.occasion}
              </AppText>
            </View>
          ) : null}
        </View>
      ) : null}

      {copied ? (
        <AppText variant="xs" color="#34d399" align="center">
          Link copied to clipboard
        </AppText>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingBottom: TAB_BAR_HEIGHT + 48 },
  header: { gap: 8, paddingHorizontal: GUTTER, paddingTop: 8 },
  search: { marginTop: 10, height: 48, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.04)", paddingHorizontal: 16 },
  searchInput: { flex: 1, color: colors.ink, fontFamily: fonts.regular, fontSize: 14 },
  promoted: { marginTop: 24 },
  promotedHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: GUTTER, marginBottom: 12 },
  ringTrack: { gap: 16, paddingHorizontal: GUTTER },
  ringItem: { width: 76, alignItems: "center", gap: 8 },
  ring: { borderRadius: 40, padding: 2 },
  ringInner: { borderRadius: 34, borderWidth: 3, borderColor: colors.canvas, overflow: "hidden" },
  rankTag: { position: "absolute", top: 60, alignSelf: "center", borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", backgroundColor: colors.canvas, paddingHorizontal: 6 },
  ringName: { width: "100%" },
  chips: { gap: 8, paddingHorizontal: GUTTER, paddingVertical: 12, marginTop: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  empty: { marginHorizontal: GUTTER, marginTop: 24 },
  shelf: { paddingVertical: 20 },
  shelfHead: { paddingHorizontal: GUTTER, marginBottom: 14, gap: 4 },
  track: { gap: 12, paddingHorizontal: GUTTER, paddingBottom: 4 },
  card: { width: 172 },
  cardImage: { aspectRatio: 3 / 4, borderRadius: 18, overflow: "hidden", backgroundColor: "#0b0c22", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  rank: { position: "absolute", left: 12, bottom: 8, fontFamily: fonts.medium, fontSize: 40, lineHeight: 44, letterSpacing: -2.4, textShadowColor: "rgba(0,0,0,0.8)", textShadowRadius: 12 },
  fabric: { position: "absolute", left: 10, top: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.08)", paddingHorizontal: 10, paddingVertical: 4 },
  tryOn: { position: "absolute", right: 10, bottom: 10, height: 34, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: radius.pill, overflow: "hidden", borderWidth: 1, borderColor: "rgba(127,98,246,0.45)", paddingHorizontal: 12 },
  tryOnFill: { borderRadius: radius.pill },
  cardBody: { paddingHorizontal: 4, paddingTop: 12, gap: 4 },
  qvImage: { aspectRatio: 3 / 4, borderRadius: radius.card, overflow: "hidden", backgroundColor: "rgba(0,0,0,0.6)" },
  qvRank: { position: "absolute", left: 12, top: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", backgroundColor: "rgba(0,0,0,0.8)", paddingHorizontal: 10, paddingVertical: 3 },
  qvBottom: { position: "absolute", left: 12, right: 12, bottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  qvPill: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(0,0,0,0.75)", paddingHorizontal: 10, paddingVertical: 4 },
  qvBrand: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)" },
  round: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },
  qvTitle: { gap: 6 },
  spec: { flex: 1, gap: 2, borderRadius: radius.md, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", backgroundColor: "rgba(255,255,255,0.03)", padding: 10 },
});
