import { ETHNIC_GARMENTS } from "@/data/garment-kinds";
import { DRAPE_SLOTS, GROUP_POSTURES, SKIN_TONES, type DrapeSlot, type GroupPosture } from "@/data/studio-content";
import type { PoseId } from "@/data/look-edits";
import { baseImage, type Person } from "@/features/workspace/hooks";
import type { StudioScene, WardrobeItem } from "@/features/workspace/api";
import { apiRequest, ApiError } from "@/lib/api/client";
import { assetUrl, WEB_ORIGIN } from "@/lib/api/config";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { editableImage, isOwnAsset, toDataUrl } from "@/lib/media";
import type { GarmentType } from "@/data/studio-content";
import type { MemberSpec, Outfit } from "./types";

type WithCredits<T> = T & { creditsLeft?: number };

/** Drape responses are wrapped by the API ({ data: { …, creditsLeft } }); returns the inner result. */
async function drapeRequest<T>(path: string, body: unknown, opts: { signal?: AbortSignal; timeoutMs?: number; token: string; onCredits?: (n?: number) => void }) {
  const res = await apiRequest<WithCredits<T>>(path, { method: "POST", token: opts.token, body, signal: opts.signal, timeoutMs: opts.timeoutMs ?? 240_000 });
  const result = (res.data ?? (res as unknown as WithCredits<T>)) as WithCredits<T>;
  opts.onCredits?.(result.creditsLeft);
  return result;
}

// ─── Outfit helpers ─────────────────────────────────────────────────────────

export const emptyMember = (): MemberSpec => ({ pieces: {}, notes: "" });

export const filledPieces = (m: MemberSpec | undefined) => DRAPE_SLOTS.flatMap((s) => (m?.pieces[s.id] ? [{ slot: s.id, outfit: m.pieces[s.id]! }] : []));

/** Sets one slot. A full outfit and a top/bottom can't both be worn, so picking one clears the other. */
export function withPiece(m: MemberSpec, slot: DrapeSlot, outfit: Outfit | null): MemberSpec {
  const pieces = { ...m.pieces };
  if (outfit) {
    pieces[slot] = outfit;
    if (slot === "dress") {
      delete pieces.top;
      delete pieces.bottom;
    } else if (slot === "top" || slot === "bottom") {
      delete pieces.dress;
    }
  } else {
    delete pieces[slot];
  }
  return { ...m, pieces };
}

export function typeForCategory(category?: string): GarmentType {
  if (category === "Bottoms") return "lower_body";
  if (category === "Dresses" || category === "Ethnic") return "dresses";
  return "upper_body";
}

export function outfitFromItem(item: WardrobeItem): Outfit {
  return { source: "wardrobe", preview: item.image, label: item.name, type: typeForCategory(item.category), itemId: item.id };
}

/** Which slot a wardrobe item or a garment type belongs in. */
export function slotForOutfit(outfit: Outfit, category?: string): DrapeSlot {
  const byCategory = DRAPE_SLOTS.find((s) => s.wardrobe && s.wardrobe === category);
  if (byCategory) return byCategory.id;
  if (outfit.type === "lower_body") return "bottom";
  if (outfit.type === "dresses") return "dress";
  return "top";
}

