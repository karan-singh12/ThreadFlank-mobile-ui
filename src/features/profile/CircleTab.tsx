import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Check, LogOut, Mail, Pencil, Shirt, Trash2, UserPlus, Users, X } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { GlassCard } from "@/components/ui/GlassCard";
import { Notice } from "@/components/ui/Notice";
import { Photo } from "@/components/ui/Photo";
import { Select } from "@/components/ui/Select";
import { Sheet } from "@/components/ui/Sheet";
import { Loader } from "@/components/ui/States";
import { TextField } from "@/components/ui/TextField";
import { RELATIONS, profileContent as copy } from "@/data/studio-content";
import { useAuth } from "@/features/auth/AuthProvider";
import { displayName } from "@/features/auth/types";
import { chatApi } from "@/features/messages/api";
import { useCircle, type CircleMember } from "@/features/workspace/hooks";
import { errorMessage } from "@/lib/api/client";
import { queryKeys } from "@/lib/queryKeys";
import { colors, radius } from "@/theme";
import { BodyForm, bodySummary, EMPTY_BODY, toNumber, type BodyValues } from "./BodyForm";

const RELATION_OPTIONS = RELATIONS.map((r) => ({ value: r, label: r }));
const str = (n: number | null | undefined) => (n ? String(n) : "");

