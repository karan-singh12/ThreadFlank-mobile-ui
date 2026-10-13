// Copy and option lists for Drape, Wardrobe and Profile. Components only read these shapes.

/** Max people in a Twin Circle besides you (feature spec: an intimate circle of 4–5). */
export const MEMBER_LIMIT = 5;

/** People in one Drape look: you plus one circle member (matches the backend limit). */
export const LOOK_MAX_PEOPLE = 2;

export const SKIN_TONES = [
  { id: "porcelain", label: "Porcelain", hex: "#f6dcc8" },
  { id: "ivory", label: "Ivory", hex: "#eac5a4" },
  { id: "sand", label: "Sand", hex: "#d7a67c" },
  { id: "honey", label: "Honey", hex: "#c68642" },
  { id: "wheat", label: "Wheat", hex: "#a8703f" },
  { id: "chestnut", label: "Chestnut", hex: "#8d5524" },
  { id: "cocoa", label: "Cocoa", hex: "#5e3a1c" },
  { id: "ebony", label: "Ebony", hex: "#3b2414" },
] as const;

export const GENDERS = [
  { id: "female", label: "Female" },
  { id: "male", label: "Male" },
  { id: "other", label: "Other" },
] as const;

export const RELATIONS = ["Partner", "Family", "Friend", "Sibling", "Parent", "Child"] as const;

/** Scene backdrops. Admin-curated in the database; empty until created by admin. */
export type BackgroundItem = { id: string; label: string; css: string; stops: string[] };
export const BACKGROUNDS: readonly BackgroundItem[] = [];

export type BackgroundId = string;

export const WARDROBE_CATEGORIES = [
  "Tops",
  "Bottoms",
  "Dresses",
  "Ethnic",
  "Outerwear",
  "Footwear",
  "Bags",
  "Jewellery",
  "Eyewear",
] as const;

export type WardrobeCategory = (typeof WARDROBE_CATEGORIES)[number];

export const OCCASIONS = [
  { id: "casual", label: "Casual" },
  { id: "work", label: "Work" },
  { id: "party", label: "Party" },
  { id: "date", label: "Date night" },
  { id: "festive", label: "Festive" },
  { id: "wedding", label: "Wedding" },
  { id: "formal", label: "Formal" },
  { id: "travel", label: "Travel" },
] as const;

/** Garment slots the try-on model understands. */
export const GARMENT_TYPES = [
  { id: "upper_body", label: "Top", category: "Tops" },
  { id: "lower_body", label: "Bottom", category: "Bottoms" },
  { id: "dresses", label: "Full outfit", category: "Dresses" },
] as const;

export type GarmentType = (typeof GARMENT_TYPES)[number]["id"];

/**
 * Outfit slots per person in Drape. `type` is the garment type the picker's ethnic
 * kinds filter on (null for accessories); `wardrobe` is the wardrobe tab it opens on.
 */
export const DRAPE_SLOTS = [
  { id: "top", label: "Top", type: "upper_body", wardrobe: "Tops" },
  { id: "bottom", label: "Bottom", type: "lower_body", wardrobe: "Bottoms" },
  { id: "dress", label: "Full outfit", type: "dresses", wardrobe: "Dresses" },
  { id: "shoes", label: "Shoes", type: null, wardrobe: "Footwear" },
  { id: "eyewear", label: "Eyewear", type: null, wardrobe: "Eyewear" },
  { id: "headwear", label: "Headwear", type: null, wardrobe: null },
  { id: "bag", label: "Bag", type: null, wardrobe: "Bags" },
  { id: "jewelry", label: "Jewellery", type: null, wardrobe: "Jewellery" },
] as const;

export type DrapeSlot = (typeof DRAPE_SLOTS)[number]["id"];

/** How a group stands together. "auto" follows the relations set in the Twin Circle. */
export const GROUP_POSTURES = [
  { id: "auto", label: "Auto", hint: "Follows how you're related" },
  { id: "couple", label: "Couple", hint: "Close, arm around the waist" },
  { id: "friends", label: "Friends", hint: "Shoulder to shoulder, candid" },
  { id: "family", label: "Family", hint: "Warm family portrait" },
  { id: "siblings", label: "Siblings", hint: "Playful, leaning in" },
  { id: "formal", label: "Formal", hint: "Neat row, facing camera" },
  { id: "walking", label: "Walking", hint: "Mid-stride, in step" },
  { id: "seated", label: "Seated", hint: "On a bench or steps" },
] as const;

export type GroupPosture = (typeof GROUP_POSTURES)[number]["id"];

