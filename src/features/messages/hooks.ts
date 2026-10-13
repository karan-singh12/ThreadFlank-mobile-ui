import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/features/auth/AuthProvider";
import { queryKeys } from "@/lib/queryKeys";
import { useSocketEvent } from "@/lib/socket";
import { chatApi } from "./api";
import type { ChatMessage, ChatRoom, FriendUser } from "./types";

export const friendName = (f: { username?: string | null; email?: string }) => f.username || f.email?.split("@")[0] || "Someone";
export const senderName = (m: ChatMessage) => m.sender?.username || m.sender?.email?.split("@")[0] || "Stylist";

const byRecent = (a: ChatRoom, b: ChatRoom) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();

/** Socket room ids for a chat room. */
export function roomRef(room: Pick<ChatRoom, "type" | "conversationId" | "groupId" | "id">) {
  return room.type === "dm"
    ? { conversationId: room.conversationId ?? room.id.replace(/^conv_/, "") }
    : { groupId: room.groupId ?? room.id.replace(/^group_/, "") };
}

const matchesRoom = (room: ChatRoom, m: { conversationId?: string | null; groupId?: string | null }) =>
  (room.type === "dm" && Boolean(m.conversationId) && roomRef(room).conversationId === m.conversationId) ||
  (room.type === "group" && Boolean(m.groupId) && roomRef(room).groupId === m.groupId);

// ─── Presence and the open thread (module state shared by every screen) ──────

let online = new Set<string>();
let openRoomId: string | null = null;
const presenceListeners = new Set<() => void>();
const emitPresence = () => presenceListeners.forEach((l) => l());

/** The chat screen marks its room as open so incoming messages there don't count as unread. */
export function setOpenRoom(id: string | null) {
  openRoomId = id;
}

/** Ids of users currently connected. */
export function usePresence() {
  return useSyncExternalStore(
    useCallback((l: () => void) => {
      presenceListeners.add(l);
      return () => presenceListeners.delete(l);
    }, []),
    () => online
  );
}

// ─── Queries ────────────────────────────────────────────────────────────────

/** DMs and groups, newest activity first. */
export function useRooms() {
  const { token } = useAuth();
  return useQuery({
    queryKey: queryKeys.conversations(token),
    queryFn: async () => {
      const [dms, groups] = await Promise.all([chatApi.getConversations(token!).catch(() => []), chatApi.getGroups(token!).catch(() => [])]);
      return [...dms, ...groups].sort(byRecent);
    },
    enabled: Boolean(token),
  });
}

/** Friends plus the friend requests waiting on you. */
export function useFriends() {
  const { token, user } = useAuth();
  return useQuery({
    queryKey: queryKeys.friends(token),
    queryFn: async () => {
      const [friends, requests] = await Promise.all([chatApi.fetchFriendsList(token!).catch(() => []), chatApi.fetchFriendRequests(token!, "all").catch(() => [])]);
      return { friends, incoming: requests.filter((r) => r.status === "PENDING" && r.receiverId === user?.id) };
    },
    enabled: Boolean(token),
  });
}

/** Total unread messages across chats, for the tab bar badge. */
export function useUnreadChats() {
  const { data } = useRooms();
  return useMemo(() => (data ?? []).reduce((sum, r) => sum + (r.unread ?? 0), 0), [data]);
}

/** Patch the cached room list (last message, unread) without refetching. */
export function useRoomsCache() {
  const { token } = useAuth();
  const client = useQueryClient();
  return useMemo(
    () => ({
      update: (fn: (rooms: ChatRoom[]) => ChatRoom[]) => client.setQueryData<ChatRoom[]>(queryKeys.conversations(token), (rooms) => (rooms ? fn(rooms) : rooms)),
      clearUnread: (roomId: string) =>
        client.setQueryData<ChatRoom[]>(queryKeys.conversations(token), (rooms) => rooms?.map((r) => (r.id === roomId ? { ...r, unread: 0 } : r))),
      invalidate: () => client.invalidateQueries({ queryKey: queryKeys.conversations(token) }),
    }),
    [client, token]
  );
}

/**
 * App-wide chat listeners on the shared socket, mounted once under the tabs: presence, the
 * conversation list's last message and unread counts, and friend request events.
 */
export function useChatRealtime() {
  const { token, user } = useAuth();
  const client = useQueryClient();
  const toast = useToast();
  const rooms = useRoomsCache();

  useSocketEvent<string[]>("initialOnlineUsers", (ids) => {
    online = new Set(ids);
    emitPresence();
  });
  useSocketEvent<{ userId: string }>("userOnline", ({ userId }) => {
    online = new Set([...online, userId]);
    emitPresence();
  });
  useSocketEvent<{ userId: string }>("userOffline", ({ userId }) => {
    const next = new Set(online);
    next.delete(userId);
    online = next;
    emitPresence();
  });

  useSocketEvent<ChatMessage>("receiveMessage", (msg) => {
    let known = false;
    rooms.update((list) =>
      list
        .map((r) => {
          if (!matchesRoom(r, msg)) return r;
          known = true;
          // The server can deliver a message twice (room + personal channel); only count new ones.
          if (r.lastMessageAt === msg.sentAt && r.lastMessage === (msg.content || (msg.attachmentUrl ? "Sent a photo" : ""))) return r;
          const fromOther = msg.senderId !== user?.id;
          return {
            ...r,
            lastMessage: msg.content || (msg.attachmentUrl ? "Sent a photo" : ""),
            lastMessageAt: msg.sentAt,
            unread: fromOther && openRoomId !== r.id ? (r.unread ?? 0) + 1 : r.unread ?? 0,
          };
        })
        .sort(byRecent)
    );
    // A message in a chat we don't have yet (new DM or group): load the list again.
    if (!known) void rooms.invalidate();
  });

  useSocketEvent("friendRequest", () => {
    void client.invalidateQueries({ queryKey: queryKeys.friends(token) });
    toast.show("New friend request received!");
  });
  useSocketEvent("acceptFriendRequest", () => {
    void client.invalidateQueries({ queryKey: queryKeys.friends(token) });
    void rooms.invalidate();
    toast.show("Friend request accepted! You can now chat.");
  });
}

/** Opens (or creates) the DM with a friend and returns its room. */
export async function openDirectChat(token: string, friend: FriendUser): Promise<ChatRoom> {
  const conv = await chatApi.createConversation(token, friend.id);
  if (!conv) throw new Error("Unable to start chat conversation.");
  return {
    id: `conv_${conv.id}`,
    conversationId: conv.id,
    type: "dm",
    name: friendName(friend),
    avatar: friend.avatar || null,
    otherId: friend.id,
    lastMessage: "Conversation opened",
    lastMessageAt: new Date().toISOString(),
    online: friend.isOnline,
  };
}
