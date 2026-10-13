export interface FriendUser {
  id: string;
  username: string | null;
  email: string;
  avatar: string | null;
  bio?: string | null;
  isOnline?: boolean;
  lastSeen?: string | null;
  friendshipId?: string;
  friendsSince?: string;
}

export interface FriendRequestItem {
  id: string;
  senderId: string;
  receiverId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  sender?: FriendUser;
  receiver?: FriendUser;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  conversationId?: string | null;
  groupId?: string | null;
  content: string;
  sentAt: string;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  replyToMessageId?: string | null;
  isEdited?: boolean;
  deletedAt?: string | null;
  sender: { id: string; username: string | null; email: string; avatar: string | null };
  /** Optimistic message not yet confirmed by the server. */
  pending?: boolean;
}

export interface ChatRoom {
  id: string; // "conv_ID" or "group_ID"
  conversationId?: string;
  groupId?: string;
  type: "dm" | "group";
  name: string;
  avatar: string | null;
  otherId?: string;
  description?: string;
  lastMessage: string;
  lastMessageAt: string;
  online?: boolean;
  isMuted?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  memberCount?: number;
  members?: Array<{ id: string; name: string; avatar: string | null }>;
  unread?: number;
}

export interface ChatSearchResult {
  users: Array<{ id: string; username: string | null; email: string; avatar: string | null }>;
  groups: Array<{ id: string; name: string; avatar: string | null; description?: string }>;
  messages: ChatMessage[];
}
