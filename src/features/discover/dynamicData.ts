import { useCallback, useEffect, useMemo, useState } from "react";
import {
  discoverApi,
  type ApiBrandPost,
  type ApiDiscoverCategory,
  type ApiShowcaseBrand,
  type ApiSpotlight,
} from "./api";
import { API_BASE_URL } from "@/lib/api/config";
import {
  type ShelfOutfit,
  type DiscoverShelf,
  type BiddingWinnerBrand,
  type BrandDetail,
  type BrandCatalogItem,
} from "@/data/discover-shelves";

/** The same name matching the server uses, so "Navratri Men" and "navratri  men" are one category. */
const slugOf = (v: string) => v.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function extractPrice(post: ApiBrandPost): number {
  if (post.variants && post.variants.length > 0 && post.variants[0].price) {
    return post.variants[0].price;
  }
  if (post.taggedProducts && post.taggedProducts.length > 0) {
    const raw = post.taggedProducts[0].price || "";
    const num = parseInt(raw.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(num) && num > 0) return num;
  }
  // Unknown: the UI shows "Price at store" instead of a made-up number.
  return 0;
}

function extractFabric(caption: string = ""): string {
  const fabrics = ["Brocade", "Silk", "Organza", "Chanderi", "Velvet", "Georgette", "Linen", "Tissue", "Zari", "Cotton"];
  for (const f of fabrics) {
    if (new RegExp(f, "i").test(caption)) return f;
  }
  return "";
}

/** Convert a backend ApiBrandPost into our ShelfOutfit shape */
export function mapApiPostToShelfOutfit(post: ApiBrandPost): ShelfOutfit {
  const firstImage = Array.isArray(post.images) && post.images.length > 0 ? post.images[0] : PLACEHOLDER_IMAGE;

  const price = extractPrice(post);
  const brandName = post.brand?.name || "Threadflank";
  const brandLogo = post.brand?.logoUrl || PLACEHOLDER_IMAGE;
  const brandSlug = post.brand?.slug || "";
  const category = post.category || "";

  return {
    id: post.id,
    title: post.title || post.caption.slice(0, 48) || `Look by ${brandName}`,
    brandId: post.brandId,
    brandName,
    brandLogo,
    brandSlug,
    isVerified: post.brand?.isVerified ?? true,
    price,
    imageUrl: firstImage,
    category,
    occasion: category,
    // No try-on counter exists yet, so this is 0 rather than a guess built from likes.
    drapesCount: 0,
    likesCount: post.likesCount || 0,
    sharesCount: post.sharesCount || 0,
    buyUrl: post.hasBuyLink ? `${API_BASE_URL}/brands/products/${post.id}/go` : post.variants?.[0]?.productUrl || "",
    fabric: extractFabric(post.caption),
  };
}

const PLACEHOLDER_IMAGE = "/logo-emblem.webp";

/** A brand as the brand panel set it up: its own catalog, its own drops. Nothing here is invented. */
export function mapShowcaseBrand(entry: ApiShowcaseBrand): BrandDetail {
  const { brand, products, drops } = entry;
  const social = brand.socialLinks ?? {};
  const text = (v: unknown) => (typeof v === "string" ? v : "");
  const catalog: BrandCatalogItem[] = products.map((p) => ({
    id: p.id,
    title: p.title,
    sku: "",
    price: p.price,
    originalPrice: p.originalPrice,
    images: p.images.length > 0 ? p.images : [PLACEHOLDER_IMAGE],
    category: p.category,
    occasions: p.occasions,
    colors: p.colors,
    sizes: p.sizes,
    fabric: "",
    stock: p.inStock ? 1 : 0,
    drapesCount: 0,
    likesCount: 0,
    isDrapeReady: p.isDrapeReady,
    // Buy goes through the backend so the brand sees the click, then lands on the brand's own store page.
    buyUrl: p.hasBuyLink ? `${API_BASE_URL}/brands/products/${p.id}/go` : "",
    collection: "",
  }));
  const logo = brand.logoUrl || "";
  return {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    logo,
    // Only a real photo is used as the cover. With none, the card shows the brand colour instead of a stretched logo.
    banner: text(social.banner) || products.find((p) => p.images.length > 0)?.images[0] || "",
    story: brand.description ?? "",
    category: brand.category || "Fashion",
    isVerified: brand.isVerified,
    followersCount: 0,
    totalDrapes: 0,
    themeAccent: text(social.themeAccent) || "#6645eb",
    announcementText: text(social.announcementText) || undefined,
    websiteUrl: brand.websiteUrl || text(social.website),
    collections: [],
    catalog,
    drops: drops.map((d) => ({ id: d.id, title: d.title, collectionName: d.collectionName, description: d.description, launchDate: d.launchDate, waitlistCount: d.waitlistCount, status: d.status, bannerUrl: d.bannerUrl, joined: d.joined })),
  };
}