/** Your Twin Circle: managed profiles for family without an account, and friends linked by invite. */
export function CircleTab() {
  const circle = useCircle();
  const [editing, setEditing] = useState<CircleMember | "new" | null>(null);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const { members, limit, memberships } = circle;
  const full = members.length >= limit;
  const invites = memberships.filter((m) => m.status === "INVITED");
  const joined = memberships.filter((m) => m.status === "ACTIVE");

  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusy(id);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const remove = (m: CircleMember) =>
    Alert.alert(`${copy.removeMember} ${m.name}?`, "They'll be removed from your Twin Circle.", [
      { text: "Cancel", style: "cancel" },
      { text: copy.removeMember, style: "destructive", onPress: () => act(m.id, () => circle.removeMember(m.id)) },
    ]);

  if (circle.loading) return <Loader />;

  return (
    <View style={styles.wrap}>
      {invites.length > 0 && (
        <GlassCard>
          <View style={styles.row}>
            <Mail size={16} color={colors.accentBright} />
            <AppText variant="sm" weight="medium">
              Circle invites
            </AppText>
          </View>
          {invites.map((inv) => (
            <View key={inv.memberId} style={styles.invite}>
              <AppText variant="sm" color={colors.subtle}>
                <AppText variant="sm">{displayName(inv.owner)}</AppText> invited you to their Twin Circle{inv.relation ? ` as ${inv.relation.toLowerCase()}` : ""}.
              </AppText>
              <View style={styles.row}>
                <Button size="sm" icon={Check} loading={busy === inv.memberId} onPress={() => act(inv.memberId, () => circle.respondInvite(inv.memberId, true))}>
                  Join
                </Button>
                <Button size="sm" variant="ghost" icon={X} disabled={busy === inv.memberId} onPress={() => act(inv.memberId, () => circle.respondInvite(inv.memberId, false))}>
                  Decline
                </Button>
              </View>
            </View>
          ))}
        </GlassCard>
      )}

      <View style={styles.head}>
        <AppText variant="title">{copy.circleTitle}</AppText>
        <AppText variant="sm" color={colors.muted}>
          {copy.circleDescription(limit)}
        </AppText>
        <View style={styles.row}>
          <Button size="sm" variant="ghost" icon={Users} disabled={full} onPress={() => setInviting(true)}>
            Invite a friend
          </Button>
          <Button size="sm" icon={UserPlus} disabled={full} onPress={() => setEditing("new")}>
            {copy.addMember}
          </Button>
        </View>
      </View>
      {full && <Notice>{copy.circleFull(limit)}</Notice>}
      {error ? <Notice tone="error">{error}</Notice> : null}

      {members.map((m) => (
        <GlassCard key={m.id} padding={14}>
          <View style={styles.member}>
            <View style={styles.memberPhoto}>
              {m.photo ? (
                <Photo src={m.photo} alt={m.name} style={StyleSheet.absoluteFill} />
              ) : (
                <AppText style={styles.memberInitial} color={colors.muted}>
                  {m.name.charAt(0)}
                </AppText>
              )}
            </View>
            <View style={styles.flex}>
              <AppText variant="body" weight="medium" numberOfLines={1}>
                {m.name}
              </AppText>
              <View style={styles.tags}>
                <AppText variant="xs" color={colors.accentBright}>
                  {m.relation}
                </AppText>
                {m.kind === "USER" && (
                  <View style={styles.tag}>
                    <AppText variant="micro" color={colors.subtle}>
                      linked account
                    </AppText>
                  </View>
                )}
                {m.status === "INVITED" && (
                  <View style={[styles.tag, styles.tagAmber]}>
                    <AppText variant="micro" color="#fde68a">
                      invite sent
                    </AppText>
                  </View>
                )}
              </View>
              <AppText variant="xs" color={colors.muted}>
                {bodySummary(m) || "—"}
              </AppText>
              <View style={styles.memberActions}>
                {m.status === "ACTIVE" && (
                  <Pressable onPress={() => router.navigate({ pathname: "/drape", params: { person: m.id } })} style={styles.small}>
                    <Shirt size={14} color="#fff" />
                    <AppText variant="xs" color="#fff">
                      {copy.drapeOn}
                    </AppText>
                  </Pressable>
                )}
                <Pressable onPress={() => setEditing(m)} hitSlop={6} style={styles.icon} accessibilityLabel={`${copy.editMember} ${m.name}`}>
                  <Pencil size={14} color={colors.muted} />
                </Pressable>
                <Pressable onPress={() => remove(m)} disabled={busy === m.id} hitSlop={6} style={styles.icon} accessibilityLabel={`${copy.removeMember} ${m.name}`}>
                  {busy === m.id ? <ActivityIndicator size="small" color={colors.muted} /> : <Trash2 size={14} color={colors.muted} />}
                </Pressable>
              </View>
            </View>
          </View>
        </GlassCard>
      ))}
      {!full && (
        <Pressable onPress={() => setEditing("new")} style={styles.addTile}>
          <UserPlus size={24} strokeWidth={1.5} color={colors.muted} />
          <AppText variant="sm" color={colors.muted}>
            {members.length ? copy.addMember : copy.circleEmpty}
          </AppText>
        </Pressable>
      )}

      {joined.length > 0 && (
        <View style={styles.joined}>
          <AppText variant="sm" weight="medium">
            Circles you&apos;re in
          </AppText>
          {joined.map((m) => (
            <View key={m.memberId} style={styles.joinedRow}>
              <Avatar name={displayName(m.owner)} src={m.owner?.avatar} size={36} />
              <AppText variant="sm" color={colors.subtle} numberOfLines={1} style={styles.flex}>
                <AppText variant="sm">{displayName(m.owner)}</AppText>&apos;s circle
              </AppText>
              <Pressable onPress={() => act(m.circleId, () => circle.leave(m.circleId))} style={styles.row} hitSlop={6}>
                <LogOut size={14} color={colors.muted} />
                <AppText variant="xs" color={colors.muted}>
                  Leave
                </AppText>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <MemberSheet
        editing={editing}
        onClose={() => setEditing(null)}
        onSave={async (input) => {
          if (editing === "new") await circle.addProfile(input);
          else if (editing) await circle.updateMember(editing.id, input);
          setEditing(null);
        }}
      />
      <InviteSheet
        open={inviting}
        existing={new Set(members.map((m) => m.userId).filter((id): id is string => Boolean(id)))}
        onClose={() => setInviting(false)}
        onInvite={async (userId, relation) => {
          await circle.invite(userId, relation);
          setInviting(false);
        }}
      />
    </View>
  );
}

type MemberInput = { name: string; relation: string; gender?: string; age?: number; heightCm?: number; weightKg?: number; skinTone?: string; photo?: string };

/** Add or edit a circle member: name, relation, selfie and body details, plus consent. */
function MemberSheet({ editing, onClose, onSave }: { editing: CircleMember | "new" | null; onClose: () => void; onSave: (m: MemberInput) => Promise<void> }) {
  const initial = editing && editing !== "new" ? editing : null;
  return (
    <Sheet open={editing !== null} onClose={onClose} title={editing === "new" ? copy.addMember : copy.editMember}>
      {editing !== null && <MemberForm key={initial?.id ?? "new"} initial={initial} onSave={onSave} />}
    </Sheet>
  );
}

function MemberForm({ initial, onSave }: { initial: CircleMember | null; onSave: (m: MemberInput) => Promise<void> }) {
  const linked = initial?.kind === "USER";
  const [name, setName] = useState(initial?.name ?? "");
  const [relation, setRelation] = useState<string>(initial?.relation ?? RELATIONS[0]);
  const [consent, setConsent] = useState(Boolean(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [body, setBody] = useState<BodyValues>(() =>
    initial ? { photo: initial.photo ?? "", gender: initial.gender, age: str(initial.age), heightCm: str(initial.heightCm), weightKg: str(initial.weightKg), skinTone: initial.skinTone ?? "" } : EMPTY_BODY
  );

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      await onSave({
        name: name.trim(),
        relation,
        gender: body.gender || undefined,
        age: toNumber(body.age),
        heightCm: toNumber(body.heightCm),
        weightKg: toNumber(body.weightKg),
        skinTone: body.skinTone || undefined,
        photo: body.photo || undefined,
      });
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
    }
  };

  return (
    <View style={styles.form}>
      <View style={styles.twoCol}>
        <TextField size="md" capsLabel label={copy.memberName} maxLength={40} value={name} onChangeText={setName} editable={!linked} containerStyle={styles.flex} />
        <Select label={copy.relation} value={relation} onChange={setRelation} options={RELATION_OPTIONS} style={styles.flex} />
      </View>
      {linked ? (
        <Notice>{`${name} manages their own selfie and body details from their account.`}</Notice>
      ) : (
        <>
          <BodyForm value={body} onChange={setBody} />
          <Checkbox checked={consent} onChange={setConsent} label={copy.consent} />
        </>
      )}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Button fullWidth size="lg" loading={saving} disabled={!name.trim() || (!linked && !consent)} onPress={submit}>
        {initial ? "Save" : copy.addMember}
      </Button>
    </View>
  );
}

/** Invite a friend (an existing account) into your circle with a relation. */
function InviteSheet({ open, existing, onClose, onInvite }: { open: boolean; existing: Set<string>; onClose: () => void; onInvite: (userId: string, relation: string) => Promise<void> }) {
  const { token } = useAuth();
  const friends = useQuery({ queryKey: queryKeys.friends(token).concat("invite"), queryFn: () => chatApi.fetchFriendsList(token!), enabled: Boolean(open && token) });
  const [picked, setPicked] = useState<string | null>(null);
  const [relation, setRelation] = useState<string>("Friend");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const available = (friends.data ?? []).filter((f) => !existing.has(f.id));

  const send = async () => {
    if (!picked) return;
    setSending(true);
    setError("");
    try {
      await onInvite(picked, relation);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Invite a friend to your circle"
      footer={
        <Button fullWidth icon={Mail} loading={sending} disabled={!picked} onPress={send}>
          Send invite
        </Button>
      }
    >
      <AppText variant="sm" color={colors.muted}>
        Linked friends keep their own twin, can share wardrobes for borrowing, and join your events and Get Ready With Me sessions.
      </AppText>
      {friends.isLoading ? (
        <ActivityIndicator color={colors.accentBright} />
      ) : available.length === 0 ? (
        <Notice>
          <View style={styles.noticeBody}>
            <AppText variant="sm" color={colors.subtle}>
              No friends to invite yet.
            </AppText>
            <Pressable
              onPress={() => {
                onClose();
                router.navigate("/messages");
              }}
            >
              <AppText variant="sm" color={colors.accentBright}>
                Add friends in Messages
              </AppText>
            </Pressable>
          </View>
        </Notice>
      ) : (
        available.map((f) => {
          const on = picked === f.id;
          return (
            <Pressable key={f.id} onPress={() => setPicked(f.id)} accessibilityRole="radio" accessibilityState={{ selected: on }} style={[styles.friend, on && styles.friendOn]}>
              <Avatar name={displayName(f)} src={f.avatar} size={36} />
              <AppText variant="sm" numberOfLines={1} style={styles.flex}>
                {displayName(f)}
              </AppText>
              {on && <Check size={16} color={colors.accentBright} />}
            </Pressable>
          );
        })
      )}
      <Select label={copy.relation} value={relation} onChange={setRelation} options={RELATION_OPTIONS} />
      {error ? <Notice tone="error">{error}</Notice> : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  flex: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  invite: { gap: 8, marginTop: 12 },
  head: { gap: 8 },
  member: { flexDirection: "row", gap: 14 },
  memberPhoto: { width: 88, aspectRatio: 3 / 4, borderRadius: radius.md, overflow: "hidden", backgroundColor: colors.glass, alignItems: "center", justifyContent: "center" },
  memberInitial: { fontSize: 26, lineHeight: 32 },
  tags: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginVertical: 2 },
  tag: { borderRadius: 999, backgroundColor: "rgba(255,255,255,0.08)", paddingHorizontal: 6, paddingVertical: 1 },
  tagAmber: { backgroundColor: "rgba(251,191,36,0.15)" },
  memberActions: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  small: { height: 32, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)" },
  icon: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  addTile: { minHeight: 120, alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radius.panel, borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(255,255,255,0.15)" },
  joined: { gap: 10 },
  joinedRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.lineSoft, backgroundColor: "rgba(255,255,255,0.02)", paddingHorizontal: 14, paddingVertical: 10 },
  form: { gap: 18 },
  twoCol: { flexDirection: "row", gap: 12 },
  noticeBody: { gap: 4 },
  friend: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 8 },
  friendOn: { backgroundColor: "rgba(102,69,235,0.25)" },
});
