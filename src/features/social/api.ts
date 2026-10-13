import { apiRequest } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

export type UserSummary = { id: string; username: string | null; email: string; avatar: string | null };

// ─── Twin circle ───────────────────────────────────────────────────────────

export type CircleMemberRow = {
  id: string;
  circleId: string;
  kind: "PROFILE" | "USER";
  status: "INVITED" | "ACTIVE" | "DECLINED";
  userId: string | null;
  name: string;
  relation: string | null;
  gender: string | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  skinTone: string | null;
  photo: string | null;
  twin: string | null;
  user: UserSummary | null;
};

export type CircleMembership = {
  memberId: string;
  circleId: string;
  status: "INVITED" | "ACTIVE";
  relation: string | null;
  owner: UserSummary | null;
  invitedAt: string;
};

export type CircleState = {
  circle: { id: string; ownerId: string; limit: number; members: CircleMemberRow[] };
  memberships: CircleMembership[];
};

export type ProfileMemberInput = {
  name?: string;
  relation?: string;
  gender?: string;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  skinTone?: string;
  photo?: string;
  twin?: string;
};

export type CircleWardrobeItem = { id: string; name: string; brand: string | null; category: string; image: string; color: string | null; onLoan: boolean };

export type BorrowRow = {
  id: string;
  ownerId: string;
  requesterId: string;
  wardrobeItemId: string;
  kind: "BORROW" | "SWAP";
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "RETURNED" | "CANCELLED";
  message: string | null;
  neededBy: string | null;
  createdAt: string;
  returnedAt: string | null;
  wardrobeItem: { id: string; name: string; brand: string | null; category: string; image: string; color: string | null };
  swapItem: { id: string; name: string; image: string; category: string } | null;
  owner: UserSummary | null;
  requester: UserSummary | null;
};

// ─── Events ────────────────────────────────────────────────────────────────

export type EventSummary = {
  id: string;
  circleId: string;
  createdById: string;
  title: string;
  eventType: string | null;
  dressCode: string | null;
  location: string | null;
  eventDate: string | null;
  budget: number | null;
  notes: string | null;
  groupId: string | null;
  grwmLiveAt: string | null;
  participants: number;
  locked: number;
  withLook: number;
  myPlanDone: boolean;
  isPast: boolean;
};

export type PlanRow = {
  id: string;
  eventId: string;
  userId: string | null;
  memberId: string | null;
  lookId: string | null;
  color: string | null;
  note: string | null;
  status: "PLANNING" | "LOCKED";
  updatedAt: string;
  look: { id: string; name: string; image: string; occasion: string; pieces: unknown; videoUrl: string | null } | null;
  person: { kind: "USER" | "PROFILE"; id: string; name: string; avatar: string | null; twin: string | null; isMe: boolean };
  canEdit: boolean;
};

export type EventDetail = Omit<EventSummary, "participants" | "locked" | "withLook" | "myPlanDone" | "isPast"> & {
  circleOwner: (UserSummary & { name: string; twin: string | null; photo: string | null }) | null;
  canManage: boolean;
  plans: PlanRow[];
  warnings: { type: "COLOR" | "LOOK"; message: string; planIds: string[] }[];
};

export type EventInput = {
  circleId?: string;
  title?: string;
  eventType?: string;
  dressCode?: string;
  location?: string;
  eventDate?: string | null;
  budget?: number | null;
  notes?: string;
};

// ─── Stylists ──────────────────────────────────────────────────────────────

export type StylistProfile = {
  id: string;
  userId: string;
  displayName: string;
  bio: string | null;
  city: string | null;
  specialties: string[] | null;
  portfolioUrl: string | null;
  status: "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";
  rejectionReason: string | null;
};

export type StylistComment = {
  id: string;
  lookId: string;
  stylistId: string;
  comment: string;
  createdAt: string;
  stylist: { displayName?: string; city?: string | null; specialties?: string[] | null; avatar: string | null };
};

export type QueueLook = {
  id: string;
  name: string;
  occasion: string;
  image: string;
  pieces: unknown;
  reviewRequestedAt: string | null;
  owner: UserSummary | null;
  commentCount: number;
  reviewedByMe: boolean;
};

// ─── Notifications, share, AI usage ────────────────────────────────────────

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

export type ShareLink = { id: string; token: string; channel: string; openCount: number; lookId: string };

export type AiUsageSummary = {
  days: number;
  totals: { requests: number; succeeded: number; failed: number; successRate: number | null; totalTokens: number; costUsd: number; avgLatencyMs: number | null };
  byTask: { taskType: string; requests: number; successRate: number | null; costUsd: number }[];
  daily: { date: string; requests: number; failed: number }[];
  allTime: { requests: number; tokens: number; costUsd: number };
  recent: { id: string; provider: string; model: string; taskType: string | null; success: boolean; latencyMs: number | null; createdAt: string; errorMessage: string | null }[];
};

