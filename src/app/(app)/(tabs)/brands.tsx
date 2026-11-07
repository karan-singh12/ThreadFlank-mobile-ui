import { useRouter } from "expo-router";
import {
  ArrowRight,
  ExternalLink,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  X,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "@/components/layout/Screen";
import { AppText } from "@/components/ui/AppText";
import { Sheet } from "@/components/ui/Sheet";
import { type BrandDetail } from "@/data/discover-shelves";
import { AppHeader } from "@/features/app/AppHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import { useDynamicDiscover } from "@/features/discover/dynamicData";
import { colors, radius, TAB_BAR_HEIGHT } from "@/theme";

export default function BrandsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();

  const { loading, brandsDirectory, refetch } = useDynamicDiscover(token);

  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("All Maisons");
  const [refreshing, setRefreshing] = useState(false);
  const [activeBrand, setActiveBrand] = useState<BrandDetail | null>(null);

  const featuredMaison = brandsDirectory[0];

  const categories = useMemo(() => {
    const cats = new Set<string>();
    brandsDirectory.forEach((b) => {
      if (b.category) cats.add(b.category);
    });
    return ["All Maisons", ...Array.from(cats)];
  }, [brandsDirectory]);

  const filtered = useMemo(() => {
    return brandsDirectory.filter((b) => {
      const matchesSearch =
        !search ||
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.category.toLowerCase().includes(search.toLowerCase());
      const matchesCat = selectedCat === "All Maisons" || b.category === selectedCat;
      return matchesSearch && matchesCat;
    });
  }, [brandsDirectory, search, selectedCat]);

  if (loading) {
    return (
      <Screen header={<AppHeader />} scroll={false} padded={false} tabBar>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accentBright} />
          <AppText variant="xs" color={colors.subtle} style={{ marginTop: 12 }}>
            Loading luxury maisons...
          </AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={<AppHeader />} scroll={false} padded={false} tabBar>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
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
        ListHeaderComponent={
          <View style={styles.header}>
            {/* ─── 1. Grand Maison Hero Showcase (Top Featured) ─── */}
            {!search && selectedCat === "All Maisons" && featuredMaison && (
              <View style={styles.heroCard}>
                <Image source={{ uri: featuredMaison.banner }} style={styles.heroBanner} />
                <View style={styles.heroOverlay} />

                <View style={styles.heroContent}>
                  <View style={styles.heroTag}>
                    <View style={styles.heroDot} />
                    <AppText variant="xs" style={styles.heroTagText}>
                      MAISON OF THE MONTH
                    </AppText>
                  </View>

                  <AppText variant="title" style={styles.heroTitle}>
                    {featuredMaison.name}
                  </AppText>

                  <AppText variant="xs" style={styles.heroStory} numberOfLines={2}>
                    {featuredMaison.story}
                  </AppText>

                  <View style={styles.heroStatsRow}>
                    <View style={styles.heroStatPill}>
                      <AppText variant="xs" style={styles.heroStatText}>
                        {featuredMaison.totalDrapes.toLocaleString()} Drapes
                      </AppText>
                    </View>
                    <View style={styles.heroStatPill}>
                      <AppText variant="xs" style={styles.heroStatText}>
                        {featuredMaison.catalog.length} Runway Looks
                      </AppText>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => setActiveBrand(featuredMaison)}
                    style={styles.heroEnterBtn}
                  >
                    <Store size={14} color="#ffffff" />
                    <AppText variant="xs" style={styles.heroEnterBtnText}>
                      Enter Virtual Atelier
                    </AppText>
                    <ArrowRight size={14} color="#ffffff" />
                  </Pressable>
                </View>
              </View>
            )}

            {/* ─── 2. Search Box ─── */}
            <View style={styles.searchBar}>
              <Search size={15} color={colors.subtle} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search ateliers, designers..."
                placeholderTextColor={colors.subtle}
                style={styles.input}
              />
              {Boolean(search) && (
                <Pressable onPress={() => setSearch("")} hitSlop={8}>
                  <X size={14} color={colors.subtle} />
                </Pressable>
              )}
            </View>

            {/* ─── 3. Category Filter Pills ─── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillsRow}
            >
              {categories.map((cat) => {
                const active = selectedCat === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setSelectedCat(cat)}
                    style={[styles.pill, active && styles.pillActive]}
                  >
                    <AppText
                      variant="xs"
                      style={[styles.pillText, active && styles.pillTextActive]}
                    >
                      {cat}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => setActiveBrand(item)} style={styles.card}>
            {/* Banner */}
            <View style={styles.bannerWrap}>
              <Image source={{ uri: item.banner }} style={styles.banner} />
              <View style={styles.categoryBadge}>
                <AppText variant="xs" style={styles.badgeText}>
                  {item.category}
                </AppText>
              </View>
              <View style={styles.drapesBadge}>
                <AppText variant="xs" style={styles.badgeText}>
                  {item.totalDrapes.toLocaleString()} drapes
                </AppText>
              </View>
            </View>

            {/* Card Body */}
            <View style={styles.body}>
              <View style={styles.brandRow}>
                <Image source={{ uri: item.logo }} style={styles.logo} />
                <View style={styles.brandMeta}>
                  <View style={styles.nameRow}>
                    <AppText variant="body" style={styles.brandName} numberOfLines={1}>
                      {item.name}
                    </AppText>
                    {item.isVerified && <ShieldCheck size={14} color={colors.accentBright} />}
                  </View>
                  <AppText variant="xs" style={styles.clientsCount}>
                    {item.followersCount.toLocaleString()} clients
                  </AppText>
                </View>
              </View>

              <AppText variant="xs" style={styles.tagline} numberOfLines={2}>
                {item.tagline || item.story}
              </AppText>

              {/* 3-Image Preview Strip */}
              <View style={styles.previewRow}>
                {item.catalog.slice(0, 3).map((outfit) => (
                  <View key={outfit.id} style={styles.previewImgWrap}>
                    <Image source={{ uri: outfit.images[0] }} style={styles.previewImg} />
                    <View style={styles.previewPriceBadge}>
                      <AppText variant="xs" style={styles.previewPriceText}>
                        ₹{(outfit.price / 1000).toFixed(0)}k
                      </AppText>
                    </View>
                  </View>
                ))}
              </View>

              {/* Action Bar */}
              <View style={styles.bottomBar}>
                <AppText variant="xs" style={styles.enterShowroomText}>
                  Explore Showroom
                </AppText>
                <ArrowRight size={14} color={colors.accentBright} />
              </View>
            </View>
          </Pressable>
        )}
      />

      {/* ─── Brand Storefront Modal / Sheet ─── */}
      <Sheet
        open={Boolean(activeBrand)}
        onClose={() => setActiveBrand(null)}
        title={activeBrand?.name}
        subtitle={`${activeBrand?.totalDrapes.toLocaleString()} Completed Drapes`}
        maxHeight={0.92}
      >
        {activeBrand && (
          <View style={styles.sheetWrap}>
            {/* Banner */}
            <View style={styles.sheetBannerWrap}>
              <Image source={{ uri: activeBrand.banner }} style={styles.sheetBanner} />
              <View style={styles.sheetAvatarRow}>
                <Image source={{ uri: activeBrand.logo }} style={styles.sheetAvatar} />
                <View style={styles.sheetTitleBox}>
                  <View style={styles.sheetTitleRow}>
                    <AppText variant="title" style={styles.sheetBrandName}>
                      {activeBrand.name}
                    </AppText>
                    {activeBrand.isVerified && (
                      <ShieldCheck size={16} color={colors.accentBright} />
                    )}
                  </View>
                  <AppText variant="xs" style={styles.sheetFollowers}>
                    {activeBrand.followersCount.toLocaleString()} clients
                  </AppText>
                </View>
              </View>
            </View>

            {/* Story */}
            <AppText variant="xs" style={styles.sheetStory}>
              {activeBrand.story}
            </AppText>

            {/* Catalog Grid */}
            <AppText variant="body" style={styles.sheetCatalogHeading}>
              Runway Pieces ({activeBrand.catalog.length})
            </AppText>

            <View style={styles.catalogGrid}>
              {activeBrand.catalog.map((item) => (
                <View key={item.id} style={styles.catalogCard}>
                  <Image source={{ uri: item.images[0] }} style={styles.catalogCardImg} />
                  <View style={styles.catalogCardBody}>
                    <AppText variant="xs" style={styles.catalogCardTitle} numberOfLines={1}>
                      {item.title}
                    </AppText>
                    <AppText variant="xs" style={styles.catalogCardPrice}>
                      ₹{item.price.toLocaleString()}
                    </AppText>
                    <Pressable
                      onPress={() => {
                        const name = activeBrand.name;
                        setActiveBrand(null);
                        router.push(
                          `/drape?garmentUrl=${encodeURIComponent(
                            item.images[0]
                          )}&title=${encodeURIComponent(item.title)}&brand=${encodeURIComponent(
                            name
                          )}`
                        );
                      }}
                      style={styles.catalogDrapeBtn}
                    >
                      <Sparkles size={11} color="#ffffff" />
                      <AppText variant="xs" style={styles.catalogDrapeText}>
                        Drape Look
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
  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  header: {
    marginBottom: 16,
  },
  heroCard: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    backgroundColor: "#070817",
    marginBottom: 16,
  },
  heroBanner: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    opacity: 0.35,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(7, 9, 25, 0.6)",
  },
  heroContent: {
    padding: 18,
  },
  heroTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentBright,
  },
  heroTagText: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: colors.ink,
    fontWeight: "900",
    fontSize: 22,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  heroStory: {
    color: "rgba(255, 255, 255, 0.75)",
    lineHeight: 18,
    marginBottom: 12,
  },
  heroStatsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  heroStatPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  heroStatText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "600",
  },
  heroEnterBtn: {
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  heroEnterBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
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
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: colors.ink,
  },
  pillsRow: {
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
  card: {
    borderRadius: 20,
    backgroundColor: "rgba(8, 9, 30, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.09)",
    overflow: "hidden",
    marginBottom: 16,
  },
  bannerWrap: {
    height: 125,
    backgroundColor: "#000000",
  },
  banner: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    opacity: 0.7,
  },
  categoryBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  drapesBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  badgeText: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: "600",
  },
  body: {
    padding: 14,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: -28,
    marginBottom: 8,
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.25)",
    backgroundColor: "#000000",
  },
  brandMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandName: {
    color: colors.ink,
    fontWeight: "700",
    fontSize: 15,
  },
  clientsCount: {
    color: colors.subtle,
    fontSize: 11,
    marginTop: 2,
  },
  tagline: {
    color: colors.subtle,
    lineHeight: 18,
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  previewImgWrap: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  previewImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  previewPriceBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 6,
    paddingVertical: 2,
    alignItems: "center",
  },
  previewPriceText: {
    color: colors.ink,
    fontSize: 9,
    fontWeight: "700",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  enterShowroomText: {
    color: colors.accentBright,
    fontWeight: "600",
    fontSize: 12,
  },
  sheetWrap: {
    paddingBottom: 24,
  },
  sheetBannerWrap: {
    height: 140,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000000",
    marginBottom: 12,
  },
  sheetBanner: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    opacity: 0.65,
  },
  sheetAvatarRow: {
    position: "absolute",
    bottom: 10,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sheetAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: "#000000",
  },
  sheetTitleBox: {
    flex: 1,
  },
  sheetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sheetBrandName: {
    color: colors.ink,
    fontWeight: "700",
    fontSize: 16,
  },
  sheetFollowers: {
    color: colors.subtle,
    fontSize: 11,
  },
  sheetStory: {
    color: colors.subtle,
    lineHeight: 18,
    marginBottom: 14,
  },
  sheetCatalogHeading: {
    color: colors.ink,
    fontWeight: "700",
    marginBottom: 10,
  },
  catalogGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  catalogCard: {
    width: "48%",
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  catalogCardImg: {
    aspectRatio: 3 / 4,
    width: "100%",
    backgroundColor: "#000000",
  },
  catalogCardBody: {
    padding: 8,
  },
  catalogCardTitle: {
    color: colors.ink,
    fontWeight: "600",
    fontSize: 11,
  },
  catalogCardPrice: {
    color: colors.accentBright,
    fontWeight: "700",
    fontSize: 11,
    marginTop: 2,
    marginBottom: 6,
  },
  catalogDrapeBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 5,
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
