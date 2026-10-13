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

function query(params: Record<string, string | number | undefined>) {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return qs ? `?${qs}` : "";
}

export const discoverApi = {
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