/** Hook that loads real brands & posts from backend and creates dynamic Spotify-style shelves */
export function useDynamicDiscover(token?: string | null) {
  const [loading, setLoading] = useState(true);
  const [showcase, setShowcase] = useState<ApiShowcaseBrand[]>([]);
  const [spotlight, setSpotlight] = useState<ApiSpotlight>({ period: null, brands: [] });
  const [adminCategories, setAdminCategories] = useState<ApiDiscoverCategory[]>([]);
  const [apiPosts, setApiPosts] = useState<ApiBrandPost[]>([]);
  // Bumped by pull-to-refresh to load everything again.
  const [reload, setReload] = useState(0);
  const refetch = useCallback(() => setReload((n) => n + 1), []);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [showcaseRes, spotlightRes, categoriesRes, postsRes] = await Promise.all([
          discoverApi.showcase(token),
          discoverApi.spotlight(),
          discoverApi.categories(),
          discoverApi.listBrandPosts(token, { limit: 100 }),
        ]);

        if (!active) return;
        setShowcase(showcaseRes);
        setSpotlight(spotlightRes);
        setAdminCategories(categoriesRes);
        setApiPosts(postsRes.posts || []);
      } catch (err) {
        console.warn("Could not fetch discover data from API, using fallback", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [token, reload]);

  // Brands that really won the latest runway auction. Empty until an auction has closed with winners.
  const brandsDirectory = useMemo<BrandDetail[]>(() => (loading ? [] : showcase.map(mapShowcaseBrand)), [loading, showcase]);

  const toPromoted = (b: BrandDetail, rank: number, tagline?: string): BiddingWinnerBrand => {
    const hero = b.catalog[0];
    return {
      rank,
      id: b.id,
      name: b.name,
      slug: b.slug,
      logo: b.logo,
      banner: b.banner,
      tagline: b.story || tagline || "",
      followersCount: 0,
      monthlyScore: 0,
      heroOutfit: { id: hero?.id ?? `hero_${b.id}`, title: hero?.title ?? "", imageUrl: hero?.images[0] ?? b.banner, price: hero?.price ?? 0, drapes: 0 },
    };
  };

  const promoted = useMemo<{ brands: BiddingWinnerBrand[]; isAuction: boolean }>(() => {
    if (loading) return { brands: [], isAuction: false };
    const winners = spotlight.brands.flatMap((w) => {
      const detail = brandsDirectory.find((b) => b.id === w.brand.id);
      return detail ? [toPromoted(detail, w.rank, w.category)] : [];
    });
    if (winners.length > 0) return { brands: winners, isAuction: true };
    // No auction has closed yet: show real brands (ones with pieces first, then verified), labelled as plain brands, not as promoted.
    const ranked = [...brandsDirectory]
      .sort((a, b) => Number(b.catalog.length > 0) - Number(a.catalog.length > 0) || Number(b.isVerified) - Number(a.isVerified) || a.name.localeCompare(b.name))
      .slice(0, 10)
      .map((b, i) => toPromoted(b, i + 1));
    return { brands: ranked, isAuction: false };
  }, [loading, spotlight, brandsDirectory]);
  const biddingWinners = promoted.brands;

  // Build dynamic Shelves from API posts
  const shelves = useMemo<DiscoverShelf[]>(() => {
    if (loading) return [];
    if (apiPosts.length === 0) return [];

    const dynamicOutfits = apiPosts.map((p) => mapApiPostToShelfOutfit(p));

    // 1. Most popular: ranked by real likes and shares from the community
    const topDraped = [...dynamicOutfits]
      .sort((a, b) => b.likesCount + b.sharesCount - (a.likesCount + a.sharesCount))
      .slice(0, 20)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));

    // 2. Recent Drops (sorted by newest)
    const recentDrops = [...dynamicOutfits].slice(0, 15);

    // 3. Most Liked (Hall of Fame)
    const mostLiked = dynamicOutfits.filter((o) => o.likesCount > 0).sort((a, b) => b.likesCount - a.likesCount).slice(0, 15);

    // 4. Most Shared
    const mostShared = dynamicOutfits.filter((o) => o.sharesCount > 0).sort((a, b) => b.sharesCount - a.sharesCount).slice(0, 15);

    // 5. Group by distinct categories in API posts (e.g. Sarees, Ethnic Wear, Menswear...)
    const categoryMap = new Map<string, ShelfOutfit[]>();
    for (const outfit of dynamicOutfits) {
      const cat = outfit.category || "Runway Edit";
      if (!categoryMap.has(cat)) categoryMap.set(cat, []);
      categoryMap.get(cat)!.push(outfit);
    }

    const baseShelves: DiscoverShelf[] = [
      {
        id: "shelf_top_draped",
        title: "Most popular right now",
        subtitle: "Ranked by likes and shares from the Threadflank community.",
        badge: "Popular",
        category: "trending",
        items: topDraped,
      },
      {
        id: "shelf_recent_drops",
        title: "Recent Launches & Fresh Drops",
        subtitle: "Just dropped across partner atelier collections.",
        badge: "New Release",
        category: "launches",
        items: recentDrops,
      },
      {
        id: "shelf_most_liked",
        title: "Community Hall of Fame: Most Liked",
        subtitle: "High-fashion statements voted by Threadflank stylists.",
        badge: "Trending Love",
        category: "liked",
        items: mostLiked,
      },
      {
        id: "shelf_most_shared",
        title: "Most Shared Across Circles",
        subtitle: "The most sent outfit cards across group chats and twin circles.",
        badge: "Viral Loop",
        category: "shared",
        items: mostShared,
      },
    ];

    // A shelf with nothing in it is hidden rather than padded with demo outfits.
    const dynamicShelves = baseShelves.filter((shelf) => shelf.items.length > 0);

    // One shelf per category the admin set up, in the admin's order. A category with nothing in it is skipped.
    if (adminCategories.length > 0) {
      for (const cat of adminCategories) {
        const items = dynamicOutfits.filter((o) => slugOf(o.category) === cat.slug);
        if (items.length === 0) continue;
        dynamicShelves.push({
          id: `shelf_cat_${cat.slug}`,
          title: cat.name,
          subtitle: `${items.length} ${items.length === 1 ? "piece" : "pieces"} in ${cat.name}`,
          badge: "Category",
          category: cat.slug,
          items,
        });
      }
    } else {
      // No categories set up yet: group by what the pieces themselves say.
      categoryMap.forEach((items, catName) => {
        if (items.length >= 2) {
          dynamicShelves.push({
            id: `shelf_cat_${slugOf(catName)}`,
            title: catName,
            subtitle: `${items.length} pieces in ${catName}`,
            badge: "Category",
            category: slugOf(catName),
            items,
          });
        }
      });
    }

    return dynamicShelves;
  }, [loading, apiPosts, adminCategories]);

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

    const nameBySlug = new Map(adminCategories.map((c) => [c.slug, c.name]));
    const orderOf = (slug: string) => {
      const i = adminCategories.findIndex((c) => c.slug === slug);
      return i === -1 ? Number.MAX_SAFE_INTEGER : i;
    };
    const dynamic = Array.from(set)
      .sort((a, b) => orderOf(a) - orderOf(b))
      .map((cat) => ({ id: cat, label: nameBySlug.get(cat) ?? cat.charAt(0).toUpperCase() + cat.slice(1) }));

    // Merge without duplicates
    const seen = new Set(standard.map((s) => s.id));
    for (const d of dynamic) {
      if (!seen.has(d.id)) {
        seen.add(d.id);
        standard.push(d);
      }
    }

    return standard;
  }, [shelves, adminCategories]);

  return {
    loading,
    biddingWinners,
    promotedIsAuction: promoted.isAuction,
    brandsDirectory,
    shelves,
    categories,
    apiPostsCount: apiPosts.length,
    apiBrandsCount: showcase.length,
    refetch,
  };
}
