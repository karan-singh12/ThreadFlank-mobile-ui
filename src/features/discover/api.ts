import { apiRequest, type ApiResponse } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

export interface ApiBrand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  category: string | null;
  isVerified: boolean;
  socialLinks?: Record<string, string> | null;
}

// ─── Brand directory and store (same shapes as the web app's discover/api.ts) ───

/** A garment from a brand's own catalog, as shoppers see it (no SKU, no internal counters). */
export interface ApiShowcaseProduct {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  occasions: string[];
  colors: string[];
  sizes: string[];
  inStock: boolean;
  isDrapeReady: boolean;
  hasBuyLink: boolean;
  featured: boolean;
  newDrop: boolean;
}

export interface ApiShowcaseDrop {
  id: string;
  title: string;
  collectionName: string;
  description?: string;
  launchDate: string;
  waitlistCount: number;
  status: "scheduled" | "live" | "completed";
  bannerUrl: string;
  productsCount: number;
  joined: boolean;
}

/** One card on the Brands page (brands are paged in 24 at a time). */
export interface ApiBrandCard {
  id: string;
  name: string;
  slug: string;
  logo: string;
  banner: string;
  category: string;
  isVerified: boolean;
  tagline: string;
  themeAccent: string;
  announcementText: string;
  piecesCount: number;
  previews: { id: string; image: string; title: string }[];
  nextDrop: string | null;
}

export interface ApiDirectoryPage {
  items: ApiBrandCard[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface ApiStorePiece extends ApiShowcaseProduct {
  description?: string;
  likesCount: number;
  sharesCount: number;
  likedByMe?: boolean;
}

export interface ApiStoreFacets {
  categories: { name: string; count: number; cover: string }[];
  occasions: { name: string; count: number }[];
  /** The brand's own groupings (e.g. "Wedding Edit 2026"), biggest first. */
  collections: { name: string; count: number; cover: string }[];
  pieces: number;
  minPrice: number | null;
  maxPrice: number | null;
}

/** A brand's virtual store: everything the top of its page needs in one call. */
export interface ApiStore {
  brand: {
    id: string;
    name: string;
    slug: string;
    logo: string;
    banner: string;
    tagline: string;
    story: string;
    category: string;
    isVerified: boolean;
    websiteUrl: string;
    themeAccent: string;
    followers: number;
    following: boolean;
    gstRegistered?: boolean;
    announcementText: string;
    flagshipAddress: string;
    isOnlineOnly: boolean;
    links: Record<string, string>;
    memberSince: string;
  };
  stats: { pieces: number; categories: number; occasions: number; minPrice: number | null; maxPrice: number | null; upcomingDrops: number };
  facets: ApiStoreFacets;
  showcase: { pieces: ApiStorePiece[]; isFallback: boolean };
  newIn: ApiStorePiece[];
  drops: ApiShowcaseDrop[];
}

export type StoreSort = "new" | "price_asc" | "price_desc" | "featured";
export type DirectorySort = "featured" | "new" | "az";

export interface StorePiecesQuery {
  q?: string;
  category?: string;
  occasion?: string;
  collection?: string;
  sort?: StoreSort;
  inStock?: boolean;
  cursor?: string | null;
  limit?: number;
}

export interface ApiPiecesPage {
  products: ApiStorePiece[];
  nextCursor: string | null;
  total: number | null;
}

export interface ApiShowcaseBrand {
  brand: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    description: string | null;
    category: string | null;
    websiteUrl: string | null;
    isVerified: boolean;
    socialLinks: Record<string, unknown>;
  };
  products: ApiShowcaseProduct[];
  drops: ApiShowcaseDrop[];
}

/** A Discover category the admin set up, in the admin's order. */
export interface ApiDiscoverCategory {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface ApiSpotlight {
  period: string | null;
  brands: { rank: number; slot: string; category: string; brand: { id: string; name: string; slug: string; logoUrl: string | null; category: string | null; isVerified: boolean } }[];
}

export interface ApiTaggedProduct {
  name: string;
  brand?: string;
  price: string;
  thumbnail?: string;
}

export interface ApiVariant {
  id: string;
  productName: string;
  size: string;
  color: string;
  colorHex: string | null;
  price: number | null;
  inStock: boolean;
  stockCount: number | null;
  productUrl: string | null;
  imageUrl: string | null;
}

export interface ApiBrandPost {
  variants?: ApiVariant[];
  id: string;
  brandId: string;
  title: string | null;
  caption: string;
  images: string[];
  category: string | null;
  taggedProducts: ApiTaggedProduct[] | null;
  likesCount: number;
  commentsCount: number;
  sharesCount?: number;
  /** The brand has set a store link, so Buy can go through the tracked redirect. */
  hasBuyLink?: boolean;
  likedByMe: boolean;
  /** Saved to the viewer's Saved looks. */
  savedByMe?: boolean;
  /** The two newest comments, oldest first, for the preview under the post. */
  latestComments?: ApiPostComment[];
  publishedAt: string;
  brand: { id: string; name: string; slug: string; logoUrl: string | null; isVerified: boolean };
}

export interface ApiBrandStory {
  id: string;
  brandId: string;
  mediaUrl: string;
  mediaType: string;
  caption: string | null;
  expiresAt: string;
  createdAt: string;
  viewsCount?: number;
  /** Whether the signed-in viewer has seen it. */
  viewed?: boolean;
  brand: { id: string; name: string; slug: string; logoUrl: string | null; isVerified: boolean };
}

export interface ApiPostComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  /** Public author fields; the API never sends emails with comments. */
  user?: { id: string; username: string; avatar: string | null };
}

export type PostComment = { id: string; author: string; text: string; userId?: string; avatar?: string | null; createdAt?: string; pending?: boolean };

export const toPostComment = (c: ApiPostComment): PostComment => ({
  id: c.id,
  userId: c.userId,
  author: c.user?.username || "member",
  avatar: c.user?.avatar ?? null,
  text: c.content,
  createdAt: c.createdAt,
});

function query(params: Record<string, string | number | boolean | null | undefined>) {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "" && v !== false)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return qs ? `?${qs}` : "";
}

