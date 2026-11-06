import { useRouter } from "expo-router";
import { ArrowRight, Search, ShieldCheck, Sparkles, Store, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "@/components/layout/Screen";
import { AppText } from "@/components/ui/AppText";
import { AppHeader } from "@/features/app/AppHeader";
import { colors, radius, TAB_BAR_HEIGHT } from "@/theme";

interface BrandItem {
  id: string;
  name: string;
  category: string;
  banner: string;
  logo: string;
  isVerified: boolean;
  totalDrapes: number;
  previewImages: string[];
}

const BRANDS_DATA: BrandItem[] = [
  {
    id: "raw-mango",
    name: "Raw Mango Atelier",
    category: "Ethnic Luxury",
    banner: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1544441893-675973e31985?w=200&auto=format&fit=crop&q=80",
    isVerified: true,
    totalDrapes: 18400,
    previewImages: [
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&auto=format&fit=crop&q=80",
    ],
  },
  {
    id: "torani",
    name: "Torani Official",
    category: "Ethnic Luxury",
    banner: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1000&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    isVerified: true,
    totalDrapes: 14200,
    previewImages: [
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&auto=format&fit=crop&q=80",
    ],
  },
  {
    id: "sabyasachi",
    name: "Sabyasachi Heritage",
    category: "Bridal Atelier",
    banner: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1000&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    isVerified: true,
    totalDrapes: 24500,
    previewImages: [
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop&q=80",
    ],
  },
  {
    id: "anita-dongre",
    name: "Anita Dongre Grassroot",
    category: "Sustainable Handloom",
    banner: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1000&auto=format&fit=crop&q=80",
    logo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
    isVerified: true,
    totalDrapes: 11400,
    previewImages: [
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop&q=80",
    ],
  },
];

const CATEGORIES = ["All", "Ethnic Luxury", "Bridal Atelier", "Sustainable Handloom"];

export default function BrandsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    return BRANDS_DATA.filter((b) => {
      const matchesSearch = !search || b.name.toLowerCase().includes(search.toLowerCase());
      const matchesCat = selectedCat === "All" || b.category === selectedCat;
      return matchesSearch && matchesCat;
    });
  }, [search, selectedCat]);

  return (
    <Screen style={styles.container}>
      <AppHeader />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 24 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 800);
            }}
            tintColor={colors.accentBright}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Store size={18} color={colors.accentBright} />
              <AppText variant="title" style={styles.title}>
                Brand Showrooms
              </AppText>
            </View>

            {/* Search Input */}
            <View style={styles.searchBar}>
              <Search size={15} color={colors.subtle} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search ateliers..."
                placeholderTextColor={colors.subtle}
                style={styles.input}
              />
              {Boolean(search) && (
                <Pressable onPress={() => setSearch("")} hitSlop={8}>
                  <X size={14} color={colors.subtle} />
                </Pressable>
              )}
            </View>

            {/* Category Pills */}
            <View style={styles.pillsRow}>
              {CATEGORIES.map((cat) => {
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
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Banner */}
            <View style={styles.bannerWrap}>
              <Image source={{ uri: item.banner }} style={styles.banner} />
              <View style={styles.categoryBadge}>
                <AppText variant="xs" style={styles.badgeText}>
                  {item.category}
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
                  <AppText variant="xs" style={styles.drapesCount}>
                    {item.totalDrapes.toLocaleString()} drapes
                  </AppText>
                </View>
              </View>

              {/* Preview Grid */}
              <View style={styles.previewRow}>
                {item.previewImages.map((uri, idx) => (
                  <Image key={idx} source={{ uri }} style={styles.previewImg} />
                ))}
              </View>

              {/* Action Button */}
              <Pressable
                onPress={() => {
                  router.push(`/drape?garmentUrl=${encodeURIComponent(item.previewImages[0])}&brand=${encodeURIComponent(item.name)}`);
                }}
                style={styles.actionBtn}
              >
                <Sparkles size={14} color={colors.ink} />
                <AppText variant="xs" style={styles.actionBtnText}>
                  Drape Signature Piece
                </AppText>
                <ArrowRight size={14} color={colors.ink} />
              </Pressable>
            </View>
          </View>
        )}
      />
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
    paddingTop: 8,
  },
  header: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  title: {
    color: colors.ink,
    fontWeight: "700",
  },
  searchBar: {
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
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
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
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
    backgroundColor: "rgba(11, 12, 30, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
    marginBottom: 16,
  },
  bannerWrap: {
    height: 120,
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
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
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
    marginTop: -26,
    marginBottom: 12,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
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
    fontSize: 14,
  },
  drapesCount: {
    color: colors.subtle,
    fontSize: 11,
    marginTop: 2,
  },
  previewRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  previewImg: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  actionBtn: {
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionBtnText: {
    color: colors.ink,
    fontWeight: "600",
    fontSize: 12,
  },
});
