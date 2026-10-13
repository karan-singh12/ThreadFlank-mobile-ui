import { Send } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { GlassCard } from "@/components/ui/GlassCard";
import { Photo } from "@/components/ui/Photo";
import { useAuth } from "@/features/auth/AuthProvider";
import { chatApi } from "@/features/messages/api";
import { senderName } from "@/features/messages/hooks";
import type { ChatMessage } from "@/features/messages/types";
import { useAppSocket, useSocketEvent } from "@/lib/socket";
import { colors, fonts, radius } from "@/theme";

/** The event's circle chat, live (the same chat backend as Messages). */
export function GrwmChat({ groupId }: { groupId: string }) {
  const { token, user } = useAuth();
  const socket = useAppSocket();
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!token) return;
    chatApi
      .getGroupMessages(token, groupId, { take: 50 })
      .then((list) => setMessages([...list].sort((a, b) => a.sentAt.localeCompare(b.sentAt))))
      .catch(() => setMessages([]));
  }, [token, groupId]);

  // Join the group's room so messages arrive while this screen is open.
  useEffect(() => {
    if (!socket) return;
    const join = () => socket.emit("joinGroup", { groupId });
    join();
    socket.on("connect", join);
    return () => {
      socket.off("connect", join);
      socket.emit("leaveGroup", { groupId });
    };
  }, [socket, groupId]);

  useSocketEvent<ChatMessage>("receiveMessage", (m) => {
    if (m.groupId !== groupId) return;
    setMessages((list) => (list?.some((x) => x.id === m.id) ? list : [...(list ?? []), m]));
  });

  const send = async () => {
    if (!token || !text.trim()) return;
    setSending(true);
    try {
      const m = await chatApi.sendMessage(token, { groupId, content: text.trim() });
      setMessages((list) => (list?.some((x) => x.id === m.id) ? list : [...(list ?? []), m]));
      setText("");
    } finally {
      setSending(false);
    }
  };

  return (
    <GlassCard padding={0}>
      <View style={styles.head}>
        <AppText variant="sm" weight="medium">
          Circle chat
        </AppText>
      </View>
      <ScrollView
        ref={scrollRef}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        nestedScrollEnabled
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages === null ? (
          <ActivityIndicator color={colors.accentBright} />
        ) : messages.length === 0 ? (
          <AppText variant="sm" color={colors.muted}>
            Say hi and share what you&apos;re thinking of wearing.
          </AppText>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === user?.id;
            return (
              <View key={m.id} style={[styles.msg, mine ? styles.mine : styles.theirs]}>
                {!mine && (
                  <AppText variant="micro" color={colors.muted}>
                    {senderName(m)}
                  </AppText>
                )}
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  {m.attachmentUrl && m.attachmentType === "image" ? (
                    <View style={styles.attachment}>
                      <Photo src={m.attachmentUrl} alt="" style={StyleSheet.absoluteFill} />
                    </View>
                  ) : null}
                  {m.content ? (
                    <AppText variant="sm" color="#fff">
                      {m.content}
                    </AppText>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          maxLength={1000}
          placeholder="Message the circle…"
          placeholderTextColor={colors.muted}
          selectionColor={colors.accentBright}
          returnKeyType="send"
          onSubmitEditing={send}
          style={styles.input}
          accessibilityLabel="Message the circle"
        />
        <Pressable onPress={send} disabled={sending || !text.trim()} style={[styles.send, (sending || !text.trim()) && styles.dim]} accessibilityLabel="Send">
          {sending ? <ActivityIndicator size="small" color="#fff" /> : <Send size={16} color="#fff" />}
        </Pressable>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  list: { height: 320 },
  listContent: { padding: 16, gap: 8 },
  msg: { gap: 2, maxWidth: "85%" },
  mine: { alignSelf: "flex-end", alignItems: "flex-end" },
  theirs: { alignSelf: "flex-start", alignItems: "flex-start" },
  bubble: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, gap: 4 },
  bubbleMine: { backgroundColor: colors.accentBright },
  bubbleTheirs: { backgroundColor: "rgba(255,255,255,0.08)" },
  attachment: { width: 160, height: 200, borderRadius: 8, overflow: "hidden" },
  inputRow: { flexDirection: "row", gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: colors.lineSoft },
  input: {
    flex: 1,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.glass,
    paddingHorizontal: 16,
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  send: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.accentBright },
  dim: { opacity: 0.5 },
});