export const socialApi = {
  // Circle
  async circle(token: string) {
    return (await apiRequest<CircleState>(ENDPOINTS.circle.root, { token })).data;
  },
  async addProfile(token: string, body: ProfileMemberInput) {
    return (await apiRequest<CircleMemberRow>(ENDPOINTS.circle.members, { method: "POST", token, body })).data;
  },
  async updateMember(token: string, id: string, body: ProfileMemberInput) {
    return (await apiRequest<CircleMemberRow>(ENDPOINTS.circle.member(id), { method: "PUT", token, body })).data;
  },
  async removeMember(token: string, id: string) {
    await apiRequest(ENDPOINTS.circle.member(id), { method: "DELETE", token });
  },
  async invite(token: string, userId: string, relation?: string) {
    return (await apiRequest<CircleMemberRow>(ENDPOINTS.circle.invites, { method: "POST", token, body: { userId, relation } })).data;
  },
  async respondInvite(token: string, memberId: string, accept: boolean) {
    await apiRequest(ENDPOINTS.circle.respond(memberId), { method: "POST", token, body: { accept } });
  },
  async leaveCircle(token: string, circleId: string) {
    await apiRequest(ENDPOINTS.circle.leave(circleId), { method: "POST", token });
  },
  async memberWardrobe(token: string, userId: string) {
    return (await apiRequest<CircleWardrobeItem[]>(ENDPOINTS.circle.wardrobe(userId), { token })).data;
  },
  async borrows(token: string) {
    return (await apiRequest<{ incoming: BorrowRow[]; outgoing: BorrowRow[] }>(ENDPOINTS.circle.borrow, { token })).data;
  },
  async requestBorrow(token: string, body: { wardrobeItemId: string; kind?: "BORROW" | "SWAP"; swapItemId?: string; eventId?: string; message?: string; neededBy?: string }) {
    return (await apiRequest<BorrowRow>(ENDPOINTS.circle.borrow, { method: "POST", token, body })).data;
  },
  async borrowAction(token: string, id: string, action: "accept" | "decline" | "returned" | "cancel") {
    await apiRequest(ENDPOINTS.circle.borrowAction(id, action), { method: "POST", token });
  },

  // Events
  async events(token: string) {
    return (await apiRequest<EventSummary[]>(ENDPOINTS.events.list, { token })).data;
  },
  async event(token: string, id: string) {
    return (await apiRequest<EventDetail>(ENDPOINTS.events.one(id), { token })).data;
  },
  async createEvent(token: string, body: EventInput) {
    return (await apiRequest<EventDetail>(ENDPOINTS.events.list, { method: "POST", token, body })).data;
  },
  async updateEvent(token: string, id: string, body: EventInput) {
    return (await apiRequest<EventDetail>(ENDPOINTS.events.one(id), { method: "PUT", token, body })).data;
  },
  async deleteEvent(token: string, id: string) {
    await apiRequest(ENDPOINTS.events.one(id), { method: "DELETE", token });
  },
  async setPlan(token: string, id: string, planId: string, body: { lookId?: string | null; color?: string | null; note?: string | null; status?: "PLANNING" | "LOCKED" }) {
    return (await apiRequest<EventDetail>(ENDPOINTS.events.plan(id, planId), { method: "PUT", token, body })).data;
  },
  async suggestPlan(token: string, id: string, planId: string) {
    return (await apiRequest<{ raw: string; outfits: { outfits?: unknown[] } | null }>(ENDPOINTS.events.suggest(id, planId), { method: "POST", token, timeoutMs: 120_000 })).data;
  },
  async setGrwm(token: string, id: string, live: boolean) {
    return (await apiRequest<{ groupId: string; live: boolean }>(ENDPOINTS.events.grwm(id), { method: "POST", token, body: { live } })).data;
  },

  // Stylists
  async myStylist(token: string) {
    return (await apiRequest<StylistProfile | null>(ENDPOINTS.stylists.me, { token })).data;
  },
  async applyStylist(token: string, body: { displayName: string; bio?: string; city?: string; specialties?: string[]; portfolioUrl?: string }) {
    return (await apiRequest<StylistProfile>(ENDPOINTS.stylists.me, { method: "PUT", token, body })).data;
  },
  async stylistQueue(token: string) {
    return (await apiRequest<QueueLook[]>(ENDPOINTS.stylists.queue, { token })).data;
  },
  async stylistComments(token: string, lookId: string) {
    return (await apiRequest<StylistComment[]>(ENDPOINTS.stylists.comments(lookId), { token })).data;
  },
  async postStylistComment(token: string, lookId: string, comment: string) {
    return (await apiRequest<StylistComment>(ENDPOINTS.stylists.comments(lookId), { method: "POST", token, body: { comment } })).data;
  },

  // Share
  async createShare(token: string, lookId: string, channel: "whatsapp" | "instagram" | "link") {
    return (await apiRequest<ShareLink>(ENDPOINTS.share.create, { method: "POST", token, body: { lookId, channel } })).data;
  },

  // Notifications
  async notifications(token: string) {
    return (await apiRequest<{ items: AppNotification[]; unread: number }>(ENDPOINTS.notifications.list, { token })).data;
  },
  async readNotification(token: string, id: string) {
    await apiRequest(ENDPOINTS.notifications.read(id), { method: "POST", token });
  },
  async readAllNotifications(token: string) {
    await apiRequest(ENDPOINTS.notifications.readAll, { method: "POST", token });
  },

  // AI usage
  async myAiUsage(token: string, days = 30) {
    return (await apiRequest<AiUsageSummary>(`${ENDPOINTS.aiUsage.me}?days=${days}`, { token })).data;
  },
};
