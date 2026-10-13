import { useScrollToTop } from "expo-router";
import { MessagesSquare, Search, Sparkles, SquarePen, UserMinus, UserPlus, X } from "lucide-react-native";
import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "@/components/layout/Screen";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { GlassCard } from "@/components/ui/GlassCard";
import { useToast } from "@/components/ui/Toast";
import { AppHeader } from "@/features/app/AppHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import { chatApi } from "@/features/messages/api";
import { AddFriendSheet } from "@/features/messages/components/AddFriendSheet";
import { ChatAvatar } from "@/features/messages/components/ChatAvatar";
import { friendName, openDirectChat, useFriends, usePresence, useRooms } from "@/features/messages/hooks";
import { openChat } from "@/features/messages/navigation";
import { shortAgo } from "@/features/messages/time";
import type { ChatRoom, FriendUser } from "@/features/messages/types";
import { errorMessage } from "@/lib/api/client";
import { useSocketConnected } from "@/lib/socket";
import { colors, fonts, GUTTER, radius, TAB_BAR_HEIGHT } from "@/theme";

type Tab = "chats" | "friends";

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const toast = useToast();
  const connected = useSocketConnected();
  const presence = usePresence();
  const roomsQuery = useRooms();
  const friendsQuery = useFriends();
  const listRef = useRef<FlatList>(null);
  useScrollToTop(listRef);

  const [tab, setTab] = useState<Tab>("chats");
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState<false | "search" | "requests">(false);
  const [opening, setOpening] = useState<string | null>(null);

  const rooms = roomsQuery.data ?? [];
  const friends = friendsQuery.data?.friends ?? [];
  const incoming = friendsQuery.data?.incoming ?? [];
  const q = query.trim().toLowerCase();
  const filteredRooms = useMemo(() => rooms.filter((r) => !q || r.name.toLowerCase().includes(q)), [rooms, q]);
  const filteredFriends = useMemo(() => friends.filter((f) => !q || (f.username ?? "").toLowerCase().includes(q) || f.email.toLowerCase().includes(q)), [friends, q]);
  const isOnline = (f: FriendUser) => presence.has(f.id) || Boolean(f.isOnline);
  // The row of friends above the chats, online first, like Instagram's active strip.
  const activeStrip = useMemo(() => [...friends].sort((a, b) => Number(isOnline(b)) - Number(isOnline(a))).slice(0, 16), [friends, presence]); // eslint-disable-line react-hooks/exhaustive-deps

  const startChat = async (friend: FriendUser) => {
    if (!token || opening) return;
    setOpening(friend.id);
    try {
      const room = await openDirectChat(token, friend);
      void roomsQuery.refetch();
      openChat(room);
    } catch (e) {
      toast.show(errorMessage(e, "Unable to start chat conversation."), { tone: "error" });
    } finally {
      setOpening(null);
    }
  };

  const removeFriend = (friend: FriendUser) => {
    const name = friendName(friend);
    Alert.alert("Remove friend?", `Are you sure you want to remove ${name} from friends?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await chatApi.removeFriend(token!, friend.id);
            toast.show(`${name} removed from friends.`);
            void friendsQuery.refetch();
          } catch (e) {
            toast.show(errorMessage(e, "Failed to remove friend"), { tone: "error" });
          }
        },
      },
    ]);
  };

  const refreshing = roomsQuery.isRefetching || friendsQuery.isRefetching;
  const refresh = () => {
    void roomsQuery.refetch();
    void friendsQuery.refetch();
  };

  const header = (
    <View style={styles.top}>
      <View style={styles.titleRow}>
        <View style={styles.title}>
          <AppText variant="h3">Messages</AppText>
          <View style={[styles.conn, { backgroundColor: connected ? colors.green : "#fbbf24" }]} accessibilityLabel={connected ? "Connected" : "Connecting…"} />
        </View>
        <Pressable onPress={() => setAddOpen("search")} style={styles.compose} accessibilityLabel="Add friends">
          <SquarePen size={22} color="#fff" strokeWidth={1.75} />
        </Pressable>
      </View>

      <View style={styles.search}>
        <Search size={16} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={tab === "chats" ? "Search" : "Search friends"}
          placeholderTextColor={colors.muted}
          selectionColor={colors.accentBright}
          style={styles.searchInput}
          accessibilityLabel={tab === "chats" ? "Search conversations" : "Search friends"}
        />
        {query ? (
          <Pressable onPress={() => setQuery("")} hitSlop={8} accessibilityLabel="Clear search">
            <X size={16} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.tabs}>
        <Chip size="sm" label={`Chats  ${rooms.length}`} selected={tab === "chats"} onPress={() => setTab("chats")} />
        <Chip
          size="sm"
          label={`Friends  ${friends.length}`}
          selected={tab === "friends"}
          onPress={() => setTab("friends")}
          leading={
            incoming.length > 0 ? (
              <View style={styles.alert}>
                <AppText variant="micro" weight="semibold" color="#fff" style={styles.alertText}>
                  {incoming.length}
                </AppText>
              </View>
            ) : undefined
          }
        />
      </View>

      {tab === "chats" && !q && activeStrip.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
          {activeStrip.map((f) => (
            <Pressable key={f.id} onPress={() => startChat(f)} style={styles.stripItem} accessibilityLabel={`Message ${friendName(f)}`}>
              <ChatAvatar name={friendName(f)} avatar={f.avatar} online={isOnline(f)} size={64} />
              <AppText variant="xs" color={colors.subtle} numberOfLines={1} style={styles.stripName}>
                {friendName(f)}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {tab === "friends" && incoming.length > 0 && (
        <GlassCard padding={12} radius={radius.card}>
          <View style={styles.reqHead}>
            <View style={styles.reqTitle}>
              <Sparkles size={14} color={colors.cyan} />
              <AppText variant="xs" weight="medium" color={colors.cyan}>
                Requests ({incoming.length})
              </AppText>
            </View>
            <Pressable onPress={() => setAddOpen("requests")} hitSlop={8}>
              <AppText variant="xs" color={colors.muted}>
                View all
              </AppText>
            </Pressable>
          </View>
          {incoming.slice(0, 3).map((req) => {
            const name = req.sender ? friendName(req.sender) : "Stylist";
            return (
              <View key={req.id} style={styles.reqRow}>
                <ChatAvatar name={name} avatar={req.sender?.avatar} size={36} />
                <AppText variant="sm" numberOfLines={1} style={styles.flex}>
                  {name}
                </AppText>
                <Button size="sm" onPress={() => setAddOpen("requests")}>
                  Review
                </Button>
              </View>
            );
          })}
        </GlassCard>
      )}
    </View>
  );

  const loading = tab === "chats" ? roomsQuery.isLoading : friendsQuery.isLoading;
  const empty = loading ? (
    <ActivityIndicator color={colors.accentBright} style={styles.loader} />
  ) : tab === "chats" ? (
    <EmptyList icon={MessagesSquare} title={q ? "No chats found" : "No chats yet"} body="Start a conversation with a friend or a stylist." action="Find friends" onAction={() => setAddOpen("search")} />
  ) : (
    <EmptyList icon={UserPlus} title="No friends found" body="Grow your styling circle to swap looks and ideas." action="Add friends" onAction={() => setAddOpen("search")} />
  );

  return (
    <Screen header={<AppHeader />} scroll={false} padded={false}>
      <FlatList<ChatRoom | FriendUser>
        ref={listRef}
        data={tab === "chats" ? filteredRooms : filteredFriends}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accentBright} colors={[colors.accentBright]} progressBackgroundColor={colors.surface} />}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 16 }}
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) =>
          tab === "chats" ? (
            <RoomRow room={item as ChatRoom} online={(item as ChatRoom).type === "dm" ? presence.has((item as ChatRoom).otherId ?? "") : undefined} />
          ) : (
            <FriendRow friend={item as FriendUser} online={isOnline(item as FriendUser)} busy={opening === item.id} onMessage={() => startChat(item as FriendUser)} onRemove={() => removeFriend(item as FriendUser)} />
          )
        }
      />
      <AddFriendSheet open={Boolean(addOpen)} initialTab={addOpen || "search"} onClose={() => setAddOpen(false)} />
    </Screen>
  );
}

function RoomRow({ room, online }: { room: ChatRoom; online?: boolean }) {
  const isDM = room.type === "dm";
  const unread = (room.unread ?? 0) > 0;
  return (
    <Pressable onPress={() => openChat(room)} style={({ pressed }) => [styles.room, pressed && styles.pressed]}>
      <ChatAvatar name={room.name} avatar={room.avatar} group={!isDM} online={online} size={56} />
      <View style={styles.roomText}>
        <AppText variant="body" weight={unread ? "semibold" : "regular"} numberOfLines={1}>
          {room.name}
        </AppText>
        <View style={styles.roomSub}>
          <AppText variant="sm" weight={unread ? "medium" : "regular"} color={unread ? colors.ink : colors.muted} numberOfLines={1} style={styles.shrink}>
            {room.lastMessage || (isDM ? "Tap to chat" : `${room.memberCount || 2} members`)}
          </AppText>
          <AppText variant="sm" color={unread ? colors.ink : colors.muted}>
            {" "}
            · {shortAgo(room.lastMessageAt)}
          </AppText>
        </View>
      </View>
      {unread && <View style={styles.unread} accessibilityLabel="Unread" />}
    </Pressable>
  );
}

function FriendRow({ friend, online, busy, onMessage, onRemove }: { friend: FriendUser; online: boolean; busy: boolean; onMessage: () => void; onRemove: () => void }) {
  const name = friendName(friend);
  return (
    <View style={styles.friend}>
      <ChatAvatar name={name} avatar={friend.avatar} online={online} size={48} />
      <View style={styles.roomText}>
        <AppText variant="body" numberOfLines={1}>
          {name}
        </AppText>
        <AppText variant="sm" color={colors.muted} numberOfLines={1}>
          {online ? "Active now" : "Offline"}
        </AppText>
      </View>
      <Button size="sm" loading={busy} onPress={onMessage}>
        Message
      </Button>
      <Pressable onPress={onRemove} hitSlop={6} style={styles.remove} accessibilityLabel={`Remove ${name}`}>
        <UserMinus size={16} color={colors.muted} />
      </Pressable>
    </View>
  );
}

function EmptyList({ icon: Icon, title, body, action, onAction }: { icon: typeof MessagesSquare; title: string; body: string; action: string; onAction: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.keycap}>
        <Icon size={24} color="#e9e9f2" strokeWidth={1.75} />
      </View>
      <AppText variant="body" weight="medium">
        {title}
      </AppText>
      <AppText variant="sm" color={colors.muted} align="center" style={styles.emptyBody}>
        {body}
      </AppText>
      <Button size="sm" icon={UserPlus} onPress={onAction} style={styles.emptyBtn}>
        {action}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: GUTTER, paddingTop: 4, paddingBottom: 8, gap: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { flexDirection: "row", alignItems: "center", gap: 8 },
  conn: { width: 8, height: 8, borderRadius: 4 },
  compose: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  search: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  searchInput: { flex: 1, color: colors.ink, fontFamily: fonts.regular, fontSize: 16, paddingVertical: 0 },
  tabs: { flexDirection: "row", gap: 8 },
  alert: { minWidth: 16, height: 16, borderRadius: 8, backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  alertText: { fontSize: 10, lineHeight: 12 },
  strip: { gap: 12, paddingTop: 4 },
  stripItem: { width: 64, alignItems: "center", gap: 6 },
  stripName: { width: "100%", textAlign: "center" },
  reqHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  reqTitle: { flexDirection: "row", alignItems: "center", gap: 6 },
  reqRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  flex: { flex: 1 },
  loader: { marginTop: 48 },
  room: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: GUTTER, paddingVertical: 10 },
  pressed: { backgroundColor: "rgba(255,255,255,0.05)" },
  roomText: { flex: 1, minWidth: 0 },
  roomSub: { flexDirection: "row", minWidth: 0 },
  shrink: { flexShrink: 1 },
  unread: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accentBright },
  friend: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: GUTTER, paddingVertical: 8 },
  remove: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingHorizontal: 24, paddingVertical: 48, gap: 4 },
  keycap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a1540",
    borderWidth: 1,
    borderColor: "rgba(160,140,255,0.28)",
    marginBottom: 12,
  },
  emptyBody: { maxWidth: 260 },
  emptyBtn: { marginTop: 16, alignSelf: "center" },
});
