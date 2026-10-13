import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { BadgeCheck, Film, MessageSquareText, Scissors, Share2, Shirt } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Screen } from "@/components/layout/Screen";
import { StackHeader } from "@/components/layout/StackHeader";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { Photo } from "@/components/ui/Photo";
import { ErrorState, Loader } from "@/components/ui/States";
import { POSES } from "@/data/look-edits";
import { useAuth } from "@/features/auth/AuthProvider";
import { LookShareSheet } from "@/features/share/ShareSheets";
import { socialApi } from "@/features/social/api";
import { workspaceApi } from "@/features/workspace/api";
import { useLooks, useLooksCache } from "@/features/workspace/hooks";
import { errorMessage } from "@/lib/api/client";
import { assetUrl } from "@/lib/api/config";
import { queryKeys } from "@/lib/queryKeys";
import { colors, radius } from "@/theme";

function LookVideo({ src }: { src: string }) {
  const player = useVideoPlayer(assetUrl(src), (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return <VideoView player={player} contentFit="contain" nativeControls fullscreenOptions={{ enable: true }} style={StyleSheet.absoluteFill} />;
}

/** A saved look with its poses and video, stylist feedback and sharing. */
export default function LookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const looks = useLooks();
  const cache = useLooksCache();
  const look = looks.data?.find((l) => l.id === id);
  const [view, setView] = useState("main");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sharing, setSharing] = useState(false);
  const comments = useQuery({ queryKey: queryKeys.stylistComments(token, id), queryFn: () => socialApi.stylistComments(token!, id), enabled: Boolean(token && id) });

  if (!look) {
    return (
      <Screen header={<StackHeader title="Look" />}>
        {looks.isLoading ? <Loader /> : <ErrorState message={looks.isError ? errorMessage(looks.error) : "This look isn't in your saved looks."} onRetry={() => looks.refetch()} />}
      </Screen>
    );
  }

  const toggleReview = async () => {
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      cache.upsert(await workspaceApi.requestStylistReview(token, look.id, !look.stylistReviewRequested));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const pose = look.poseVariants.find((p) => p.pose === view);
  const thumbs = [{ id: "main", label: "Look", img: look.image }, ...look.poseVariants.map((p) => ({ id: p.pose, label: POSES.find((x) => x.id === p.pose)?.label ?? p.pose, img: p.imageUrl }))];

  return (
    <Screen header={<StackHeader title={look.name} />}>
      <View style={styles.media}>
        {view === "video" && look.videoUrl ? <LookVideo src={look.videoUrl} /> : <Photo src={pose?.imageUrl ?? look.image} alt={look.name} fit="contain" style={StyleSheet.absoluteFill} />}
      </View>

      {(look.poseVariants.length > 0 || look.videoUrl) && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
          {thumbs.map((t) => (
            <Pressable key={t.id} onPress={() => setView(t.id)} style={styles.thumb} accessibilityState={{ selected: view === t.id }}>
              <View style={[styles.thumbImage, view === t.id ? styles.thumbOn : styles.thumbOff]}>
                <Photo src={t.img} alt="" style={StyleSheet.absoluteFill} />
              </View>
              <AppText variant="micro" color={colors.muted} numberOfLines={1}>
                {t.label}
              </AppText>
            </Pressable>
          ))}
          {look.videoUrl && (
            <Pressable onPress={() => setView("video")} style={[styles.videoThumb, view === "video" ? styles.thumbOn : styles.thumbOff]} accessibilityLabel="Video">
              <Film size={16} color={view === "video" ? "#fff" : colors.muted} />
              <AppText variant="micro" color={view === "video" ? "#fff" : colors.muted}>
                Video
              </AppText>
            </Pressable>
          )}
        </ScrollView>
      )}

      <View style={styles.actions}>
        <Button icon={Share2} onPress={() => setSharing(true)} style={styles.flex}>
          Share
        </Button>
        <Button variant="ghost" icon={Shirt} onPress={() => router.navigate({ pathname: "/drape", params: { image: look.image, title: look.name } })} style={styles.flex}>
          Open in Drape
        </Button>
      </View>

      <View style={styles.review}>
        <View style={styles.row}>
          <Scissors size={16} color={colors.accentBright} />
          <AppText variant="sm" weight="medium">
            Stylist review
          </AppText>
        </View>
        <AppText variant="xs" color={colors.muted}>
          {look.stylistReviewRequested ? "Verified stylists can see this look and leave suggestions." : "Ask a verified stylist or tailor to suggest how to restyle this look."}
        </AppText>
        <Button fullWidth size="sm" variant={look.stylistReviewRequested ? "ghost" : "primary"} loading={busy} onPress={toggleReview}>
          {look.stylistReviewRequested ? "Stop asking" : "Ask a stylist"}
        </Button>
        {error ? <Notice tone="error">{error}</Notice> : null}
      </View>

      <View style={styles.feedback}>
        <View style={styles.row}>
          <MessageSquareText size={14} color={colors.muted} />
          <AppText variant="label" color={colors.muted}>
            Feedback
          </AppText>
        </View>
        {comments.isLoading ? (
          <ActivityIndicator color={colors.accentBright} style={styles.left} />
        ) : (comments.data ?? []).length === 0 ? (
          <AppText variant="sm" color={colors.muted}>
            No stylist feedback yet.
          </AppText>
        ) : (
          comments.data!.map((c) => (
            <View key={c.id} style={styles.comment}>
              <View style={styles.row}>
                <BadgeCheck size={14} color={colors.accentBright} />
                <AppText variant="xs">{c.stylist.displayName ?? "Stylist"}</AppText>
                {c.stylist.city ? (
                  <AppText variant="xs" color={colors.muted}>
                    · {c.stylist.city}
                  </AppText>
                ) : null}
              </View>
              <AppText variant="sm" color={colors.subtle}>
                {c.comment}
              </AppText>
            </View>
          ))
        )}
      </View>

      <LookShareSheet open={sharing} onClose={() => setSharing(false)} lookId={look.id} image={look.image} video={look.videoUrl} name={look.name} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, alignSelf: "auto" },
  left: { alignSelf: "flex-start" },
  media: { aspectRatio: 3 / 4, borderRadius: radius.card, overflow: "hidden", backgroundColor: colors.glass },
  thumbs: { gap: 8 },
  thumb: { width: 56, alignItems: "center", gap: 4 },
  thumbImage: { width: 56, aspectRatio: 3 / 4, borderRadius: 8, overflow: "hidden", borderWidth: 1 },
  thumbOn: { borderColor: colors.accentBright, borderWidth: 2 },
  thumbOff: { borderColor: colors.line, opacity: 0.8 },
  videoThumb: { width: 56, height: 75, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  actions: { flexDirection: "row", gap: 8 },
  review: { gap: 10, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: "rgba(255,255,255,0.02)", padding: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  feedback: { gap: 8 },
  comment: { gap: 4, borderRadius: radius.md, borderWidth: 1, borderColor: colors.lineSoft, backgroundColor: "rgba(255,255,255,0.02)", padding: 12 },
});
