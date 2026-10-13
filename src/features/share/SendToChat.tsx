import { useQuery } from "@tanstack/react-query";
import { Check, Send, Users } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/features/auth/AuthProvider";
import { chatApi } from "@/features/messages/api";
import type { ChatRoom } from "@/features/messages/types";
import { errorMessage } from "@/lib/api/client";
import { assetUrl } from "@/lib/api/config";
import { colors } from "@/theme";

const roomIds = (room: ChatRoom) => ({
  conversationId: room.type === "dm" ? room.conversationId ?? room.id.replace(/^conv_/, "") : undefined,
  groupId: room.type === "group" ? room.groupId ?? room.id.replace(/^group_/, "") : undefined,
});

/** Recent DMs and groups, each with a Send button that posts the image and message into that chat. */
export function SendToChat({ image, message, onError }: { image: string; message: string; onError: (message: string) => void }) {
  const { token } = useAuth();
  const [sending, setSending] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<Record<string, boolean>>({});

  const { data: rooms } = useQuery({
    queryKey: ["share-rooms", token],
    queryFn: async () => {
      const [dms, groups] = await Promise.all([chatApi.getConversations(token!).catch(() => []), chatApi.getGroups(token!).catch(() => [])]);
      return [...dms, ...groups].sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? "")).slice(0, 12);
    },
    enabled: Boolean(token),
  });

  const send = async (room: ChatRoom) => {
    if (!token) return;
    setSending(room.id);
    try {
      await chatApi.sendMessage(token, { ...roomIds(room), content: message, attachmentUrl: assetUrl(image), attachmentType: "image" });
      setSentTo((s) => ({ ...s, [room.id]: true }));
    } catch (e) {
      onError(errorMessage(e));
    } finally {
      setSending(null);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.label}>
        <Users size={14} color={colors.muted} />
        <AppText variant="label" color={colors.muted}>
          Send to a chat
        </AppText>
      </View>
      {rooms === undefined ? (
        <ActivityIndicator color={colors.accentBright} style={styles.loader} />
      ) : rooms.length === 0 ? (
        <AppText variant="sm" color={colors.muted}>
          No chats yet. Add friends in Messages to share with them.
        </AppText>
      ) : (
        rooms.map((room) => {
          const sent = sentTo[room.id];
          return (
            <View key={room.id} style={styles.row}>
              <Avatar name={room.name} src={room.avatar} size={36} />
              <AppText variant="sm" numberOfLines={1} style={styles.name}>
                {room.name}
              </AppText>
              <Pressable onPress={() => send(room)} disabled={sending !== null || sent} style={({ pressed }) => [styles.send, (sending !== null || sent) && styles.disabled, pressed && styles.pressed]}>
                {sending === room.id ? <ActivityIndicator size="small" color="#fff" /> : sent ? <Check size={14} color="#fff" /> : <Send size={14} color="#fff" />}
                <AppText variant="xs" color="#fff">
                  {sent ? "Sent" : "Send"}
                </AppText>
              </Pressable>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  loader: { alignSelf: "flex-start" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 },
  name: { flex: 1 },
  send: { height: 32, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)" },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.75 },
});
