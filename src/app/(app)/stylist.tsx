import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { BadgeCheck, CheckCircle2, Scissors, Send } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Screen } from "@/components/layout/Screen";
import { StackHeader } from "@/components/layout/StackHeader";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { GradientText } from "@/components/ui/GradientText";
import { Notice } from "@/components/ui/Notice";
import { Photo } from "@/components/ui/Photo";
import { Sheet } from "@/components/ui/Sheet";
import { Loader } from "@/components/ui/States";
import { TextField } from "@/components/ui/TextField";
import { useAuth } from "@/features/auth/AuthProvider";
import { displayName } from "@/features/auth/types";
import { socialApi, type QueueLook, type StylistComment } from "@/features/social/api";
import { errorMessage } from "@/lib/api/client";
import { queryKeys } from "@/lib/queryKeys";
import { colors, radius } from "@/theme";

/** Verified stylists' review queue: looks shoppers asked a professional about. */
export default function StylistScreen() {
  const { token } = useAuth();
  const client = useQueryClient();
  const me = useQuery({ queryKey: queryKeys.stylistMe(token), queryFn: () => socialApi.myStylist(token!), enabled: Boolean(token) });
  const verified = me.data?.status === "VERIFIED";
  const queue = useQuery({ queryKey: queryKeys.stylistQueue(token), queryFn: () => socialApi.stylistQueue(token!), enabled: Boolean(token && verified) });
  const [open, setOpen] = useState<QueueLook | null>(null);

  if (me.isLoading) {
    return (
      <Screen header={<StackHeader title="Stylist" />}>
        <Loader />
      </Screen>
    );
  }

  if (!verified) {
    return (
      <Screen header={<StackHeader title="Stylist" />} contentStyle={styles.centerContent}>
        <View style={styles.gate}>
          <Scissors size={40} color={colors.muted} strokeWidth={1.5} />
          <AppText variant="title" align="center">
            For verified stylists
          </AppText>
          <AppText variant="sm" color={colors.muted} align="center">
            {me.data ? "Your stylist application is still being reviewed." : "Stylists and tailors can review shoppers' looks once verified."}
          </AppText>
          <Button onPress={() => router.replace({ pathname: "/profile", params: { tab: "stylist" } })} style={styles.center}>
            {me.data ? "View application" : "Apply to be a stylist"}
          </Button>
        </View>
      </Screen>
    );
  }

  const looks = queue.data ?? [];
  return (
    <Screen header={<StackHeader title="Review queue" />} onRefresh={() => queue.refetch()} refreshing={queue.isRefetching}>
      <View style={styles.titleBlock}>
        <View style={styles.row}>
          <BadgeCheck size={26} color={colors.accentBright} />
          <GradientText variant="h2">Review queue</GradientText>
        </View>
        <AppText variant="sm" color={colors.muted}>
          Looks shoppers want a professional opinion on. Suggest fit, drape, accessories or alterations.
        </AppText>
      </View>
      {queue.isError ? <Notice tone="error">{errorMessage(queue.error)}</Notice> : null}
      {queue.isLoading ? (
        <Loader />
      ) : looks.length === 0 ? (
        <AppText variant="sm" color={colors.muted} align="center" style={styles.empty}>
          No looks are waiting for review right now.
        </AppText>
      ) : (
        <View style={styles.grid}>
          {looks.map((l) => (
            <Pressable key={l.id} onPress={() => setOpen(l)} style={styles.tile}>
              <View style={styles.tileImage}>
                <Photo src={l.image} alt={l.name} style={StyleSheet.absoluteFill} />
                {l.reviewedByMe && (
                  <View style={styles.reviewed}>
                    <CheckCircle2 size={12} color={colors.canvas} />
                    <AppText variant="micro" color={colors.canvas}>
                      Reviewed
                    </AppText>
                  </View>
                )}
              </View>
              <View style={styles.tileBody}>
                <AppText variant="sm" numberOfLines={1}>
                  {l.name}
                </AppText>
                <AppText variant="xs" color={colors.muted} numberOfLines={1}>
                  {displayName(l.owner)} · {l.occasion} · {l.commentCount} comments
                </AppText>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      <Sheet open={Boolean(open)} onClose={() => setOpen(null)} title={open?.name ?? ""}>
        {open && (
          <ReviewPanel
            look={open}
            onPosted={() =>
              client.setQueryData<QueueLook[]>(queryKeys.stylistQueue(token), (q) => q?.map((l) => (l.id === open.id ? { ...l, reviewedByMe: true, commentCount: l.commentCount + 1 } : l)))
            }
          />
        )}
      </Sheet>
    </Screen>
  );
}

function ReviewPanel({ look, onPosted }: { look: QueueLook; onPosted: () => void }) {
  const { token } = useAuth();
  const comments = useQuery({ queryKey: queryKeys.stylistComments(token, look.id), queryFn: () => socialApi.stylistComments(token!, look.id), enabled: Boolean(token) });
  const client = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const pieces = Array.isArray(look.pieces) ? (look.pieces as string[]) : [];

  const post = async () => {
    if (!token || !text.trim()) return;
    setSending(true);
    setError("");
    try {
      const c = await socialApi.postStylistComment(token, look.id, text.trim());
      client.setQueryData<StylistComment[]>(queryKeys.stylistComments(token, look.id), (list) => [...(list ?? []), { ...c, stylist: { avatar: null, displayName: "You" } }]);
      setText("");
      onPosted();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.panel}>
      <View style={styles.panelImage}>
        <Photo src={look.image} alt={look.name} fit="contain" style={StyleSheet.absoluteFill} />
      </View>
      <AppText variant="sm" color={colors.subtle}>
        From <AppText variant="sm">{displayName(look.owner)}</AppText> · {look.occasion}
      </AppText>
      {pieces.length > 0 && (
        <AppText variant="xs" color={colors.muted}>
          Pieces: {pieces.join(", ")}
        </AppText>
      )}
      {comments.isLoading ? (
        <ActivityIndicator color={colors.accentBright} style={styles.left} />
      ) : (comments.data ?? []).length === 0 ? (
        <AppText variant="sm" color={colors.muted}>
          Be the first to give feedback.
        </AppText>
      ) : (
        comments.data!.map((c) => (
          <View key={c.id} style={styles.comment}>
            <AppText variant="xs">{c.stylist.displayName ?? "Stylist"}</AppText>
            <AppText variant="sm" color={colors.subtle}>
              {c.comment}
            </AppText>
          </View>
        ))
      )}
      <TextField size="md" multiline maxLength={1000} value={text} onChangeText={setText} placeholder="e.g. Pin the pallu higher and switch to a contrast gold blouse; add jhumkas." accessibilityLabel="Your feedback" />
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Button fullWidth icon={Send} loading={sending} disabled={!text.trim()} onPress={post}>
        Post feedback
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignSelf: "center" },
  centerContent: { flexGrow: 1, justifyContent: "center" },
  left: { alignSelf: "flex-start" },
  gate: { alignItems: "center", gap: 10, paddingHorizontal: 12 },
  titleBlock: { gap: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  empty: { marginTop: 40 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: { width: "47.8%", borderRadius: radius.card, overflow: "hidden", borderWidth: 1, borderColor: colors.lineSoft, backgroundColor: "rgba(255,255,255,0.02)" },
  tileImage: { aspectRatio: 3 / 4, backgroundColor: colors.glass },
  reviewed: { position: "absolute", top: 8, right: 8, flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, backgroundColor: "rgba(40,230,157,0.9)", paddingHorizontal: 8, paddingVertical: 2 },
  tileBody: { padding: 12, gap: 2 },
  panel: { gap: 12 },
  panelImage: { aspectRatio: 3 / 4, borderRadius: radius.card, overflow: "hidden", backgroundColor: colors.glass },
  comment: { gap: 4, borderRadius: radius.md, borderWidth: 1, borderColor: colors.lineSoft, backgroundColor: "rgba(255,255,255,0.02)", padding: 12 },
});