export const drapeContent = {
  title: "Drape",
  modes: [
    { id: "single", label: "One person" },
    { id: "group", label: "Group look" },
  ] as const,
  group: {
    pick: "Who's in the photo",
    pickHint: (max: number) => `Tap to add up to ${max} people. Each gets their own outfit.`,
    outfits: "Outfits",
    choose: "Choose outfit",
    change: "Change",
    keep: "Keeps current outfit",
    clear: "Keep their current outfit",
    done: "Done",
    outfitFor: (name: string) => `Outfit for ${name}`,
    needPeople: "Pick at least two people.",
    needTwins: (names: string) => `Add a selfie for ${names} first.`,
    needOutfit: "Give at least one person an outfit.",
    progress: (done: number, total: number) => `Dressing ${done} of ${total}…`,
    composing: "Putting everyone together…",
    partial: (names: string) => `Couldn't render ${names}; they're shown in their current outfit.`,
    collage: "Couldn't blend everyone into one photo, so they're shown side by side.",
    generating: ["Reading everyone's face…", "Fitting every piece to its person…", "Posing the group…", "Placing everyone in the scene…", "Matching the light…", "Almost done…"],
    estimate: "group looks take ~1 min",
    add: "Add person",
    addFromCircle: "From your Twin Circle",
    manageCircle: "Manage Twin Circle",
    circleEmpty: "No one in your circle yet.",
    noTwin: "No selfie",
    twinReady: "Selfie ready",
    remove: (name: string) => `Remove ${name}`,
    posture: "Group pose",
    postureAuto: (label: string) => `Auto · ${label}`,
    postureHint: "Auto poses the group to fit how you're related, set in your Twin Circle.",
    pieces: (n: number) => (n === 1 ? "1 piece" : `${n} pieces`),
    notesFor: (name: string) => `Notes for ${name}`,
    notesPlaceholder: "e.g. sleeves rolled, shirt untucked",
    dressHint: "A full outfit replaces the top and bottom.",
  },
  description: "Dress yourself — or you and someone from your circle — in any outfit, then pose, style and share it.",
  steps: { who: "Who's wearing it", source: "Outfit", outfits: "Outfits", garment: "Garment type", prompt: "Styling notes", scene: "Scene" },
  optional: "Optional",
  sources: { link: "Link", upload: "Upload", wardrobe: "Wardrobe", describe: "Describe" },
  describePlaceholder: "e.g. an emerald silk saree with a gold zari border and a sleeveless blouse",
  describeHint: "We dress your twin straight from the description — no product photo needed.",
  describeExamples: ["Emerald silk saree, gold zari border", "Navy linen suit over a white tee", "Pastel lehenga with mirror work", "Oversized denim jacket, slip dress"],
  indianWear: "Indian wear",
  indianWearHint: "Pick the garment for drape-aware rendering of sarees, lehengas, sherwanis and more.",
  linkPlaceholder: "Paste a product link",
  linkHint: "Works with Myntra, Ajio, Zara, H&M, Nykaa Fashion and most online stores.",
  fetch: "Fetch",
  uploadCta: "Drop an outfit photo or browse",
  uploadHint: "PNG, JPG or WebP · garment on a plain background works best",
  wardrobeEmpty: "Your wardrobe is empty.",
  removeOutfit: "Remove outfit",
  promptPlaceholder: "e.g. tuck the shirt in, sleeves rolled, relaxed fit",
  engine: {
    online: "Studio online",
    offline: "Rendering offline",
    offlineHint: "AI rendering isn't set up on this server yet.",
    exhausted: "AI credits exhausted",
    exhaustedHint: "Every AI image engine failed recently, usually because it's out of credits, so renders will probably fail until billing is topped up.",
  },
  howItWorks: [
    { title: "Pick who", body: "You, or anyone in your twin circle." },
    { title: "Add an outfit", body: "Paste a link, upload a photo, pick from your wardrobe or describe it." },
    { title: "Drape it", body: "Renders take about 20 seconds. Then try poses, makeup and motion." },
  ],
  credits: {
    left: (n: number) => `${n} credit${n === 1 ? "" : "s"} left`,
    cost: (n: number) => `${n} credit${n === 1 ? "" : "s"}`,
    short: (cost: number, balance: number) => `This look needs ${cost} credit${cost === 1 ? "" : "s"} and you have ${balance}.`,
    buy: "Get credits",
  },
  noTwinTitle: "Add a selfie to start draping",
  noTwinBody: "Drape puts you in any outfit from one selfie and your body details.",
  twinMissingTitle: "Couldn’t load your selfie",
  twinMissingBody: "The saved selfie is missing. Add it again to keep draping.",
  ready: "Ready to drape",
  compare: "Compare",
  before: "Before",
  after: "After",
  resultTitle: "Your look",
  placing: "Placing you in the scene…",
  videoUnavailable: "Video isn't available on this server yet.",
  posesLabel: "Poses",
  posesHint: "Render the same look from another angle.",
  livenessLabel: "Make it move",
  livenessHint: "Turn the look into a short video clip (takes 1–3 minutes).",
  makeupLabel: "Makeup",
  makeupHint: "Try lipstick, eyeshadow and blush on the finished look.",
  lipstick: "Lipstick",
  eyeshadow: "Eyeshadow",
  blush: "Blush",
  finish: "Finish",
  applyMakeup: "Apply makeup",
  undo: "Undo",
  animate: "Animate",
  generate: "Drape it",
  generating: ["Analysing your twin…", "Reading the garment…", "Fitting it to the body…", "Rendering fabric and light…", "Almost done…"],
  needTwin: "Add a selfie for this person first",
  setupTwin: "Add selfie",
  needOutfit: "Add an outfit to try on",
  save: "Save look",
  saved: "Saved to your looks",
  share: "Share",
  download: "Download",
  retry: "Try another",
  lookName: "Look name",
  occasion: "Occasion",
  confirmSave: "Save",
  cancel: "Cancel",
  emptyStage: "Your look will appear here",
};

