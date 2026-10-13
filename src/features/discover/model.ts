import { timeAgo } from "@/lib/format";
import { toPostComment, type ApiBrand, type ApiBrandPost, type ApiVariant, type PostComment } from "./api";

/** A brand as the feed shows it. `hasStory`: active stories; `hasNewStory`: some unseen. */
export type Brand = { id: string; name: string; handle: string; tone: string; image?: string; verified: boolean; hasNewStory: boolean; hasStory?: boolean };

export type TaggedProduct = { name: string; price: string };

export type BrandPost = {
  id: string;
  brandId: string;
  category: string;
  image: string;
  tone: string;
  caption: string;
  postedAgo: string;
  likes: number;
  liked: boolean;
  saved: boolean;
  tags: TaggedProduct[];
  /** The newest comments shown under the post; `commentsCount` is the full total. */
  comments: PostComment[];
  commentsCount: number;
  variants: ApiVariant[];
  publishedAt?: string;
};

export function mapApiBrand(apiBrand: ApiBrand): Brand {
  return {
    id: apiBrand.id,
    name: apiBrand.name,
    handle: `@${apiBrand.slug}`,
    image: apiBrand.logoUrl || undefined,
    tone: "violet",
    verified: apiBrand.isVerified,
    hasNewStory: false,
  };
}

/** Same mapping as the web feed (including its tagged-product price format). */
export function mapApiPost(apiPost: ApiBrandPost): BrandPost {
  const firstImage = Array.isArray(apiPost.images) && apiPost.images.length > 0 ? apiPost.images[0] : "/images/blazer.png";
  return {
    id: apiPost.id,
    brandId: apiPost.brandId,
    category: apiPost.category || "General",
    image: firstImage,
    tone: "violet",
    caption: apiPost.caption || apiPost.title || "",
    postedAgo: timeAgo(apiPost.publishedAt),
    likes: apiPost.likesCount || 0,
    liked: apiPost.likedByMe || false,
    saved: apiPost.savedByMe || false,
    tags: (apiPost.taggedProducts || []).map((t) => ({
      name: t.name,
      price: t.price ? (t.price.startsWith("$") || t.price.startsWith("₹") ? t.price : `$${t.price}`) : "$0",
    })),
    comments: (apiPost.latestComments ?? []).map(toPostComment),
    commentsCount: apiPost.commentsCount || 0,
    variants: apiPost.variants ?? [],
    publishedAt: apiPost.publishedAt,
  };
}

/** Fallback brand when a post's brand isn't in the brand list. */
export function brandFromPost(post: ApiBrandPost | undefined, brandId: string): Brand {
  return post?.brand
    ? { id: post.brand.id, name: post.brand.name, handle: `@${post.brand.slug}`, image: post.brand.logoUrl ?? undefined, tone: "violet", verified: post.brand.isVerified, hasNewStory: false }
    : { id: brandId, name: "Fashion Drop", handle: "@fashion", tone: "violet", verified: true, hasNewStory: false };
}

/** Params for opening Drape with a garment image from a post or product. */
export function drapeParams(image: string, brand: string, title: string) {
  return { pathname: "/drape" as const, params: { image, brand, title: title.slice(0, 50) } };
}
