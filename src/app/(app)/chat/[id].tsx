import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, LogOut, MoreVertical, Phone, Video } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { Screen } from "@/components/layout/Screen";
import { AppText } from "@/components/ui/AppText";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/features/auth/AuthProvider";
import { chatApi } from "@/features/messages/api";
import { ChatAvatar } from "@/features/messages/components/ChatAvatar";
import { Composer } from "@/features/messages/components/Composer";
import { MessageList } from "@/features/messages/components/MessageList";
import { roomRef, setOpenRoom, usePresence, useRooms, useRoomsCache } from "@/features/messages/hooks";
import type { ChatMessage, ChatRoom } from "@/features/messages/types";
import { errorMessage, type LocalFile } from "@/lib/api/client";
import { pickImage } from "@/lib/media";
import { useAppSocket, useSocketEvent } from "@/lib/socket";
import { colors, GUTTER } from "@/theme";

const PAGE = 50;

/** One conversation (DM or group): live messages, typing, photos, unsend. */
export default function ChatScreen() {
  const params = useLocalSearchParams<{ id: string; name?: string; avatar?: string; type?: string; otherId?: string; members?: string }>();
  const { token, user } = useAuth();
  const toast = useToast();
  const socket = useAppSocket();
  const presence = usePresence();
  const { data: rooms } = useRooms();
  const roomsCache = useRoomsCache();

  // The cached room when we have it; otherwise built from the route params so the header paints instantly.
  const room: ChatRoom = useMemo(() => {
    const cached = rooms?.find((r) => r.id === params.id);
    if (cached) return cached;
    const type = params.type === "group" || params.id.startsWith("group_") ? "group" : "dm";
    return {
      id: params.id,
      type,
      conversationId: type === "dm" ? params.id.replace(/^conv_/, "") : undefined,
      groupId: type === "group" ? params.id.replace(/^group_/, "") : undefined,
      name: params.name || "Chat",
      avatar: params.avatar || null,
      otherId: params.otherId || undefined,
      memberCount: params.members ? Number(params.members) : undefined,
      lastMessage: "",
      lastMessageAt: new Date().toISOString(),
    };
  }, [rooms, params.id, params.type, params.name, params.avatar, params.otherId, params.members]);

  const isDM = room.type === "dm";
  const ref = roomRef(room);
  const online = isDM && Boolean(room.otherId && presence.has(room.otherId));

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [typing, setTyping] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<LocalFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const olderBusy = useRef(false);
  const typingRef = useRef(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPage = useCallback(
    (before?: string) =>
      isDM ? chatApi.getConversationMessages(token!, ref.conversationId!, { take: PAGE, before }) : chatApi.getGroupMessages(token!, ref.groupId!, { take: PAGE, before }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, isDM, ref.conversationId, ref.groupId]
  );

  // Initial load; the room counts as read while it's open.
  useEffect(() => {
    if (!token) return;
    let live = true;
    setOpenRoom(room.id);
    roomsCache.clearUnread(room.id);
    fetchPage()
      .then((msgs) => {
        if (!live) return;
        setMessages(msgs);
        setHasMoreOlder(msgs.length >= PAGE);
        const last = msgs[msgs.length - 1];
        if (last && last.senderId !== user?.id) socket?.emit("messageRead", { messageId: last.id });
      })
      .catch((e) => live && toast.show(errorMessage(e), { tone: "error" }))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
      setOpenRoom(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, room.id, fetchPage]);

  // Join the socket room for live messages and typing.
  useEffect(() => {
    if (!socket) return;
    const joinEvent = isDM ? "joinConversation" : "joinGroup";
    const leaveEvent = isDM ? "leaveConversation" : "leaveGroup";
    const join = () => socket.emit(joinEvent, ref);
    join();
    socket.on("connect", join);
    return () => {
      socket.off("connect", join);
      socket.emit(leaveEvent, ref);
      if (typingRef.current) socket.emit("typingStop", ref);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isDM, ref.conversationId, ref.groupId]);

  const inThisRoom = (m: { conversationId?: string | null; groupId?: string | null }) => (isDM ? m.conversationId === ref.conversationId : m.groupId === ref.groupId);

  useSocketEvent<ChatMessage>("receiveMessage", (msg) => {
    if (!inThisRoom(msg)) return;
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      // Replace our optimistic copy of the same message.
      const pendingIndex = prev.findIndex((m) => m.pending && m.senderId === msg.senderId && m.content === msg.content);
      if (pendingIndex >= 0) return prev.map((m, i) => (i === pendingIndex ? msg : m));
      return [...prev, msg];
    });
    if (msg.senderId !== user?.id) {
      setTyping((t) => t.filter((id) => id !== msg.senderId));
      socket?.emit("messageRead", { messageId: msg.id });
    }
  });
  useSocketEvent<{ messageId: string }>("messageDeleted", ({ messageId }) => setMessages((prev) => prev.filter((m) => m.id !== messageId)));
  useSocketEvent<ChatMessage>("messageEdited", (updated) => setMessages((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))));
  useSocketEvent<{ userId: string; conversationId?: string; groupId?: string }>("typingStart", (d) => {
    if (inThisRoom(d) && d.userId !== user?.id) setTyping((t) => (t.includes(d.userId) ? t : [...t, d.userId]));
  });
  useSocketEvent<{ userId: string; conversationId?: string; groupId?: string }>("typingStop", (d) => {
    if (inThisRoom(d)) setTyping((t) => t.filter((id) => id !== d.userId));
  });

  const loadOlder = async () => {
    if (!token || messages.length === 0 || olderBusy.current) return;
    olderBusy.current = true;
    setLoadingOlder(true);
    try {
      const older = await fetchPage(messages[0].id);
      setHasMoreOlder(older.length >= PAGE);
      if (older.length) setMessages((prev) => [...older, ...prev]);
    } catch {
      // Keep what's on screen; scrolling up again retries.
    } finally {
      setLoadingOlder(false);
      olderBusy.current = false;
    }
  };

  const emitTyping = () => {
    if (!socket) return;
    if (!typingRef.current) {
      typingRef.current = true;
      socket.emit("typingStart", ref);
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit("typingStop", ref);
      typingRef.current = false;
    }, 3500);
  };

  const pick = async (source: "camera" | "library") => {
    const file = await pickImage({ source });
    if (file) setAttachment(file);
  };

  const send = async () => {
    if (!token || !user) return;
    const text = draft.trim();
    if (!text && !attachment) return;

    let mediaUrl: string | undefined;
    if (attachment) {
      setUploading(true);
      try {
        mediaUrl = await chatApi.uploadMedia(token, attachment);
      } catch (e) {
        toast.show(errorMessage(e, "Could not upload image. Please try again."), { tone: "error" });
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    setDraft("");
    setAttachment(null);
    if (typingRef.current) {
      socket?.emit("typingStop", ref);
      typingRef.current = false;
    }

    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      senderId: user.id,
      ...ref,
      content: text,
      sentAt: new Date().toISOString(),
      attachmentUrl: mediaUrl ?? null,
      attachmentType: mediaUrl ? "image" : null,
      sender: { id: user.id, username: user.username, email: user.email, avatar: user.avatar },
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);

    if (socket?.connected) {
      socket.emit("sendMessage", { ...ref, content: text, attachmentUrl: mediaUrl ?? null, attachmentType: mediaUrl ? "image" : null });
      return;
    }
    // Socket down: REST fallback.
    try {
      const saved = await chatApi.sendMessage(token, { ...ref, content: text, attachmentUrl: mediaUrl, attachmentType: mediaUrl ? "image" : undefined });
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? saved : m)));
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setDraft(text);
      toast.show(errorMessage(e, "Failed to send message."), { tone: "error" });
    }
  };

  const unsend = async (id: string) => {
    if (!token) return;
    const before = messages;
    setMessages((prev) => prev.filter((m) => m.id !== id));
    try {
      await chatApi.deleteMessage(token, id);
      toast.show("Message unsent");
    } catch (e) {
      setMessages(before);
      toast.show(errorMessage(e, "Could not unsend message"), { tone: "error" });
    }
  };

  const callNotice = () =>
    Alert.alert(isDM ? "Calls are on the web for now" : "Calls work in one-to-one chats", isDM ? "Voice and video calls need the Threadflank web app. Open this chat there to call." : undefined);

  const leaveGroup = () =>
    Alert.alert("Leave group?", `You'll stop getting messages from ${room.name}.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          try {
            await chatApi.leaveGroup(token!, ref.groupId!);
            void roomsCache.invalidate();
            router.back();
          } catch (e) {
            toast.show(errorMessage(e), { tone: "error" });
          }
        },
      },
    ]);

  return (
    <Screen
      scroll={false}
      padded={false}
      keyboard
      header={
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.icon} accessibilityLabel="Back to chats">
            <ArrowLeft size={24} color="#fff" strokeWidth={1.75} />
          </Pressable>
          <View style={styles.who}>
            <ChatAvatar name={room.name} avatar={room.avatar} group={!isDM} online={isDM ? online : undefined} size={38} />
            <View style={styles.whoText}>
              <AppText variant="body" weight="medium" numberOfLines={1}>
                {room.name}
              </AppText>
              <AppText variant="xs" color={colors.muted} numberOfLines={1}>
                {typing.length > 0 ? "typing…" : isDM ? (online ? "Active now" : "Offline") : `${room.memberCount || 2} members`}
              </AppText>
            </View>
          </View>
          <Pressable onPress={callNotice} style={styles.icon} accessibilityLabel="Voice call">
            <Phone size={22} color="#fff" strokeWidth={1.75} />
          </Pressable>
          <Pressable onPress={callNotice} style={styles.icon} accessibilityLabel="Video call">
            <Video size={24} color="#fff" strokeWidth={1.75} />
          </Pressable>
          {!isDM && (
            <Pressable onPress={() => setMenuOpen(true)} style={styles.icon} accessibilityLabel="More">
              <MoreVertical size={20} color="#fff" strokeWidth={1.75} />
            </Pressable>
          )}
        </View>
      }
      footer={
        <Composer
          value={draft}
          onChange={(text) => {
            setDraft(text);
            emitTyping();
          }}
          onSend={send}
          onCamera={() => pick("camera")}
          onGallery={() => pick("library")}
          attachment={attachment ? { uri: attachment.uri, name: attachment.name } : null}
          onRemoveAttachment={() => setAttachment(null)}
          uploading={uploading}
          placeholder="Message…"
        />
      }
    >
      <MessageList
        messages={messages}
        meId={user?.id}
        isGroup={!isDM}
        loading={loading}
        hasMoreOlder={hasMoreOlder}
        loadingOlder={loadingOlder}
        onLoadOlder={loadOlder}
        typing={typing.length > 0}
        person={{ name: room.name, avatar: room.avatar }}
        onDelete={unsend}
      />

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} maxHeight={0.4}>
        <Pressable
          onPress={() => {
            setMenuOpen(false);
            leaveGroup();
          }}
          style={({ pressed }) => [styles.menuItem, pressed && styles.menuPressed]}
        >
          <LogOut size={18} color={colors.red} />
          <AppText variant="body" color={colors.red}>
            Leave group
          </AppText>
        </Pressable>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: GUTTER - 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
    backgroundColor: "rgba(1,2,20,0.7)",
  },
  icon: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  who: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, paddingLeft: 2 },
  whoText: { flex: 1, minWidth: 0 },
  menuItem: { height: 52, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, borderRadius: 16 },
  menuPressed: { backgroundColor: "rgba(239,68,68,0.1)" },
});
