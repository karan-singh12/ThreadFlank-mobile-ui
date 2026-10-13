// Options for the post-render edits in Drape: poses, makeup and motion.

export const POSES = [
  { id: "front", label: "Front" },
  { id: "three-quarter", label: "¾ turn" },
  { id: "side", label: "Side" },
  { id: "back", label: "Back" },
  { id: "walk", label: "Walking" },
  { id: "seated", label: "Seated" },
] as const;

export type PoseId = (typeof POSES)[number]["id"];

/** Prompt fragment per pose, used server-side by /api/look-edit. */
export const POSE_PROMPTS: Record<string, string> = {
  front: "standing straight and facing the camera, arms relaxed",
  "three-quarter": "standing turned about 45 degrees to their left in a three-quarter view, looking at the camera",
  side: "standing in full side profile facing left",
  back: "standing with their back to the camera so the back of the outfit is visible, head turned slightly over the shoulder",
  walk: "mid-stride walking towards the camera like on a runway",
  seated: "sitting elegantly on a simple stool, full outfit visible",
};

export const MOTIONS = [
  { id: "turn", label: "Turn" },
  { id: "walk", label: "Runway walk" },
  { id: "twirl", label: "Twirl" },
  { id: "pose", label: "Pose" },
] as const;

export const LIPSTICKS = [
  { name: "Nude Pink", hex: "#c98b8b" },
  { name: "Rosewood", hex: "#9e4f5a" },
  { name: "Classic Red", hex: "#b3122e" },
  { name: "Crimson", hex: "#8b0f1f" },
  { name: "Coral", hex: "#e8665a" },
  { name: "Peach", hex: "#e89a7b" },
  { name: "Berry", hex: "#7a1f45" },
  { name: "Plum", hex: "#5b1f3e" },
  { name: "Mauve", hex: "#a4677a" },
  { name: "Brick", hex: "#9c3d2e" },
  { name: "Terracotta", hex: "#b5543c" },
  { name: "Fuchsia", hex: "#c2185b" },
  { name: "Wine", hex: "#5a0f24" },
  { name: "Caramel", hex: "#a8674a" },
  { name: "Chocolate", hex: "#5d3325" },
] as const;

export const EYESHADOWS = [
  { name: "Champagne", hex: "#e8cfa6" },
  { name: "Gold", hex: "#c9a14a" },
  { name: "Bronze", hex: "#a0662f" },
  { name: "Copper", hex: "#b56a3c" },
  { name: "Taupe", hex: "#8a7667" },
  { name: "Smoky Grey", hex: "#55555c" },
  { name: "Charcoal", hex: "#2e2e33" },
  { name: "Plum", hex: "#6a3a5c" },
  { name: "Mauve", hex: "#9b7189" },
  { name: "Rose", hex: "#c98b98" },
  { name: "Emerald", hex: "#2f7a55" },
  { name: "Teal", hex: "#2a7480" },
  { name: "Navy", hex: "#27325e" },
  { name: "Violet", hex: "#6645eb" },
  { name: "Burgundy", hex: "#6e1f2e" },
] as const;

export const FINISHES = [
  { id: "satin", label: "Satin" },
  { id: "matte", label: "Matte" },
  { id: "gloss", label: "Gloss" },
] as const;
