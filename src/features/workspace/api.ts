import { apiRequest } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { AuthUser } from "@/features/auth/types";

export type TwinProfile = {
  gender: string | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  skinTone: string | null;
  hairColor: string | null;
  selfieUrl: string | null;
  baseAvatarUrl: string | null;
  backgroundId: string | null;
};

export type TwinInput = Partial<{ [K in keyof TwinProfile]: NonNullable<TwinProfile[K]> }>;

export type WardrobeItem = {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  image: string;
  color: string | null;
  tags: string[];
  createdAt: string;
  costPaid: number | null;
  wornCount: number;
  lastWornAt: string | null;
  costPerWear: number | null;
};

export type WardrobeInput = { name: string; brand?: string; category: string; image: string; color?: string; tags?: string[]; costPaid?: number };

export type PoseVariant = { pose: string; imageUrl: string };

export type Look = {
  id: string;
  name: string;
  occasion: string;
  image: string;
  pieces: string[];
  liked: boolean;
  createdAt: string;
  poseVariants: PoseVariant[];
  videoUrl: string | null;
  stylistReviewRequested: boolean;
  stylistCommentCount?: number;
};

export type LookInput = { name: string; occasion: string; image: string; pieces: string[]; poseVariants?: PoseVariant[]; videoUrl?: string };

export type ProfileInput = { username?: string; bio?: string; location?: string; avatar?: string; phone?: string };

export type AnalyticsRow = {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  image: string;
  color: string | null;
  costPaid: number | null;
  wornCount: number;
  lastWornAt: string | null;
  createdAt: string;
  costPerWear: number | null;
  daysSinceWorn: number | null;
};

export type WardrobeAnalytics = {
  totals: {
    items: number;
    pricedItems: number;
    totalValue: number;
    totalWears: number;
    averageCostPerWear: number | null;
    unwornCount: number;
    neverWornCount: number;
    unwornDays: number;
  };
  bestValue: AnalyticsRow[];
  worstValue: AnalyticsRow[];
  mostWorn: AnalyticsRow[];
  unworn: AnalyticsRow[];
  byCategory: { category: string; items: number; wears: number; value: number }[];
  wearsByMonth: { month: string; wears: number }[];
  items: AnalyticsRow[];
};

export type AiCombo = { name: string; occasion: string; itemIds: string[]; reason: string };

export type PlannedOutfit = {
  name?: string;
  itemIds: string[];
  confidence?: number;
  why?: string;
  missing?: { item: string; searchQuery?: string; estimatedPrice?: number }[] | string;
};

/** `styleGuide` lists the titles of the style-guide rules (RAG) the planner followed. */
export type OccasionPlan = { raw: string; outfits: { outfits?: PlannedOutfit[]; reasoning?: string } | null; styleGuide?: string[] };

export type StudioScene = {
  id: string;
  name: string;
  category: string;
  imageUrl?: string | null;
  cssGradient?: string | null;
  isDefault?: boolean;
};

/** The backend stores some lists as JSON columns that can come back as strings. */
export function parseList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return value ? [value] : [];
    }
  }
  return [];
}

const toItem = (raw: WardrobeItem): WardrobeItem => ({
  ...raw,
  tags: parseList(raw.tags),
  wornCount: raw.wornCount ?? 0,
  costPaid: raw.costPaid ?? null,
  lastWornAt: raw.lastWornAt ?? null,
  costPerWear: raw.costPerWear ?? null,
});

const toLook = (raw: Look): Look => ({
  ...raw,
  pieces: parseList(raw.pieces),
  poseVariants: Array.isArray(raw.poseVariants) ? raw.poseVariants : [],
  videoUrl: raw.videoUrl ?? null,
  stylistReviewRequested: Boolean(raw.stylistReviewRequested),
});

