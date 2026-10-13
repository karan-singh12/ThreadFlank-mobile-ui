import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Copy, Sparkles, Trash2 } from "lucide-react-native";
import { memo, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, FlatList, PanResponder, Platform, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Sheet } from "@/components/ui/Sheet";
import { assetUrl } from "@/lib/api/config";
import { colors, fonts, gradients } from "@/theme";
import { senderName } from "../hooks";
import { formatDateLabel, formatTime } from "../time";
import type { ChatMessage } from "../types";
import { ChatAvatar } from "./ChatAvatar";

/** A new centred time label after this much silence, as Instagram does. */
const GAP_MS = 60 * 60 * 1000;
/** How far a swipe slides the thread to reveal the times. */
const REVEAL_PX = 64;

const at = (m: ChatMessage) => new Date(m.sentAt).getTime() || 0;
const sameDay = (a: ChatMessage, b: ChatMessage) => new Date(a.sentAt).toDateString() === new Date(b.sentAt).toDateString();
const breaksBetween = (a: ChatMessage, b: ChatMessage) => !sameDay(a, b) || at(b) - at(a) > GAP_MS;
/** One to three emoji on their own are shown large, without a bubble. */
const isEmojiOnly = (text: string) =>
  /^(?:\p{Extended_Pictographic}|\p{Emoji_Component}|‍|️|\s)+$/u.test(text) && Array.from(text.trim()).length <= 6 && !/^[\d#*\s]+$/.test(text);

type Row = { message: ChatMessage; mine: boolean; separator: boolean; first: boolean; last: boolean; showSent: boolean; showName: boolean };

/** Swipe the thread left to slide every message over and reveal its time, then it springs back. */
function useRevealTimes() {
  const offset = useRef(new Animated.Value(0)).current;
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dx < -8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderMove: (_, g) => {
        const dx = Math.max(0, -g.dx);
        // Eases towards the limit so the slide feels elastic.
        offset.setValue(-REVEAL_PX * (1 - Math.exp(-dx / REVEAL_PX)));
      },
      onPanResponderRelease: () => Animated.timing(offset, { toValue: 0, duration: 320, easing: Easing.bezier(0.16, 1, 0.3, 1), useNativeDriver: true }).start(),
      onPanResponderTerminate: () => Animated.timing(offset, { toValue: 0, duration: 320, useNativeDriver: true }).start(),
    })
  ).current;
  return { offset, panHandlers: pan.panHandlers };
}

/**
 * The thread, Instagram style: consecutive messages grouped into one stack of bubbles, the
 * other person's photo beside their latest bubble, centred time labels between sittings, each
 * message's time revealed by swiping left, and long-press for Copy / Unsend. Newest at the bottom
 * (inverted list), older messages load when you scroll up.
 */
