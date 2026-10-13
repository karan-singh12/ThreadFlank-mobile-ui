import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock, Inbox, Search, Sparkles, UserPlus, Users } from "lucide-react-native";
import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Avatar } from "@/components/ui/Avatar";
import { TabSwitch } from "@/components/ui/Chip";
import { Notice } from "@/components/ui/Notice";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/features/auth/AuthProvider";
import { errorMessage } from "@/lib/api/client";
import { queryKeys } from "@/lib/queryKeys";
import { colors, fonts, radius } from "@/theme";
import { chatApi } from "../api";
import { friendName, useFriends } from "../hooks";

type Tab = "search" | "suggestions" | "requests";

function PersonRow({ name, sub, avatar, action }: { name: string; sub: string; avatar: string | null; action: ReactNode }) {
  return (
    <View style={styles.person}>
      <Avatar name={name} src={avatar} size={40} />
      <View style={styles.personText}>
        <AppText variant="sm" weight="medium" numberOfLines={1}>
          {name}
        </AppText>
        <AppText variant="xs" color={colors.muted} numberOfLines={1}>
          {sub}
        </AppText>
      </View>
      {action}
    </View>
  );
}

function Pill({ tone, icon, label }: { tone: "green" | "violet" | "muted"; icon?: ReactNode; label: string }) {
  const bg = tone === "green" ? "rgba(34,197,94,0.1)" : tone === "violet" ? "rgba(102,69,235,0.2)" : "rgba(255,255,255,0.05)";
  const fg = tone === "green" ? "#4ade80" : tone === "violet" ? colors.accentBright : colors.muted;
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      {icon}
      <AppText variant="xs" weight="medium" color={fg}>
        {label}
      </AppText>
    </View>
  );
}

