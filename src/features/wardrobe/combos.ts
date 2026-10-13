import { OCCASIONS } from "@/data/studio-content";
import type { WardrobeItem } from "@/features/workspace/api";

export type Combo = { id: string; pieces: WardrobeItem[]; occasion: string };

const UNWORN_DAYS = 90;
const DAY_MS = 86_400_000;
export { UNWORN_DAYS };

/** Owned for 90+ days and never worn, or last worn 90+ days ago. */
export function isUnworn(item: WardrobeItem) {
  const ref = item.lastWornAt ?? item.createdAt;
  return Date.now() - new Date(ref).getTime() > UNWORN_DAYS * DAY_MS;
}

/** Small deterministic PRNG so a given "shuffle" seed always yields the same set. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(list: T[], r: () => number) => list[Math.floor(r() * list.length)];

function shuffle<T>(list: T[], r: () => number) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Most common occasion tag across the pieces, else casual. */
function occasionFor(pieces: WardrobeItem[]) {
  const counts = new Map<string, number>();
  for (const tag of pieces.flatMap((p) => p.tags.map((t) => t.toLowerCase()))) {
    const match = OCCASIONS.find((o) => o.id === tag || o.label.toLowerCase() === tag);
    if (match) counts.set(match.id, (counts.get(match.id) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "casual";
}

/**
 * Builds outfit combinations only from owned items: a top + bottom pair or a one-piece
 * (dress / ethnic set), finished with shoes, an optional layer and an optional accessory.
 * Shown instantly while the AI stylist works, and as its fallback.
 */
export function buildCombos(items: WardrobeItem[], seed: number, count = 3): Combo[] {
  const r = rng(seed);
  const by = (...cats: string[]) => items.filter((i) => cats.includes(i.category));
  const tops = by("Tops");
  const bottoms = by("Bottoms");
  const onePieces = by("Dresses", "Ethnic");
  const layers = by("Outerwear");
  const shoes = by("Footwear");
  const extras = by("Bags", "Jewellery", "Eyewear");

  const bases: WardrobeItem[][] = [...onePieces.map((d) => [d]), ...tops.flatMap((t) => bottoms.map((b) => [t, b]))];

  return shuffle(bases, r)
    .slice(0, count)
    .map((base) => {
      const pieces = [...base];
      if (layers.length && base.length === 2 && r() < 0.4) pieces.push(pick(layers, r));
      if (shoes.length) pieces.push(pick(shoes, r));
      if (extras.length && r() < 0.6) pieces.push(pick(extras, r));
      return { id: pieces.map((p) => p.id).join("+"), pieces, occasion: occasionFor(pieces) };
    });
}
