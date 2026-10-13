import { apiRequest, type LocalFile } from "@/lib/api/client";
import { assetUrl } from "@/lib/api/config";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { uploadFile } from "@/lib/media";
import type { ChatMessage, ChatRoom, ChatSearchResult, FriendRequestItem, FriendUser } from "./types";

function page(options: { take?: number; before?: string }) {
  const parts: string[] = [];
  if (options.take) parts.push(`take=${options.take}`);
  if (options.before) parts.push(`before=${encodeURIComponent(options.before)}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

export const chatApi = {
  // ─── Conversations (DMs) ──────────────────────────────────────────────────
  async getConversations(token: string): Promise<ChatRoom[]> {
    return (await apiRequest<{ conversations: ChatRoom[] }>(ENDPOINTS.chat.conversations, { token })).data?.conversations ?? [];
  },

  async createConversation(token: string, otherUserId: string): Promise<{ id: string } | undefined> {
    return (await apiRequest<{ conversation: { id: string } }>(ENDPOINTS.chat.conversations, { method: "POST", token, body: { otherUserId } })).data?.conversation;
  },

  async getConversationMessages(token: string, conversationId: string, options: { take?: number; before?: string } = {}) {
    return (await apiRequest<{ messages: ChatMessage[] }>(`${ENDPOINTS.chat.conversationMessages(conversationId)}${page(options)}`, { token })).data?.messages ?? [];
  },

  // ─── Groups ───────────────────────────────────────────────────────────────
  async getGroups(token: string): Promise<ChatRoom[]> {
    return (await apiRequest<{ groups: ChatRoom[] }>(ENDPOINTS.chat.groups, { token })).data?.groups ?? [];
  },

  async createGroup(token: string, body: { name: string; description?: string; memberIds: string[] }): Promise<{ id: string } | undefined> {
    return (await apiRequest<{ group: { id: string } }>(ENDPOINTS.chat.groups, { method: "POST", token, body })).data?.group;
  },

  async getGroupMessages(token: string, groupId: string, options: { take?: number; before?: string } = {}) {
    return (await apiRequest<{ messages: ChatMessage[] }>(`${ENDPOINTS.chat.groupMessages(groupId)}${page(options)}`, { token })).data?.messages ?? [];
  },

  async leaveGroup(token: string, groupId: string) {
    await apiRequest<unknown>(ENDPOINTS.chat.leaveGroup(groupId), { method: "POST", token });
  },

  // ─── Messages HTTP fallback & actions ─────────────────────────────────────
  async sendMessage(
    token: string,
    body: { conversationId?: string; groupId?: string; content: string; attachmentUrl?: string; attachmentType?: string; replyToId?: string }
  ): Promise<ChatMessage> {
    return (await apiRequest<{ message: ChatMessage }>(ENDPOINTS.chat.messages, { method: "POST", token, body })).data.message;
  },

  async editMessage(token: string, messageId: string, content: string): Promise<ChatMessage> {
    return (await apiRequest<{ message: ChatMessage }>(ENDPOINTS.chat.message(messageId), { method: "PATCH", token, body: { content } })).data.message;
  },

  async deleteMessage(token: string, messageId: string) {
    await apiRequest<unknown>(ENDPOINTS.chat.message(messageId), { method: "DELETE", token });
  },

  // ─── Search ───────────────────────────────────────────────────────────────
  async searchChat(token: string, query: string): Promise<ChatSearchResult> {
    return (await apiRequest<ChatSearchResult>(`${ENDPOINTS.chat.search}?query=${encodeURIComponent(query)}`, { token })).data ?? { users: [], groups: [], messages: [] };
  },

  // ─── Friends ──────────────────────────────────────────────────────────────
  async fetchFriendsList(token: string): Promise<FriendUser[]> {
    return (await apiRequest<FriendUser[]>(ENDPOINTS.users.friends.list, { token })).data ?? [];
  },

  async fetchFriendRequests(token: string, type: "all" | "received" | "sent" = "all"): Promise<FriendRequestItem[]> {
    return (await apiRequest<FriendRequestItem[]>(`${ENDPOINTS.users.friends.requests}?type=${type}`, { token })).data ?? [];
  },

  async sendFriendRequest(token: string, identifier: string) {
    return (await apiRequest<{ friendship: unknown; friend: FriendUser; accepted: boolean }>(ENDPOINTS.users.friends.request, { method: "POST", token, body: { identifier } })).data;
  },

  async respondToFriendRequest(token: string, requestId: string, status: "ACCEPTED" | "REJECTED") {
    return (await apiRequest<unknown>(ENDPOINTS.users.friends.respond(requestId), { method: "PUT", token, body: { status } })).data;
  },

  async removeFriend(token: string, friendId: string) {
    await apiRequest<unknown>(ENDPOINTS.users.friends.remove(friendId), { method: "DELETE", token });
  },

  async fetchFriendSuggestions(token: string): Promise<FriendUser[]> {
    return (await apiRequest<FriendUser[]>(ENDPOINTS.users.friends.suggestions, { token })).data ?? [];
  },

  // ─── Media attachment upload ──────────────────────────────────────────────
  async uploadMedia(token: string, file: LocalFile): Promise<string> {
    return assetUrl(await uploadFile(token, file, "chat"));
  },
};