export const wardrobeContent = {
  title: "Wardrobe",
  description: "Everything you own, ready to mix, match and drape.",
  add: "Add item",
  all: "All",
  searchPlaceholder: "Search items or brands…",
  emptyTitle: "Nothing here yet",
  emptyDescription: "Add clothes you own and we'll start building combinations from them.",
  noMatch: "No items match your filters.",
  drape: "Drape",
  remove: "Remove",
  combosTitle: "AI combinations",
  combosDescription: "New outfits built only from what you already own.",
  combosNeedMore: "Add at least a top and a bottom (or a dress) to get combinations.",
  shuffle: "Shuffle",
  plannerTitle: "Plan for an occasion",
  plannerCta: "Ask the stylist",
  plannerNotes: "Anything else? (venue, weather, colours to avoid)",
  plannerError: "The AI stylist is unavailable right now. Try the combinations above.",
  form: {
    title: "Add to wardrobe",
    photo: "Photo",
    upload: "Upload photo",
    orLink: "or paste a product link",
    name: "Name",
    brand: "Brand",
    category: "Category",
    color: "Colour",
    tags: "Tags",
    tagsHint: "Comma separated, e.g. casual, summer",
    submit: "Add item",
  },
};

export const profileContent = {
  tabs: { twin: "My twin", circle: "Twin circle", looks: "Saved looks", account: "Account" },
  twinTitle: "Your twin",
  twinDescription: "A clear selfie and your body details. Drape puts you in every outfit from these — your face comes straight from the selfie.",
  photo: "Selfie",
  photoHint: "Face the camera in good light — no sunglasses, mask or hat. Drape keeps the face from this photo.",
  takeSelfie: "Take selfie",
  fromGallery: "Gallery",
  removeSelfie: "Remove selfie",
  selfieType: "Choose a JPG, PNG or WebP photo.",
  bodyHint: "Used to draw the full body, since a selfie only shows the face.",
  camera: {
    title: "Take a selfie",
    tip: "Fit your face in the oval, look straight at the camera, and keep a neutral expression.",
    capture: "Capture",
    retake: "Retake",
    use: "Use this photo",
    denied: "Camera access is blocked. Allow it in your browser settings, or choose a photo from your gallery.",
    unavailable: "No camera available. Choose a photo from your gallery instead.",
  },
  gender: "Gender",
  age: "Age",
  height: "Height (cm)",
  weight: "Weight (kg)",
  skinTone: "Skin tone",
  background: "Default scene",
  save: "Save",
  saved: "Saved",
  circleTitle: "Twin circle",
  circleDescription: (limit: number) => `Add up to ${limit} people — partner, family or close friends — each with their own selfie and body details.`,
  addMember: "Add member",
  editMember: "Edit member",
  memberName: "Name",
  relation: "Relation",
  removeMember: "Remove",
  circleFull: (limit: number) => `Your circle is full (${limit} members).`,
  circleEmpty: "No one in your circle yet.",
  consent: "I have this person's permission to use their photo and body details.",
  drapeOn: "Drape on",
  looksEmpty: "No saved looks yet. Create one in Drape.",
  createLook: "Create a look",
  accountTitle: "Account",
  profilePhoto: "Change profile photo",
  profilePhotoHint: "Shown in the top bar, chats and your circle.",
  username: "Username",
  email: "Email",
  bio: "Bio",
  location: "Location",
  saveAccount: "Save changes",
  accountSaved: "Profile updated",
  photoSaved: "Profile photo updated",
  twinReady: "Selfie ready",
  twinMissing: "No selfie yet",
};