export function MessageList({
  messages,
  meId,
  isGroup,
  loading,
  hasMoreOlder,
  loadingOlder,
  onLoadOlder,
  typing,
  person,
  onDelete,
}: {
  messages: ChatMessage[];
  meId?: string;
  isGroup: boolean;
  loading: boolean;
  hasMoreOlder: boolean;
  loadingOlder: boolean;
  onLoadOlder: () => void;
  typing: boolean;
  person: { name: string; avatar: string | null };
  onDelete: (id: string) => void;
}) {
  const { offset, panHandlers } = useRevealTimes();
  const [menuFor, setMenuFor] = useState<ChatMessage | null>(null);
  const waiting = loading && messages.length === 0;

  // Chronological grouping, then reversed for the inverted list (index 0 = newest).
  const rows: Row[] = messages
    .map((m, i) => {
      const prev = messages[i - 1];
      const next = messages[i + 1];
      const mine = m.senderId === meId;
      const separator = !prev || breaksBetween(prev, m);
      const first = separator || prev.senderId !== m.senderId;
      const last = !next || breaksBetween(m, next) || next.senderId !== m.senderId;
      return { message: m, mine, separator, first, last, showSent: mine && !next, showName: isGroup && !mine && first };
    })
    .reverse();

  if (waiting) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accentBright} />
      </View>
    );
  }

  // Shown outside the inverted list so it isn't flipped.
  if (rows.length === 0 && !typing) {
    return (
      <View style={styles.empty}>
        <ChatAvatar name={person.name} avatar={person.avatar} group={isGroup} size={80} />
        <AppText variant="title" style={styles.emptyName}>
          {person.name}
        </AppText>
        <View style={styles.hint}>
          <Sparkles size={14} color={colors.cyan} />
          <AppText variant="sm" color={colors.muted}>
            Say hello, or share a look for quick feedback
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.clip} {...panHandlers}>
      <Animated.View style={[styles.fill, { transform: [{ translateX: offset }] }]}>
        <FlatList
          inverted
          data={rows}
          keyExtractor={(r) => r.message.id}
          renderItem={({ item }) => <MessageRow row={item} onMenu={setMenuFor} />}
          contentContainerStyle={styles.content}
          onEndReached={() => hasMoreOlder && !loadingOlder && onLoadOlder()}
          onEndReachedThreshold={0.3}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
          ListHeaderComponent={typing ? <TypingRow person={person} isGroup={isGroup} /> : null}
          ListFooterComponent={
            loadingOlder ? (
              <View style={styles.older}>
                <ActivityIndicator size="small" color={colors.muted} />
              </View>
            ) : null
          }
        />
      </Animated.View>

      <Sheet open={Boolean(menuFor)} onClose={() => setMenuFor(null)} title="Message" maxHeight={0.5}>
        {menuFor && (
          <>
            <View style={styles.preview}>
              <AppText variant="sm" color={colors.subtle} numberOfLines={3}>
                {menuFor.content || "Photo"}
                <AppText variant="sm" color={colors.muted}>
                  {" "}
                  · {formatTime(menuFor.sentAt)}
                </AppText>
              </AppText>
            </View>
            {menuFor.content ? (
              <Pressable
                onPress={() => {
                  void Clipboard.setStringAsync(menuFor.content);
                  setMenuFor(null);
                }}
                style={({ pressed }) => [styles.action, pressed && styles.pressed]}
              >
                <Copy size={18} color={colors.subtle} />
                <AppText variant="body">Copy text</AppText>
              </Pressable>
            ) : null}
            {menuFor.senderId === meId && (
              <Pressable
                onPress={() => {
                  onDelete(menuFor.id);
                  setMenuFor(null);
                }}
                style={({ pressed }) => [styles.action, pressed && styles.dangerPressed]}
              >
                <Trash2 size={18} color={colors.red} />
                <AppText variant="body" color={colors.red}>
                  Unsend
                </AppText>
              </Pressable>
            )}
          </>
        )}
      </Sheet>
    </View>
  );
}