export const discoverApi = {
  /** One page of brand cards: search, category and sort are done by the server. */
  async directory(params: { page?: number; limit?: number; q?: string; category?: string; sort?: DirectorySort }, signal?: AbortSignal): Promise<ApiDirectoryPage> {
    return (await apiRequest<ApiDirectoryPage>(ENDPOINTS.discover.directory + query(params), { signal })).data;
  },

  async directoryCategories(): Promise<{ name: string; count: number }[]> {
    try {
      return (await apiRequest<{ name: string; count: number }[]>(ENDPOINTS.discover.directoryCategories)).data ?? [];
    } catch {
      return [];
    }
  },

  async store(slug: string, token?: string | null): Promise<ApiStore> {
    const store = (await apiRequest<ApiStore>(ENDPOINTS.discover.store(slug), { token })).data;
    // A backend that predates collections does not send them; show the store without that section.
    store.facets.collections ??= [];
    return store;
  },

  async pieces(slug: string, q: StorePiecesQuery, token?: string | null, signal?: AbortSignal): Promise<ApiPiecesPage> {
    return (await apiRequest<ApiPiecesPage>(ENDPOINTS.discover.pieces(slug) + query({ ...q }), { token, signal })).data;
  },

  /** Approved brands with their real catalog preview and upcoming drops. */
  async showcase(token?: string | null): Promise<ApiShowcaseBrand[]> {
    try {
      return (await apiRequest<ApiShowcaseBrand[]>(ENDPOINTS.discover.showcase, { token })).data ?? [];
    } catch {
      return [];
    }
  },

  /** The categories admins manage for Discover, in order. Empty if none are set up. */
  async categories(): Promise<ApiDiscoverCategory[]> {
    try {
      return (await apiRequest<ApiDiscoverCategory[]>(ENDPOINTS.discover.categories)).data ?? [];
    } catch {
      return [];
    }
  },

  /** Brands that won the latest runway auction. */
  async spotlight(): Promise<ApiSpotlight> {
    try {
      return (await apiRequest<ApiSpotlight>(ENDPOINTS.discover.spotlight)).data ?? { period: null, brands: [] };
    } catch {
      return { period: null, brands: [] };
    }
  },

  async follow(token: string, slug: string) {
    return (await apiRequest<{ following: boolean; followers: number }>(ENDPOINTS.discover.follow(slug), { method: "POST", token })).data;
  },

  async unfollow(token: string, slug: string) {
    return (await apiRequest<{ following: boolean; followers: number }>(ENDPOINTS.discover.follow(slug), { method: "DELETE", token })).data;
  },

  async joinWaitlist(token: string, dropId: string) {
    return (await apiRequest<{ joined: boolean; waitlistCount: number }>(ENDPOINTS.discover.waitlist(dropId), { method: "POST", token })).data;
  },

  async leaveWaitlist(token: string, dropId: string) {
    return (await apiRequest<{ joined: boolean; waitlistCount: number }>(ENDPOINTS.discover.waitlist(dropId), { method: "DELETE", token })).data;
  },

  async listBrands(token?: string | null): Promise<ApiBrand[]> {
    return (await apiRequest<ApiBrand[]>(ENDPOINTS.discover.brands, { token })).data ?? [];
  },

  async listBrandPosts(
    token?: string | null,
    params: { brandId?: string; category?: string; page?: number; limit?: number } = {}
  ): Promise<{ posts: ApiBrandPost[]; meta?: ApiResponse<ApiBrandPost[]>["meta"] }> {
    const res = await apiRequest<ApiBrandPost[]>(
      `${ENDPOINTS.discover.posts}${query({
        brandId: params.brandId,
        category: params.category && params.category !== "All" ? params.category : undefined,
        page: params.page,
        limit: params.limit,
      })}`,
      { token }
    );
    return { posts: res.data ?? [], meta: res.meta };
  },

  async toggleLike(token: string, postId: string) {
    return (await apiRequest<{ liked: boolean; likesCount: number }>(ENDPOINTS.discover.like(postId), { method: "POST", token })).data;
  },

  /** Counts a share of a post (fire and forget). */
  async recordShare(token: string | null | undefined, postId: string) {
    await apiRequest<unknown>(ENDPOINTS.discover.share(postId), { method: "POST", token }).catch(() => undefined);
  },

  /** Save a brand post to the user's Saved looks, or remove it. */
  async toggleSave(token: string, postId: string) {
    return (await apiRequest<{ saved: boolean; lookId?: string }>(ENDPOINTS.discover.save(postId), { method: "POST", token })).data;
  },

  async getPost(token: string | null | undefined, postId: string) {
    return (await apiRequest<ApiBrandPost>(ENDPOINTS.discover.post(postId), { token })).data;
  },

  /** Comments on a brand post, oldest first. */
  async listComments(token: string | null | undefined, postId: string) {
    return (await apiRequest<ApiPostComment[]>(ENDPOINTS.discover.comments(postId), { token })).data ?? [];
  },

  /** Delete one of your own comments; returns the post's new comment count. */
  async deleteComment(token: string, postId: string, commentId: string) {
    return (await apiRequest<{ commentsCount: number }>(ENDPOINTS.discover.comment(postId, commentId), { method: "DELETE", token })).data;
  },

  async addComment(token: string, postId: string, content: string) {
    return (await apiRequest<ApiPostComment>(ENDPOINTS.discover.comments(postId), { method: "POST", token, body: { content } })).data;
  },

  async listBrandStories(token?: string | null, brandId?: string) {
    try {
      return (await apiRequest<ApiBrandStory[]>(`${ENDPOINTS.discover.stories}${query({ brandId })}`, { token })).data ?? [];
    } catch {
      return [];
    }
  },

  async recordStoryView(token: string, storyId: string) {
    await apiRequest<unknown>(ENDPOINTS.discover.storyView(storyId), { method: "POST", token }).catch(() => undefined);
  },
};
