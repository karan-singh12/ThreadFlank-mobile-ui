import type { DrapeSlot, GarmentType } from "@/data/studio-content";
import type { PoseVariant } from "@/features/workspace/api";

export type OutfitSource = "link" | "upload" | "wardrobe" | "describe";

/** One garment chosen for one person. */
export type Outfit = {
  source: OutfitSource;
  /** Image shown in the UI and sent to the try-on (URL, upload path or local file:// URI). */
  preview: string;
  label: string;
  type: GarmentType;
  itemId?: string;
  /** Ethnic garment kind (saree, lehenga…) for drape-aware rendering. */
  kind?: string;
  /** For "describe": the outfit as text, rendered straight onto the twin. */
  prompt?: string;
};

/** Everything one person wears in a Drape render. */
export type MemberSpec = { pieces: Partial<Record<DrapeSlot, Outfit>>; notes: string };

export type Result = {
  /** The main image (updated by makeup edits). */
  image: string;
  /** When the group couldn't be composed into one photo: each person's render, shown side by side. */
  collage?: string[];
  note?: string;
  poses: PoseVariant[];
  video?: string;
  /** Previous main images, for undoing a makeup edit. */
  history: string[];
};

export type RunState =
  | { status: "idle" }
  | { status: "running"; label: string }
  | { status: "done"; result: Result }
  /** `outOfCredits`: the server refused for lack of credits, so the error offers a pack. */
  | { status: "error"; message: string; outOfCredits?: boolean };

/** What the stage shows once a render exists. */
export type StageView = { kind: "main" } | { kind: "pose"; pose: string } | { kind: "video" };

/** One person's chosen pieces, for the look board. */
export type BoardEntry = { id: string; name: string; pieces: Outfit[] };