const MessageRow = memo(function MessageRow({ row, onMenu }: { row: Row; onMenu: (m: ChatMessage) => void }) {
  const { message: m, mine, separator, first, last, showSent, showName } = row;
  const emoji = Boolean(m.content) && !m.attachmentUrl && isEmojiOnly(m.content);
  const openMenu = () => {
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    onMenu(m);
  };

  // Corners tighten where bubbles from the same person stack, like Instagram's message groups.
  const corners = mine
    ? { borderTopRightRadius: first ? 20 : 6, borderBottomRightRadius: last ? 20 : 6 }
    : { borderTopLeftRadius: first ? 20 : 6, borderBottomLeftRadius: last ? 20 : 6 };

  return (
    <View style={[first ? styles.groupStart : styles.groupCont, m.pending && styles.pending]}>
      {separator && (
        <AppText variant="micro" weight="medium" color={colors.muted} align="center" style={styles.separator}>
          {formatDateLabel(m.sentAt)} {formatTime(m.sentAt)}
        </AppText>
      )}
      {showName && (
        <AppText variant="micro" color={colors.muted} style={styles.sender}>
          {senderName(m)}
        </AppText>
      )}
      <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
        {!mine && <View style={styles.avatarSlot}>{last && <ChatAvatar name={senderName(m)} avatar={m.sender?.avatar} size={32} />}</View>}
        <Pressable onLongPress={openMenu} delayLongPress={400} style={[styles.bubbleCol, mine ? styles.alignEnd : styles.alignStart]}>
          {m.attachmentUrl ? (
            <Image source={{ uri: assetUrl(m.attachmentUrl) }} contentFit="cover" style={[styles.photo, styles.round20, corners]} accessibilityLabel="Shared photo" />
          ) : null}
          {m.content ? (
            emoji ? (
              <AppText style={styles.emoji}>{m.content}</AppText>
            ) : mine ? (
              <LinearGradient colors={gradients.bubbleMine} locations={[0, 0.45, 1]} style={[styles.bubble, styles.round20, corners]}>
                <AppText variant="body" color="#fff" style={styles.bubbleText}>
                  {m.content}
                </AppText>
              </LinearGradient>
            ) : (
              <View style={[styles.bubble, styles.theirs, styles.round20, corners]}>
                <AppText variant="body" color={colors.inkSoft} style={styles.bubbleText}>
                  {m.content}
                </AppText>
              </View>
            )
          ) : null}
        </Pressable>
        {/* Revealed in the right gutter when the thread is swiped left. */}
        <AppText variant="micro" color={colors.muted} style={styles.revealTime}>
          {formatTime(m.sentAt)}
        </AppText>
      </View>
      {showSent && (
        <AppText variant="micro" color={colors.muted} align="right" style={styles.sent}>
          {m.pending ? "Sending…" : "Sent"}
        </AppText>
      )}
    </View>
  );
});

function TypingRow({ person, isGroup }: { person: { name: string; avatar: string | null }; isGroup: boolean }) {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const loops = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(d, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(300 - i * 150),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View style={[styles.row, styles.rowTheirs, styles.groupStart]} accessibilityLabel="Typing">
      <ChatAvatar name={person.name} avatar={person.avatar} group={isGroup} size={32} />
      <View style={styles.typing}>
        {dots.map((d, i) => (
          <Animated.View key={i} style={[styles.dot, { transform: [{ translateY: d.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { flex: 1, overflow: "hidden" },
  fill: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 12, paddingVertical: 12 },
  older: { paddingVertical: 12, alignItems: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 48, paddingHorizontal: 24 },
  emptyName: { marginTop: 16 },
  hint: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  groupStart: { marginTop: 12 },
  groupCont: { marginTop: 2 },
  pending: { opacity: 0.6 },
  separator: { marginTop: 16, marginBottom: 12 },
  sender: { marginBottom: 4, marginLeft: 40 },
  row: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  rowMine: { justifyContent: "flex-end" },
  rowTheirs: { justifyContent: "flex-start" },
  avatarSlot: { width: 32 },
  bubbleCol: { maxWidth: "78%", gap: 2 },
  alignEnd: { alignItems: "flex-end" },
  alignStart: { alignItems: "flex-start" },
  round20: { borderRadius: 20 },
  photo: { width: 220, height: 260, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  bubble: { paddingHorizontal: 14, paddingVertical: 8, overflow: "hidden" },
  theirs: { backgroundColor: "rgba(255,255,255,0.08)" },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  emoji: { fontSize: 40, lineHeight: 48, paddingHorizontal: 4, fontFamily: fonts.regular },
  revealTime: { position: "absolute", right: -REVEAL_PX + 8, top: "50%", marginTop: -7 },
  sent: { marginTop: 4, paddingRight: 4 },
  typing: { height: 36, flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.08)", paddingHorizontal: 16 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.subtle },
  preview: { borderRadius: 16, backgroundColor: "rgba(255,255,255,0.05)", paddingHorizontal: 16, paddingVertical: 12 },
  action: { height: 52, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, borderRadius: 16 },
  pressed: { backgroundColor: "rgba(255,255,255,0.06)" },
  dangerPressed: { backgroundColor: "rgba(239,68,68,0.1)" },
});
