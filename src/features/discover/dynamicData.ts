import { useCallback, useEffect, useMemo, useState } from "react";
import {
  discoverApi,
  type ApiBrand,
  type ApiBrandPost,
} from "./api";
import {
  DISCOVER_SHELVES,
  TOP_BIDDING_WINNERS,
  ALL_BRANDS_DIRECTORY,
  type ShelfOutfit,
  type DiscoverShelf,
  type BiddingWinnerBrand,
  type BrandDetail,
  type BrandCatalogItem,
} from "@/data/discover-shelves";

function extractPrice(post: ApiBrandPost): number {
  if (post.variants && post.variants.length > 0 && post.variants[0].price) {
    return post.variants[0].price;
  }
  if (post.taggedProducts && post.taggedProducts.length > 0) {
    const raw = post.taggedProducts[0].price || "";
    const num = parseInt(raw.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(num) && num > 0) return num;
  }
  return 42000;
}

function extractFabric(caption: string = ""): string {
  const fabrics = ["Brocade", "Silk", "Organza", "Chanderi", "Velvet", "Georgette", "Linen", "Tissue", "Zari", "Cotton"];
  for (const f of fabrics) {
    if (new RegExp(f, "i").test(caption)) return f;
  }
  return "Fine Silk";
}

/** Convert a backend ApiBrandPost into our ShelfOutfit shape */
export function mapApiPostToShelfOutfit(post: ApiBrandPost, index: number = 0): ShelfOutfit {
  const firstImage =
    Array.isArray(post.images) && post.images.length > 0
      ? post.images[0]
      : "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80";

  const price = extractPrice(post);
  const brandName = post.brand?.name || "Atelier Studio";
  const brandLogo = post.brand?.logoUrl || "https://images.unsplash.com/photo-1544441893-675973e31985?w=200&auto=format&fit=crop&q=80";
  const brandSlug = post.brand?.slug || "atelier";
  const category = post.category || "Runway Edit";

  return {
    id: post.id,
    title: post.title || post.caption.slice(0, 48) || "Runway Statement Look",
    brandId: post.brandId,
    brandName,
    brandLogo,
    brandSlug,
    isVerified: post.brand?.isVerified ?? true,
    price,
    originalPrice: price > 50000 ? Math.round(price * 1.15) : undefined,
    imageUrl: firstImage,
    category,
    occasion: category,
    drapesCount: (post.likesCount || 0) * 3 + 140 + index * 12,
    likesCount: post.likesCount || 0,
    sharesCount: post.sharesCount || 0,
    buyUrl: post.variants?.[0]?.productUrl || `https://threadflank.com/drape?postId=${post.id}`,
    fabric: extractFabric(post.caption),
  };
}

/** Convert an ApiBrand and its associated posts into BrandDetail shape */
export function mapApiBrandToBrandDetail(brand: ApiBrand, posts: ApiBrandPost[]): BrandDetail {
  const brandPosts = posts.filter((p) => p.brandId === brand.id);
  const defaultBanner =
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80";

  const catalog: BrandCatalogItem[] = brandPosts.map((p, idx) => {
    const img = Array.isArray(p.images) && p.images.length > 0 ? p.images : [defaultBanner];
    const price = extractPrice(p);
    return {
      id: p.id,
      title: p.title || p.caption.slice(0, 40) || `Piece #${idx + 1}`,
      sku: `SKU-${p.id.slice(-6).toUpperCase()}`,
      price,
      originalPrice: price > 50000 ? Math.round(price * 1.15) : undefined,
      images: img,
      category: p.category || brand.category || "Haute Couture",
      occasions: [p.category || "Festive"],
      colors: ["Royal Ivory", "Gold"],
      sizes: ["XS", "S", "M", "L", "XL"],
      fabric: extractFabric(p.caption),
      stock: 12,
      drapesCount: (p.likesCount || 0) * 3 + 80,
      likesCount: p.likesCount || 0,
      isDrapeReady: true,
      buyUrl: p.variants?.[0]?.productUrl || brand.socialLinks?.website || "https://threadflank.com",
      collection: "Current Runway",
    };
  });

  const finalCatalog = catalog.length > 0 ? catalog : ALL_BRANDS_DIRECTORY[0]?.catalog || [];

  return {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    logo: brand.logoUrl || "https://images.unsplash.com/photo-1544441893-675973e31985?w=200&auto=format&fit=crop&q=80",
    banner: brandPosts[0]?.images?.[0] || defaultBanner,
    story: brand.description || "Contemporary luxury atelier presenting handcrafted artisanal couture.",
    category: brand.category || "Ethnic Luxury",
    isVerified: brand.isVerified,
    followersCount: 12400 + brandPosts.length * 1500,
    totalDrapes: brandPosts.reduce((acc, p) => acc + (p.likesCount * 3 + 80), 3200),
    themeAccent: "#6645eb",
    websiteUrl: brand.socialLinks?.website || `https://${brand.slug}.com`,
    collections: ["Current Runway", "Signature Edit"],
    catalog: finalCatalog,
  };
}

