// Copy for the signed-in app — same wording as the web app's data/app-content.ts.

export const brand = {
  name: "Threadflank",
  tagline: "Try anything. Wear everything.",
  copyright: "© 2026 Threadflank, Inc.",
};

export type NavIcon =
  | "compass"
  | "shirt"
  | "layers"
  | "message"
  | "user"
  | "users"
  | "bookmark"
  | "gem"
  | "mail"
  | "scroll"
  | "shield"
  | "calendar"
  | "flame"
  | "scissors"
  | "lock"
  | "bell";

export const appNav = {
  /** Bottom tab bar. */
  tabs: [
    { id: "discover", label: "Discover", icon: "compass" },
    { id: "drape", label: "Drape", icon: "shirt" },
    { id: "wardrobe", label: "Wardrobe", icon: "layers" },
    { id: "saved", label: "Saved", icon: "bookmark" },
    { id: "messages", label: "Messages", icon: "message" },
  ] as const,
  /** Account menu entries for the signed-in person. */
  account: [
    { id: "profile", label: "Profile", href: "/profile", icon: "user" },
    { id: "circle", label: "Twin circle", href: "/profile?tab=circle", icon: "users" },
    { id: "events", label: "Events", href: "/events", icon: "calendar" },
    { id: "trending", label: "Trending", href: "/trending", icon: "flame" },
    { id: "stylist", label: "Stylist", href: "/stylist", icon: "scissors" },
  ] as const,
  /** Secondary pages. */
  more: [
    { id: "pricing", label: "Credits & pricing", href: "/credits", icon: "gem" },
    { id: "contact", label: "Contact us", href: "/contact", icon: "mail" },
    { id: "terms", label: "Terms & conditions", href: "/legal/terms", icon: "scroll" },
    { id: "privacy", label: "Privacy policy", href: "/legal/privacy", icon: "lock" },
    { id: "disclaimer", label: "Disclaimer", href: "/legal/disclaimer", icon: "shield" },
  ] as const,
  menuLabel: "Account menu",
  moreLabel: "More",
  logout: "Sign out",
};

// ─── Discover ────────────────────────────────────────────────────────────────

export const discoverContent = {
  title: "Discover",
  description: "Fresh drops and looks from the brands you follow.",
  searchPlaceholder: "Search looks, brands, items…",
  allStoriesLabel: "All",
  categories: ["All", "Ethnic", "Streetwear", "Minimal", "Formal", "Athleisure", "Vintage"],
  shopLabel: "Shop the look",
  commentPlaceholder: "Add a comment…",
  postButton: "Post",
  viewComments: (n: number) => (n === 1 ? "View 1 comment" : `View all ${n} comments`),
  likes: (n: number) => (n === 1 ? "1 like" : `${n.toLocaleString()} likes`),
  loadingComments: "Loading comments…",
  deleteComment: "Delete comment",
  savedNote: "Saved to your looks",
  unsavedNote: "Removed from your looks",
  openSaved: "Open Saved",
  copyLink: "Copy link",
  linkCopied: "Link copied",
  openPost: "Open post",
  tryOn: "Try it on",
  emptyTitle: "No matching looks",
  emptyDescription: "Try another brand, category or search term.",
  noPostsTitle: "No posts yet",
  noPostsDescription: "Brands haven't published anything yet. Check back soon.",
  trendingTitle: "Trending now",
  trendingDescription: "Brand posts getting the most attention right now.",
  trending: ["#oversized", "#earthtones", "#linen", "#monochrome", "#y2k", "#tailoring"],
};

// ─── Messages ────────────────────────────────────────────────────────────────

export const messagesContent = {
  title: "Messages",
  tabs: { chats: "Chats", friends: "Friends" },
  searchChats: "Search chats…",
  searchFriends: "Search friends…",
  newChat: "New message",
  newGroup: "New group",
  addFriend: "Add friend",
  online: "Online",
  offline: "Offline",
  members: (n: number) => `${n} members`,
  inputPlaceholder: (name: string) => `Message ${name.split(/\s+/)[0]}…`,
  send: "Send",
  typing: "typing…",
  today: "Today",
  yesterday: "Yesterday",
  startChat: "Message",
  emptyChatsTitle: "No conversations yet",
  emptyChatsDescription: "Add a friend and start a chat, or create a group for your circle.",
  emptyFriendsTitle: "No friends yet",
  emptyFriendsDescription: "Add friends by username or email to chat and build your twin circle.",
  noResults: "No results",
  requests: "Friend requests",
  suggestions: "People you may know",
  accept: "Accept",
  decline: "Decline",
  pending: "Pending",
  sayHi: "Say hi 👋",
};
