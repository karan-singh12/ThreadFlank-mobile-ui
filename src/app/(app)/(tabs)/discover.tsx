import { useRouter } from "expo-router";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Flame,
  Heart,
  Search,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  X,
} from "lucide-react-native";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "@/components/layout/Screen";
import { AppText } from "@/components/ui/AppText";
import { Sheet } from "@/components/ui/Sheet";
import {
  type BrandCatalogItem,
  type BrandDetail,
  type ShelfOutfit,
} from "@/data/discover-shelves";
import { AppHeader } from "@/features/app/AppHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import { useDynamicDiscover } from "@/features/discover/dynamicData";
import { colors, radius, TAB_BAR_HEIGHT } from "@/theme";

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();

  const {
    loading,
    shelves: dynamicShelves,
    biddingWinners,
    brandsDirectory,
    categories,
    refetch,
  } = useDynamicDiscover(token);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState<ShelfOutfit | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<BrandDetail | null>(null);
  const [liked, setLiked] = useState(false);

  const filteredShelves = useMemo(() => {
    return dynamicShelves.filter((shelf) => {
      const matchesTab = activeCategory === "all" || shelf.category === activeCategory;
      const matchesSearch =
        !search ||
        shelf.title.toLowerCase().includes(search.toLowerCase()) ||
        shelf.items.some(
          (item) =>
            item.title.toLowerCase().includes(search.toLowerCase()) ||
            item.brandName.toLowerCase().includes(search.toLowerCase())
        );
      return matchesTab && matchesSearch;
    });
  }, [dynamicShelves, activeCategory, search]);

  const onShare = async (outfit: ShelfOutfit) => {
    try {
      await Share.share({
        message: `Check out ${outfit.title} by ${outfit.brandName} on Threadflank AI Drape!`,
        url: outfit.buyUrl,
      });
    } catch {
      // Ignored
    }
  };

  if (loading) {
    return (
      <Screen header={<AppHeader />} scroll={false} padded={false} tabBar>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accentBright} />
          <AppText variant="xs" color={colors.subtle} style={{ marginTop: 12 }}>
            Loading runway collections...
          </AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={<AppHeader />} scroll={false} padded={false} tabBar>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              try {
                await refetch();
              } finally {
                setRefreshing(false);
              }
            }}
            tintColor={colors.accentBright}
          />
        }
      >
        {/* ─── 1. Top Promoted Brands Ribbon (BEFORE Search Bar) ─── */}
        <View style={styles.topBrandsSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.tagRow}>
              <View style={styles.activeDot} />
              <AppText variant="xs" style={styles.sectionTitle}>
                TOP PROMOTED BRANDS
              </AppText>
            </View>
            <Pressable onPress={() => router.push("/brands" as any)} hitSlop={8}>
              <AppText variant="xs" style={styles.viewAllText}>
                View all
              </AppText>
            </Pressable>
          </View>

          {/* Compact Horizontal Brand Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.brandChipsTrack}
          >
            {biddingWinners.map((brand) => (
              <Pressable
                key={brand.id}
                onPress={() => {
                  const match = brandsDirectory.find(
                    (b) => b.id === brand.id || b.slug === brand.slug
                  );
                  if (match) setSelectedBrand(match);
                }}
                style={styles.brandChip}
              >
                <View style={styles.brandChipLogoWrap}>
                  <Image source={{ uri: brand.logo }} style={styles.brandChipLogo} resizeMode="contain" />
                  <View style={styles.brandChipRankBadge}>
                    <AppText variant="xs" style={styles.brandChipRankText}>
                      #{brand.rank}
                    </AppText>
                  </View>
                </View>
                <AppText variant="xs" style={styles.brandChipName} numberOfLines={1}>
                  {brand.name}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ─── 2. Search Bar & Category Filter Pills ─── */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={15} color={colors.subtle} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search runway outfits, fabrics..."
              placeholderTextColor={colors.subtle}
              style={styles.searchInput}
            />
            {Boolean(search) && (
              <Pressable onPress={() => setSearch("")} hitSlop={8}>
                <X size={14} color={colors.subtle} />
              </Pressable>
            )}
          </View>

          {/* Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsTrack}
          >
            {categories.map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setActiveCategory(cat.id)}
                  style={[styles.pill, active && styles.pillActive]}
                >
                  <AppText
                    variant="xs"
                    style={[styles.pillText, active && styles.pillTextActive]}
                  >
                    {cat.label}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ─── 3. 10 Spotify-Style Horizontal Shelves ─── */}
        {filteredShelves.length === 0 ? (
          <View style={styles.emptyWrap}>
            <AppText variant="body" style={styles.emptyText}>
              No outfits match your filter.
            </AppText>
            <Pressable
              onPress={() => {
                setSearch("");
                setActiveCategory("all");
              }}
              style={styles.resetBtn}
            >
              <AppText variant="xs" style={styles.resetBtnText}>
                Reset filters
              </AppText>
            </Pressable>
          </View>
        ) : (
          filteredShelves.map((shelf) => (
            <View key={shelf.id} style={styles.shelfWrap}>
              {/* Shelf Title Row */}
              <View style={styles.shelfHeader}>
                <AppText variant="body" style={styles.shelfTitle}>
                  {shelf.title}
                </AppText>
                {Boolean(shelf.badge) && (
                  <View style={styles.shelfBadge}>
                    <AppText variant="xs" style={styles.shelfBadgeText}>
                      {shelf.badge}
                    </AppText>
                  </View>
                )}
              </View>

              {/* Horizontal Outfit Cards Track */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shelfTrack}
              >
                {shelf.items.map((outfit) => (
                  <Pressable
                    key={outfit.id}
                    onPress={() => setSelectedOutfit(outfit)}
                    style={styles.outfitCard}
                  >
                    {/* Garment Image Area */}
                    <View style={styles.outfitImgWrap}>
                      <Image source={{ uri: outfit.imageUrl }} style={styles.outfitImg} />

                      {/* Rank Badge */}
                      {Boolean(outfit.rank) ? (
                        <View style={styles.rankBadge}>
                          <AppText variant="xs" style={styles.rankBadgeText}>
                            #{outfit.rank}
                          </AppText>
                        </View>
                      ) : Boolean(outfit.fabric) ? (
                        <View style={styles.fabricBadge}>
                          <AppText variant="xs" style={styles.fabricBadgeText}>
                            {outfit.fabric}
                          </AppText>
                        </View>
                      ) : null}

                      {/* Floating Drape Button */}
                      <Pressable
                        onPress={() => {
                          router.push(
                            `/drape?garmentUrl=${encodeURIComponent(
                              outfit.imageUrl
                            )}&title=${encodeURIComponent(
                              outfit.title
                            )}&brand=${encodeURIComponent(outfit.brandName)}`
                          );
                        }}
                        style={styles.quickDrapeBtn}
                        hitSlop={6}
                      >
                        <Sparkles size={12} color="#ffffff" />
                        <AppText variant="xs" style={styles.quickDrapeText}>
                          Drape
                        </AppText>
                      </Pressable>
                    </View>

                    {/* Meta info */}
                    <View style={styles.outfitMeta}>
                      <View style={styles.outfitBrandRow}>
                        <Image source={{ uri: outfit.brandLogo }} style={styles.outfitBrandLogo} />
                        <AppText variant="xs" style={styles.outfitBrandName} numberOfLines={1}>
                          {outfit.brandName}
                        </AppText>
                        {outfit.isVerified && <ShieldCheck size={12} color={colors.accentBright} />}
                      </View>

                      <AppText variant="xs" style={styles.outfitTitle} numberOfLines={1}>
                        {outfit.title}
                      </AppText>

                      <View style={styles.priceRow}>
                        <AppText variant="body" style={styles.outfitPrice}>
                          ₹{outfit.price.toLocaleString()}
                        </AppText>
                        <AppText variant="xs" style={styles.outfitDrapes}>
                          {outfit.drapesCount > 1000
                            ? `${(outfit.drapesCount / 1000).toFixed(1)}k`
                            : outfit.drapesCount}{" "}
                          drapes
                        </AppText>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ))
        )}
      </ScrollView>

      {/* ─── Outfit Quick Detail Sheet ─── */}
      <Sheet
        open={Boolean(selectedOutfit)}
        onClose={() => setSelectedOutfit(null)}
        title={selectedOutfit?.brandName}
        subtitle={selectedOutfit?.title}
        maxHeight={0.88}
        footer={
          selectedOutfit ? (
            <View style={styles.sheetFooter}>
              <Pressable
                onPress={() => {
                  const item = selectedOutfit;
                  setSelectedOutfit(null);
                  router.push(
                    `/drape?garmentUrl=${encodeURIComponent(item.imageUrl)}&title=${encodeURIComponent(
                      item.title
                    )}&brand=${encodeURIComponent(item.brandName)}`
                  );
                }}
                style={styles.sheetDrapeBtn}
              >
                <Sparkles size={16} color="#ffffff" />
                <AppText variant="body" style={styles.sheetDrapeBtnText}>
                  Drape on My Twin
                </AppText>
              </Pressable>

              <Pressable
                onPress={() => {
                  if (selectedOutfit.buyUrl) {
                    void Linking.openURL(selectedOutfit.buyUrl);
                  }
                }}
                style={styles.sheetBuyBtn}
              >
                <ShoppingBag size={15} color={colors.ink} />
                <AppText variant="body" style={styles.sheetBuyBtnText}>
                  Buy
                </AppText>
                <ExternalLink size={13} color={colors.subtle} />
              </Pressable>
            </View>
          ) : undefined
        }
      >
        {selectedOutfit && (
          <View style={styles.sheetContent}>
            {/* Image Preview */}
            <View style={styles.sheetImgWrap}>
              <Image source={{ uri: selectedOutfit.imageUrl }} style={styles.sheetImg} />
              <View style={styles.sheetDrapeReadyBadge}>
                <CheckCircle2 size={13} color="#28e69d" />
                <AppText variant="xs" style={styles.sheetDrapeReadyText}>
                  AI Drape Ready
                </AppText>
              </View>
            </View>

            {/* Price & Action Row */}
            <View style={styles.sheetMetaRow}>
              <View>
                <AppText variant="title" style={styles.sheetPrice}>
                  ₹{selectedOutfit.price.toLocaleString()}
                </AppText>
                {Boolean(selectedOutfit.originalPrice) && (
                  <AppText variant="xs" style={styles.sheetOrigPrice}>
                    ₹{selectedOutfit.originalPrice?.toLocaleString()}
                  </AppText>
                )}
              </View>

              <View style={styles.sheetIconsRow}>
                <Pressable
                  onPress={() => setLiked(!liked)}
                  style={[styles.sheetIconBtn, liked && styles.sheetIconBtnLiked]}
                >
                  <Heart size={16} color={liked ? "#f43f5e" : colors.subtle} fill={liked ? "#f43f5e" : "transparent"} />
                </Pressable>
                <Pressable onPress={() => onShare(selectedOutfit)} style={styles.sheetIconBtn}>
                  <Share2 size={16} color={colors.subtle} />
                </Pressable>
              </View>
            </View>

            {/* Specs Tags */}
            <View style={styles.sheetSpecsRow}>
              <View style={styles.specBox}>
                <AppText variant="xs" style={styles.specLabel}>
                  FABRIC
                </AppText>
                <AppText variant="xs" style={styles.specVal}>
                  {selectedOutfit.fabric || "Brocade Silk"}
                </AppText>
              </View>
              <View style={styles.specBox}>
                <AppText variant="xs" style={styles.specLabel}>
                  OCCASION
                </AppText>
                <AppText variant="xs" style={styles.specVal}>
                  {selectedOutfit.occasion || "Celebration"}
                </AppText>
              </View>
            </View>

            <View style={styles.sheetStatsBar}>
              <View style={styles.statCol}>
                <AppText variant="xs" style={styles.statVal}>
                  {selectedOutfit.drapesCount.toLocaleString()}
                </AppText>
                <AppText variant="xs" style={styles.statLabel}>
                  Twin Drapes
                </AppText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <AppText variant="xs" style={styles.statVal}>
                  {selectedOutfit.likesCount.toLocaleString()}
                </AppText>
                <AppText variant="xs" style={styles.statLabel}>
                  Likes
                </AppText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <AppText variant="xs" style={styles.statVal}>
                  {selectedOutfit.sharesCount.toLocaleString()}
                </AppText>
                <AppText variant="xs" style={styles.statLabel}>
                  Shares
                </AppText>
              </View>
            </View>
          </View>
        )}
      </Sheet>

      {/* ─── Brand Storefront Sheet (From Top Brands Tap) ─── */}
      <Sheet
        open={Boolean(selectedBrand)}
        onClose={() => setSelectedBrand(null)}
        title={selectedBrand?.name}
        subtitle={`${selectedBrand?.totalDrapes.toLocaleString()} Completed Drapes`}
        maxHeight={0.92}
      >
        {selectedBrand && (
          <View style={styles.brandSheetWrap}>
            {/* Banner */}
            <View style={styles.brandSheetBannerWrap}>
              <Image source={{ uri: selectedBrand.banner }} style={styles.brandSheetBanner} />
              <View style={styles.brandSheetAvatarRow}>
                <Image source={{ uri: selectedBrand.logo }} style={styles.brandSheetAvatar} />
                <View style={styles.brandSheetTitleBox}>
                  <View style={styles.brandSheetTitleRow}>
                    <AppText variant="title" style={styles.brandSheetName}>
                      {selectedBrand.name}
                    </AppText>
                    {selectedBrand.isVerified && <ShieldCheck size={16} color={colors.accentBright} />}
                  </View>
                  <AppText variant="xs" style={styles.brandSheetFollowers}>
                    {selectedBrand.followersCount.toLocaleString()} clients
                  </AppText>
                </View>
              </View>
            </View>

            {/* Story */}
            <AppText variant="xs" style={styles.brandSheetStory}>
              {selectedBrand.story}
            </AppText>

            {/* Catalog Grid Header */}
            <AppText variant="body" style={styles.brandSheetCatalogTitle}>
              Runway Pieces ({selectedBrand.catalog.length})
            </AppText>

            {/* 2-Column Catalog Grid */}
            <View style={styles.brandCatalogGrid}>
              {selectedBrand.catalog.map((item) => (
                <View key={item.id} style={styles.catalogItemCard}>
                  <Image source={{ uri: item.images[0] }} style={styles.catalogItemImg} />
                  <View style={styles.catalogItemMeta}>
                    <AppText variant="xs" style={styles.catalogItemTitle} numberOfLines={1}>
                      {item.title}
                    </AppText>
                    <AppText variant="xs" style={styles.catalogItemPrice}>
                      ₹{item.price.toLocaleString()}
                    </AppText>
                    <Pressable
                      onPress={() => {
                        const brandName = selectedBrand.name;
                        setSelectedBrand(null);
                        router.push(
                          `/drape?garmentUrl=${encodeURIComponent(
                            item.images[0]
                          )}&title=${encodeURIComponent(item.title)}&brand=${encodeURIComponent(
                            brandName
                          )}`
                        );
                      }}
                      style={styles.catalogDrapeBtn}
                    >
                      <Sparkles size={11} color="#ffffff" />
                      <AppText variant="xs" style={styles.catalogDrapeText}>
                        Drape
                      </AppText>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scrollContent: {
    paddingTop: 4,
  },
  topBrandsSection: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.07)",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentBright,
  },
  sectionTitle: {
    color: colors.subtle,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  viewAllText: {
    color: colors.accentBright,
    fontWeight: "600",
  },
  brandChipsTrack: {
    paddingHorizontal: 16,
    gap: 14,
    paddingVertical: 4,
  },
  brandChip: {
    alignItems: "center",
    width: 68,
    gap: 6,
  },
  brandChipLogoWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    position: "relative",
  },
  brandChipLogo: {
    width: 36,
    height: 36,
  },
  brandChipRankBadge: {
    position: "absolute",
    bottom: -3,
    right: -3,
    backgroundColor: "#0a0d24",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accentBright,
  },
  brandChipRankText: {
    color: colors.accentBright,
    fontWeight: "800",
    fontSize: 9,
  },
  brandChipName: {
    color: colors.ink,
    fontWeight: "600",
    fontSize: 11,
    textAlign: "center",
    maxWidth: 68,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.07)",
  },
  searchBar: {
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.ink,
  },
  pillsTrack: {
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  pillActive: {
    backgroundColor: "#ffffff",
    borderColor: "#ffffff",
  },
  pillText: {
    color: colors.subtle,
    fontWeight: "500",
  },
  pillTextActive: {
    color: "#0b0b1e",
    fontWeight: "700",
  },
  emptyWrap: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyText: {
    color: colors.subtle,
    marginBottom: 12,
  },
  resetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  resetBtnText: {
    color: colors.ink,
    fontWeight: "600",
  },
  shelfWrap: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  shelfHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  shelfTitle: {
    color: colors.ink,
    fontWeight: "700",
    fontSize: 15,
  },
  shelfBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  shelfBadgeText: {
    color: colors.accentBright,
    fontSize: 10,
    fontWeight: "600",
  },
  shelfTrack: {
    paddingHorizontal: 16,
    gap: 12,
  },
  outfitCard: {
    width: 170,
    borderRadius: 16,
    backgroundColor: "rgba(9, 11, 30, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  outfitImgWrap: {
    aspectRatio: 3 / 4,
    width: "100%",
    backgroundColor: "#000000",
  },
  outfitImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  rankBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  rankBadgeText: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: "700",
  },
  fabricBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  fabricBadgeText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 9,
  },
  quickDrapeBtn: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  quickDrapeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "600",
  },
  outfitMeta: {
    padding: 10,
  },
  outfitBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  outfitBrandLogo: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  outfitBrandName: {
    color: colors.subtle,
    fontSize: 11,
    flex: 1,
  },
  outfitTitle: {
    color: colors.ink,
    fontWeight: "600",
    fontSize: 12,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  outfitPrice: {
    color: colors.ink,
    fontWeight: "700",
    fontSize: 13,
  },
  outfitDrapes: {
    color: colors.subtle,
    fontSize: 10,
  },
  sheetFooter: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 10,
  },
  sheetDrapeBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sheetDrapeBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  sheetBuyBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sheetBuyBtnText: {
    color: colors.ink,
    fontWeight: "600",
    fontSize: 13,
  },
  sheetContent: {
    paddingBottom: 16,
  },
  sheetImgWrap: {
    height: 280,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000000",
    marginBottom: 14,
  },
  sheetImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  sheetDrapeReadyBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  sheetDrapeReadyText: {
    color: "#28e69d",
    fontSize: 11,
    fontWeight: "600",
  },
  sheetMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sheetPrice: {
    color: colors.ink,
    fontWeight: "800",
    fontSize: 22,
  },
  sheetOrigPrice: {
    color: colors.subtle,
    textDecorationLine: "line-through",
    fontSize: 12,
  },
  sheetIconsRow: {
    flexDirection: "row",
    gap: 8,
  },
  sheetIconBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetIconBtnLiked: {
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    borderColor: "rgba(244, 63, 94, 0.3)",
  },
  sheetSpecsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  specBox: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  specLabel: {
    color: colors.subtle,
    fontSize: 9,
    fontWeight: "700",
    marginBottom: 2,
  },
  specVal: {
    color: colors.ink,
    fontWeight: "600",
    fontSize: 12,
  },
  sheetStatsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(102, 69, 235, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(102, 69, 235, 0.2)",
  },
  statCol: {
    alignItems: "center",
  },
  statVal: {
    color: colors.accentBright,
    fontWeight: "800",
    fontSize: 14,
  },
  statLabel: {
    color: colors.subtle,
    fontSize: 10,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  brandSheetWrap: {
    paddingBottom: 20,
  },
  brandSheetBannerWrap: {
    height: 140,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000000",
    marginBottom: 12,
  },
  brandSheetBanner: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    opacity: 0.6,
  },
  brandSheetAvatarRow: {
    position: "absolute",
    bottom: 10,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandSheetAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: "#000000",
  },
  brandSheetTitleBox: {
    flex: 1,
  },
  brandSheetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandSheetName: {
    color: colors.ink,
    fontWeight: "700",
    fontSize: 16,
  },
  brandSheetFollowers: {
    color: colors.subtle,
    fontSize: 11,
  },
  brandSheetStory: {
    color: colors.subtle,
    lineHeight: 18,
    marginBottom: 14,
  },
  brandSheetCatalogTitle: {
    color: colors.ink,
    fontWeight: "700",
    marginBottom: 10,
  },
  brandCatalogGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  catalogItemCard: {
    width: "48%",
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  catalogItemImg: {
    aspectRatio: 3 / 4,
    width: "100%",
    backgroundColor: "#000000",
  },
  catalogItemMeta: {
    padding: 8,
  },
  catalogItemTitle: {
    color: colors.ink,
    fontWeight: "600",
    fontSize: 11,
  },
  catalogItemPrice: {
    color: colors.accentBright,
    fontWeight: "700",
    fontSize: 11,
    marginTop: 2,
    marginBottom: 6,
  },
  catalogDrapeBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  catalogDrapeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "600",
  },
});