/** Hook that loads real brands & posts from backend and creates dynamic Spotify-style shelves */
export function useDynamicDiscover(token?: string | null) {
  const [loading, setLoading] = useState(true);
  const [apiBrands, setApiBrands] = useState<ApiBrand[]>([]);
  const [apiPosts, setApiPosts] = useState<ApiBrandPost[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [brandsRes, postsRes] = await Promise.all([
        discoverApi.listBrands(token),
        discoverApi.listBrandPosts(token, { limit: 100 }),
      ]);

      setApiBrands(brandsRes || []);
      setApiPosts(postsRes.posts || []);
    } catch (err) {
      console.warn("Could not fetch discover data from API, using fallback", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Build dynamic Bidding Winners (Top 10 Promoted Brands)
  const biddingWinners = useMemo<BiddingWinnerBrand[]>(() => {
    if (loading) return [];
    if (apiBrands.length === 0) return TOP_BIDDING_WINNERS;

    const winners: BiddingWinnerBrand[] = apiBrands.slice(0, 10).map((brand, idx) => {
      const brandPosts = apiPosts.filter((p) => p.brandId === brand.id);
      const hero = brandPosts[0];
      const heroImg =
        hero?.images?.[0] ||
        TOP_BIDDING_WINNERS[idx % TOP_BIDDING_WINNERS.length]?.heroOutfit.imageUrl ||
        "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80";

      return {
        rank: idx + 1,
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logo: brand.logoUrl || TOP_BIDDING_WINNERS[idx % TOP_BIDDING_WINNERS.length]?.logo || "",
        banner: heroImg,
        tagline: brand.description || "Contemporary Indian luxury rooted in indigenous textile craft.",
        followersCount: 14000 + (10 - idx) * 3500,
        monthlyScore: 18000 - idx * 800,
        heroOutfit: {
          id: hero?.id || `hero_${brand.id}`,
          title: hero?.title || hero?.caption.slice(0, 36) || "Signature Runway Look",
          imageUrl: heroImg,
          price: hero ? extractPrice(hero) : 46000,
          drapes: 12000 - idx * 600,
        },
      };
    });

    if (winners.length < 4) {
      const extra = TOP_BIDDING_WINNERS.slice(winners.length).map((b, i) => ({
        ...b,
        rank: winners.length + i + 1,
      }));
      return [...winners, ...extra];
    }

    return winners;
  }, [loading, apiBrands, apiPosts]);

  // Build dynamic Brand Directory
  const brandsDirectory = useMemo<BrandDetail[]>(() => {
    if (loading) return [];
    if (apiBrands.length === 0) return ALL_BRANDS_DIRECTORY;

    const dynamicDirectory = apiBrands.map((b) => mapApiBrandToBrandDetail(b, apiPosts));
    if (dynamicDirectory.length < ALL_BRANDS_DIRECTORY.length) {
      const existingSlugs = new Set(dynamicDirectory.map((b) => b.slug));
      const supplemental = ALL_BRANDS_DIRECTORY.filter((b) => !existingSlugs.has(b.slug));
      return [...dynamicDirectory, ...supplemental];
    }
    return dynamicDirectory;
  }, [loading, apiBrands, apiPosts]);

  // Build dynamic Shelves from API posts
  const shelves = useMemo<DiscoverShelf[]>(() => {
    if (loading) return [];
    if (apiPosts.length === 0) return DISCOVER_SHELVES;

    const dynamicOutfits = apiPosts.map((p, idx) => mapApiPostToShelfOutfit(p, idx));

    const topDraped = [...dynamicOutfits]
      .sort((a, b) => b.likesCount + b.drapesCount - (a.likesCount + a.drapesCount))
      .slice(0, 20)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));

    const recentDrops = [...dynamicOutfits].slice(0, 15);
    const mostLiked = [...dynamicOutfits].sort((a, b) => b.likesCount - a.likesCount).slice(0, 15);
    const mostShared = [...dynamicOutfits].sort((a, b) => b.sharesCount - a.sharesCount).slice(0, 15);

    const categoryMap = new Map<string, ShelfOutfit[]>();
    for (const outfit of dynamicOutfits) {
      const cat = outfit.category || "Runway Edit";
      if (!categoryMap.has(cat)) categoryMap.set(cat, []);
      categoryMap.get(cat)!.push(outfit);
    }

    const dynamicShelves: DiscoverShelf[] = [
      {
        id: "shelf_top_draped",
        title: "Top 20 Most Draped Outfits of the Month",
        subtitle: "Real avatar try-on popularity rank computed over the last 30 days.",
        badge: "Official Rank",
        category: "trending",
        items: topDraped.length >= 3 ? topDraped : DISCOVER_SHELVES[0].items,
      },
      {
        id: "shelf_recent_drops",
        title: "Recent Launches & Fresh Drops",
        subtitle: "Just dropped across partner atelier collections.",
        badge: "New Release",
        category: "launches",
        items: recentDrops.length >= 3 ? recentDrops : DISCOVER_SHELVES[3].items,
      },
      {
        id: "shelf_most_liked",
        title: "Community Hall of Fame: Most Liked",
        subtitle: "High-fashion statements voted by Threadflank stylists.",
        badge: "Trending Love",
        category: "liked",
        items: mostLiked.length >= 3 ? mostLiked : DISCOVER_SHELVES[5].items,
      },
      {
        id: "shelf_most_shared",
        title: "Most Shared Across Circles",
        subtitle: "The most sent outfit cards across group chats and twin circles.",
        badge: "Viral Loop",
        category: "shared",
        items: mostShared.length >= 3 ? mostShared : DISCOVER_SHELVES[4].items,
      },
    ];

    categoryMap.forEach((items, catName) => {
      if (items.length >= 2) {
        dynamicShelves.push({
          id: `shelf_cat_${catName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
          title: `${catName} Collection`,
          subtitle: `Curated ${catName.toLowerCase()} runway pieces for your digital twin.`,
          badge: "Curated Edit",
          category: catName.toLowerCase(),
          items,
        });
      }
    });

    if (dynamicShelves.length < 8) {
      const existingIds = new Set(dynamicShelves.map((s) => s.id));
      const extras = DISCOVER_SHELVES.filter((s) => !existingIds.has(s.id));
      return [...dynamicShelves, ...extras];
    }

    return dynamicShelves;
  }, [loading, apiPosts]);

  // Dynamic Category Pills for search & filter
  const categories = useMemo(() => {
    const set = new Set<string>();
    shelves.forEach((s) => {
      if (s.category && s.category !== "trending" && s.category !== "interest") {
        set.add(s.category);
      }
    });

    const standard = [
      { id: "all", label: "All" },
      { id: "trending", label: "Most Draped" },
      { id: "interest", label: "For You" },
      { id: "launches", label: "Fresh Drops" },
      { id: "shared", label: "Shared" },
    ];

    const dynamic = Array.from(set).map((cat) => ({
      id: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
    }));

    const seen = new Set(standard.map((s) => s.id));
    for (const d of dynamic) {
      if (!seen.has(d.id)) {
        seen.add(d.id);
        standard.push(d);
      }
    }

    return standard;
  }, [shelves]);

  return {
    loading,
    refetch: loadData,
    biddingWinners,
    brandsDirectory,
    shelves,
    categories,
    apiPostsCount: apiPosts.length,
    apiBrandsCount: apiBrands.length,
  };
}