export function hostOf(url: string) {
  const match = /^https?:\/\/([^/?#]+)/i.exec(url.trim());
  return match ? match[1].replace(/^www\./, "") : url;
}

const PARTNER = ["partner", "spouse", "wife", "husband", "girlfriend", "boyfriend", "fiance", "fiancé", "fiancée"];
const FAMILY = ["parent", "child", "family", "mother", "father", "son", "daughter"];

/** Mirrors the backend: Partner → couple, Parent/Child/Family → family, all siblings → siblings, else friends. */
export function resolvePosture(people: Person[], posture: GroupPosture): Exclude<GroupPosture, "auto"> | null {
  if (people.length < 2) return null;
  if (posture !== "auto") return posture;
  const relations = people.filter((p) => !p.isSelf).map((p) => (p.relation ?? "").toLowerCase());
  if (people.length === 2 && relations.some((r) => PARTNER.includes(r))) return "couple";
  if (relations.some((r) => FAMILY.includes(r))) return "family";
  if (relations.length > 0 && relations.every((r) => r === "sibling")) return "siblings";
  return "friends";
}

export const postureLabel = (id: GroupPosture | null) => GROUP_POSTURES.find((p) => p.id === id)?.label ?? "";

export const skinLabel = (hex?: string | null) => SKIN_TONES.find((t) => t.hex === hex)?.label;

// ─── Render requests ────────────────────────────────────────────────────────

/** Own uploads and local photos are inlined as data URIs; public product URLs pass through for the server to fetch. */
async function sendable(path: string, max: number) {
  return isOwnAsset(path) ? toDataUrl(path, max) : path;
}

async function pieceFor(slot: DrapeSlot, outfit: Outfit) {
  const kind = outfit.kind ? ETHNIC_GARMENTS.find((k) => k.id === outfit.kind) : undefined;
  const isDescribed = outfit.source === "describe";
  return {
    slot,
    label: isDescribed ? undefined : outfit.label.slice(0, 60),
    image: isDescribed || !outfit.preview ? undefined : await sendable(outfit.preview, 1024),
    description: isDescribed ? outfit.prompt : undefined,
    kind: kind?.id,
    drape: kind?.drape,
  };
}

export type GroupDrapeInput = {
  people: Person[];
  members: Record<string, MemberSpec>;
  posture: GroupPosture;
  scene: StudioScene;
  styling: string;
};

/** The request body for POST /drape/group: one entry per person with their twin, body and every piece. */
async function buildGroupPayload({ people, members, posture, scene, styling }: GroupDrapeInput) {
  const specs = await Promise.all(
    people.map(async (p) => {
      const member = members[p.id];
      return {
        ref: p.id,
        name: (p.isSelf ? p.name || "You" : p.name).slice(0, 60),
        relation: p.isSelf ? "You" : p.relation || undefined,
        twinImage: await sendable(baseImage(p)!, 1280),
        body: {
          gender: p.gender || undefined,
          age: p.age || undefined,
          heightCm: p.heightCm || undefined,
          weightKg: p.weightKg || undefined,
          skinTone: p.skinTone ? `${skinLabel(p.skinTone) ?? ""} (${p.skinTone})`.trim() : undefined,
        },
        outfit: await Promise.all(filledPieces(member).map((x) => pieceFor(x.slot, x.outfit))),
        notes: member?.notes.trim() || undefined,
      };
    })
  );
  return {
    people: specs,
    posture: people.length > 1 ? posture : undefined,
    scene: {
      name: scene.name,
      category: scene.category || undefined,
      imageUrl: scene.imageUrl ? await sendable(assetUrl(scene.imageUrl), 1280) : undefined,
    },
    styling: styling.trim() || undefined,
  };
}

export type GroupDrapeResult = {
  imageUrl: string | null;
  composed: boolean;
  posture: string | null;
  people: { ref: string; name: string; imageUrl: string; dressed: boolean; error?: string }[];
  composeError?: string;
};

/** Renders everyone in one request: each twin is dressed, then the group is composed into one photo. */
export async function runGroupDrape(input: GroupDrapeInput, opts: { token: string; signal?: AbortSignal; onCredits?: (n?: number) => void }) {
  return drapeRequest<GroupDrapeResult>(ENDPOINTS.drape.group, await buildGroupPayload(input), { ...opts, timeoutMs: 300_000 });
}

export type LookEdit =
  | { mode: "pose"; pose: PoseId }
  | { mode: "makeup"; makeup: { lipstick?: string; eyeshadow?: string; blush?: number; finish?: string } }
  | { mode: "describe"; prompt: string };

/** Re-poses a look, applies makeup, or dresses a person from a text prompt. */
export async function editLook(image: string, edit: LookEdit, opts: { token: string; signal?: AbortSignal; onCredits?: (n?: number) => void }) {
  return (await drapeRequest<{ imageUrl: string }>(ENDPOINTS.drape.lookEdit, { image: await editableImage(image), ...edit }, opts)).imageUrl;
}

/** "Make it move": turns a look into a short video (1–3 minutes). */
export async function animateLook(image: string, motion: string, opts: { token: string; signal?: AbortSignal; onCredits?: (n?: number) => void }) {
  return (await drapeRequest<{ videoUrl: string }>(ENDPOINTS.drape.animate, { image: await editableImage(image), motion }, { ...opts, timeoutMs: 400_000 })).videoUrl;
}

/** Finds the main product image on a store page (scraped by the web app's server route). */
export async function fetchGarmentImage(url: string) {
  let res: Response;
  try {
    res = await fetch(`${WEB_ORIGIN}/api/fetch-garment`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
  } catch {
    throw new ApiError(0, "Couldn't reach the link reader. Check that the Threadflank web app is running, or upload a photo instead.");
  }
  const body = (await res.json().catch(() => null)) as { garmentImageUrl?: string; error?: string; message?: string } | null;
  if (!res.ok || !body?.garmentImageUrl) throw new ApiError(res.status, body?.message || body?.error || "Couldn't read that product link.");
  return body.garmentImageUrl;
}