function ActionBtn({ label, onPress, busy, primary, icon }: { label: string; onPress: () => void; busy?: boolean; primary?: boolean; icon?: ReactNode }) {
  return (
    <Pressable onPress={onPress} disabled={busy} style={({ pressed }) => [styles.btn, primary ? styles.btnPrimary : styles.btnGhost, (busy || pressed) && styles.dim]}>
      {busy ? <ActivityIndicator size="small" color="#fff" /> : icon}
      <AppText variant="xs" weight="semibold" color={primary ? "#fff" : colors.subtle}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** Find people by username or email, see suggestions, and answer friend requests. */
export function AddFriendSheet({ open, onClose, initialTab = "search" }: { open: boolean; onClose: () => void; initialTab?: Tab }) {
  const { token, user } = useAuth();
  const client = useQueryClient();
  const toast = useToast();
  const { data } = useFriends();
  const friends = data?.friends ?? [];
  const incoming = data?.incoming ?? [];

  const [tab, setTab] = useState<Tab>(initialTab);
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setTab(initialTab);
    else {
      setTerm("");
      setError(null);
    }
  }, [open, initialTab]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 300);
    return () => clearTimeout(t);
  }, [term]);

  const search = useQuery({
    queryKey: ["user-search", token, debounced],
    queryFn: async () => (await chatApi.searchChat(token!, debounced)).users,
    enabled: Boolean(token && open && debounced),
  });
  const suggestions = useQuery({ queryKey: queryKeys.suggestions(token), queryFn: () => chatApi.fetchFriendSuggestions(token!), enabled: Boolean(token && open) });

  const refresh = () => {
    void client.invalidateQueries({ queryKey: queryKeys.friends(token) });
    void client.invalidateQueries({ queryKey: queryKeys.conversations(token) });
    void suggestions.refetch();
  };

  const sendRequest = async (identifier: string, key: string) => {
    if (!token || !identifier.trim()) return;
    setBusy(key);
    setError(null);
    try {
      const res = await chatApi.sendFriendRequest(token, identifier.trim());
      setSent((s) => ({ ...s, [key]: true }));
      toast.show(res.accepted ? "Friend added instantly!" : "Friend request sent!");
      refresh();
    } catch (e) {
      setError(errorMessage(e, "Failed to send friend request"));
    } finally {
      setBusy(null);
    }
  };

  const respond = async (requestId: string, status: "ACCEPTED" | "REJECTED") => {
    if (!token) return;
    setBusy(requestId);
    setError(null);
    try {
      await chatApi.respondToFriendRequest(token, requestId, status);
      toast.show(status === "ACCEPTED" ? "Friend request accepted!" : "Friend request declined.");
      refresh();
    } catch (e) {
      setError(errorMessage(e, "Failed to update request"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add Friends & Stylists" subtitle="Connect, share outfits, and get real-time feedback" full maxHeight={0.88}>
      <TabSwitch
        value={tab}
        onChange={setTab}
        options={[
          { id: "search", label: "Search", icon: Search },
          { id: "suggestions", label: `Suggested (${suggestions.data?.length ?? 0})`, icon: Sparkles },
          { id: "requests", label: incoming.length ? `Requests (${incoming.length})` : "Requests", icon: Inbox },
        ]}
      />

      {error && <Notice tone="error">{error}</Notice>}

      {tab === "search" && (
        <View style={styles.section}>
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Search size={16} color={colors.muted} />
              <TextInput
                value={term}
                onChangeText={setTerm}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Enter username or email..."
                placeholderTextColor="rgba(141,144,165,0.6)"
                selectionColor={colors.accentBright}
                returnKeyType="send"
                onSubmitEditing={() => sendRequest(term, term.trim())}
                style={styles.searchInput}
              />
            </View>
            <ActionBtn label="Send" primary busy={busy === term.trim() && Boolean(term.trim())} onPress={() => sendRequest(term, term.trim())} icon={<UserPlus size={14} color="#fff" />} />
          </View>

          {search.isFetching ? (
            <View style={styles.state}>
              <ActivityIndicator color={colors.accentBright} />
              <AppText variant="xs" color={colors.muted}>
                Searching users across Threadflank...
              </AppText>
            </View>
          ) : (search.data?.length ?? 0) > 0 ? (
            search.data!.map((u) => {
              const isSelf = u.id === user?.id;
              const isFriend = friends.some((f) => f.id === u.id);
              const isSent = sent[u.id];
              return (
                <PersonRow
                  key={u.id}
                  name={friendName(u)}
                  sub={u.email}
                  avatar={u.avatar}
                  action={
                    isSelf ? (
                      <Pill tone="muted" label="You" />
                    ) : isFriend ? (
                      <Pill tone="green" label="Friends" icon={<Check size={12} color="#4ade80" />} />
                    ) : isSent ? (
                      <Pill tone="violet" label="Sent" icon={<Clock size={12} color={colors.accentBright} />} />
                    ) : (
                      <ActionBtn label="Add" busy={busy === u.id} onPress={() => sendRequest(u.username || u.email, u.id)} icon={<UserPlus size={14} color={colors.subtle} />} />
                    )
                  }
                />
              );
            })
          ) : debounced ? (
            <View style={styles.state}>
              <AppText variant="xs" color={colors.muted} align="center">
                No matching user profile found directly for “{debounced}”.
              </AppText>
              <AppText variant="xs" color={colors.subtle} align="center">
                Tap Send above to deliver a direct invite to this email or username.
              </AppText>
            </View>
          ) : (
            <View style={styles.state}>
              <View style={styles.stateIcon}>
                <Search size={20} color={colors.muted} />
              </View>
              <AppText variant="xs" weight="medium">
                Type a username or email
              </AppText>
              <AppText variant="micro" color={colors.muted} align="center">
                Search friends, fashion creators, and stylists to start messaging
              </AppText>
            </View>
          )}
        </View>
      )}

      {tab === "suggestions" && (
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <AppText variant="xs" color={colors.muted}>
              People you may know based on style activity
            </AppText>
            <Pressable onPress={() => suggestions.refetch()} hitSlop={8}>
              <AppText variant="micro" color={colors.accentBright}>
                Refresh
              </AppText>
            </Pressable>
          </View>
          {suggestions.isLoading ? (
            <View style={styles.state}>
              <ActivityIndicator color={colors.accentBright} />
              <AppText variant="xs" color={colors.muted}>
                Finding suggestions for you...
              </AppText>
            </View>
          ) : (suggestions.data?.length ?? 0) > 0 ? (
            suggestions.data!.map((s) => (
              <PersonRow
                key={s.id}
                name={friendName(s)}
                sub={s.bio || s.email}
                avatar={s.avatar}
                action={
                  sent[s.id] ? (
                    <Pill tone="violet" label="Sent" icon={<Check size={12} color={colors.accentBright} />} />
                  ) : (
                    <ActionBtn label="Add Friend" primary busy={busy === s.id} onPress={() => sendRequest(s.username || s.email, s.id)} icon={<UserPlus size={14} color="#fff" />} />
                  )
                }
              />
            ))
          ) : (
            <View style={styles.state}>
              <View style={styles.stateIcon}>
                <Users size={20} color={colors.muted} />
              </View>
              <AppText variant="xs" weight="medium">
                No suggestions right now
              </AppText>
              <AppText variant="micro" color={colors.muted} align="center">
                Use the Search tab to connect with anyone by email or username
              </AppText>
            </View>
          )}
        </View>
      )}

      {tab === "requests" && (
        <View style={styles.section}>
          {incoming.length > 0 ? (
            incoming.map((req) => {
              const name = req.sender ? friendName(req.sender) : "Stylist";
              return (
                <PersonRow
                  key={req.id}
                  name={name}
                  sub="Sent you a friend request"
                  avatar={req.sender?.avatar ?? null}
                  action={
                    <View style={styles.respond}>
                      <ActionBtn label="Accept" primary busy={busy === req.id} onPress={() => respond(req.id, "ACCEPTED")} />
                      <ActionBtn label="Decline" busy={busy === req.id} onPress={() => respond(req.id, "REJECTED")} />
                    </View>
                  }
                />
              );
            })
          ) : (
            <View style={styles.state}>
              <View style={styles.stateIcon}>
                <Inbox size={20} color={colors.muted} />
              </View>
              <AppText variant="xs" weight="medium">
                No pending requests
              </AppText>
              <AppText variant="micro" color={colors.muted} align="center">
                When someone adds you, their request appears here
              </AppText>
            </View>
          )}
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  searchRow: { flexDirection: "row", gap: 8 },
  searchBox: {
    flex: 1,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.glass,
  },
  searchInput: { flex: 1, color: colors.ink, fontFamily: fonts.regular, fontSize: 15, paddingVertical: 0 },
  person: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  personText: { flex: 1, minWidth: 0 },
  pill: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  btn: { height: 32, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, borderRadius: 12 },
  btnPrimary: { backgroundColor: colors.accent },
  btnGhost: { backgroundColor: "rgba(255,255,255,0.1)" },
  dim: { opacity: 0.6 },
  respond: { flexDirection: "row", gap: 6 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  state: { alignItems: "center", gap: 8, paddingVertical: 32, paddingHorizontal: 12 },
  stateIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.05)" },
});