export const workspaceApi = {
  async getTwin(token: string) {
    return (await apiRequest<TwinProfile | null>(ENDPOINTS.twin, { token })).data;
  },
  async saveTwin(token: string, body: TwinInput) {
    return (await apiRequest<TwinProfile>(ENDPOINTS.twin, { method: "PUT", token, body })).data;
  },

  async listWardrobe(token: string) {
    return (await apiRequest<WardrobeItem[]>(ENDPOINTS.wardrobe, { token })).data.map(toItem);
  },
  async addWardrobeItem(token: string, body: WardrobeInput) {
    return toItem((await apiRequest<WardrobeItem>(ENDPOINTS.wardrobe, { method: "POST", token, body })).data);
  },
  async updateWardrobeItem(token: string, id: string, body: Partial<Omit<WardrobeInput, "costPaid">> & { costPaid?: number | null }) {
    return toItem((await apiRequest<WardrobeItem>(ENDPOINTS.wardrobeItem(id), { method: "PUT", token, body })).data);
  },
  async removeWardrobeItem(token: string, id: string) {
    await apiRequest<unknown>(ENDPOINTS.wardrobeItem(id), { method: "DELETE", token });
  },
  async markWorn(token: string, id: string, wornAt?: string) {
    return toItem((await apiRequest<WardrobeItem>(ENDPOINTS.wardrobeWorn(id), { method: "POST", token, body: wornAt ? { wornAt } : {} })).data);
  },
  async undoWorn(token: string, id: string) {
    return toItem((await apiRequest<WardrobeItem>(ENDPOINTS.wardrobeWorn(id), { method: "DELETE", token })).data);
  },
  async wardrobeAnalytics(token: string) {
    return (await apiRequest<WardrobeAnalytics>(ENDPOINTS.wardrobeAnalytics, { token })).data;
  },
  async similarItems(token: string, query: { category?: string; color?: string; name?: string }) {
    const qs = Object.entries(query)
      .filter(([, v]) => v)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`)
      .join("&");
    return (await apiRequest<WardrobeItem[]>(`${ENDPOINTS.wardrobeSimilar}?${qs}`, { token })).data.map(toItem);
  },

  async listLooks(token: string) {
    return (await apiRequest<Look[]>(ENDPOINTS.looks, { token })).data.map(toLook);
  },
  async saveLook(token: string, body: LookInput) {
    return toLook((await apiRequest<Look>(ENDPOINTS.looks, { method: "POST", token, body })).data);
  },
  async updateLook(token: string, id: string, body: Partial<LookInput> & { videoUrl?: string | null }) {
    return toLook((await apiRequest<Look>(ENDPOINTS.look(id), { method: "PUT", token, body })).data);
  },
  async requestStylistReview(token: string, id: string, requested: boolean) {
    return toLook((await apiRequest<Look>(ENDPOINTS.lookReview(id), { method: "POST", token, body: { requested } })).data);
  },
  async toggleLookLike(token: string, id: string) {
    return toLook((await apiRequest<Look>(ENDPOINTS.lookLike(id), { method: "POST", token })).data);
  },
  async removeLook(token: string, id: string) {
    await apiRequest<unknown>(ENDPOINTS.look(id), { method: "DELETE", token });
  },

  async getProfile(token: string) {
    return (await apiRequest<AuthUser>(ENDPOINTS.users.profile, { token })).data;
  },
  async updateProfile(token: string, body: ProfileInput) {
    return (await apiRequest<AuthUser>(ENDPOINTS.users.profile, { method: "PUT", token, body })).data;
  },

  /** Occasion Planner agent: structured outfits from the user's wardrobe + shoppable gaps. */
  async planOccasion(token: string, body: { eventType: string; dressCode?: string; location?: string; budget?: number; notes?: string }) {
    return (await apiRequest<OccasionPlan>(ENDPOINTS.occasionPlanner, { method: "POST", token, body, timeoutMs: 120_000 })).data;
  },
  async aiCombos(token: string, body: { occasion?: string; count?: number; focusUnderused?: boolean; notes?: string }) {
    return (await apiRequest<{ combos: AiCombo[] }>(ENDPOINTS.wardrobeCombos, { method: "POST", token, body, timeoutMs: 90_000 })).data.combos;
  },

  async scenes() {
    return (await apiRequest<StudioScene[]>(ENDPOINTS.studio.backgrounds)).data ?? [];
  },
};
