import { Calendar, Film, Heart, MessageSquareText, Trash2 } from "lucide-react-native";
import { memo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Photo } from "@/components/ui/Photo";
import { OCCASIONS } from "@/data/studio-content";
import type { Look } from "@/features/workspace/api";
import { colors, radius } from "@/theme";

/** A saved look in the grid: occasion badge, like, media badges, pieces and delete. */
function LookCardImpl({ look, busy, onOpen, onToggleLike, onRemove }: { look: Look; busy: boolean; onOpen: () => void; onToggleLike: () => void; onRemove: () => void }) {
  const occasion = OCCASIONS.find((o) => o.id === look.occasion)?.label ?? look.occasion;
  return (
    <View style={styles.card}>
      <Pressable onPress={onOpen} style={styles.media} accessibilityLabel={`Open ${look.name}`}>
        <Photo src={look.image} alt={look.name} style={StyleSheet.absoluteFill} />
        <View style={styles.occasion}>
          <AppText variant="micro" weight="medium" color="#fff">
            {occasion}
          </AppText>
        </View>
        <Pressable onPress={onToggleLike} hitSlop={6} style={styles.like} accessibilityLabel={look.liked ? "Unlike look" : "Like look"}>
          <Heart size={16} color={look.liked ? "#f43f5e" : "rgba(255,255,255,0.8)"} fill={look.liked ? "#f43f5e" : "transparent"} />
        </Pressable>
        <View style={styles.badges} pointerEvents="none">
          {look.videoUrl ? (
            <View style={styles.badge}>
              <Film size={11} color="#fff" />
              <AppText variant="micro" color="#fff" style={styles.tiny}>
                Video
              </AppText>
            </View>
          ) : null}
          {look.poseVariants.length > 0 ? (
            <View style={styles.badge}>
              <AppText variant="micro" color="#fff" style={styles.tiny}>
                {look.poseVariants.length + 1} poses
              </AppText>
            </View>
          ) : null}
          {(look.stylistCommentCount ?? 0) > 0 ? (
            <View style={[styles.badge, styles.badgeAccent]}>
              <MessageSquareText size={11} color="#fff" />
              <AppText variant="micro" color="#fff" style={styles.tiny}>
                {look.stylistCommentCount}
              </AppText>
            </View>
          ) : null}
        </View>
      </Pressable>

      <View style={styles.body}>
        <AppText variant="sm" weight="semibold" numberOfLines={1}>
          {look.name}
        </AppText>
        <AppText variant="xs" color={look.pieces.length ? colors.subtle : colors.muted} numberOfLines={1}>
          {look.pieces.length ? look.pieces.join(" · ") : "Complete Outfit"}
        </AppText>
        <View style={styles.foot}>
          <View style={styles.date}>
            <Calendar size={12} color={colors.muted} />
            <AppText variant="micro" color={colors.muted}>
              {look.createdAt ? new Date(look.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Saved"}
            </AppText>
          </View>
          <Pressable onPress={onRemove} disabled={busy} hitSlop={6} style={styles.trash} accessibilityLabel={`Delete ${look.name}`}>
            {busy ? <ActivityIndicator size="small" color={colors.muted} /> : <Trash2 size={14} color={colors.muted} />}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export const LookCard = memo(LookCardImpl);

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: radius.card, overflow: "hidden", borderWidth: 1, borderColor: colors.line, backgroundColor: "rgba(14,14,36,0.7)" },
  media: { aspectRatio: 3 / 4, backgroundColor: "rgba(255,255,255,0.03)" },
  occasion: { position: "absolute", top: 10, left: 10, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 10, paddingVertical: 2 },
  like: { position: "absolute", top: 10, right: 10, width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line, backgroundColor: "rgba(0,0,0,0.6)" },
  badges: { position: "absolute", left: 10, bottom: 10, flexDirection: "row", flexWrap: "wrap", gap: 4 },
  badge: { flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 8, paddingVertical: 2 },
  badgeAccent: { backgroundColor: "rgba(127,98,246,0.9)" },
  tiny: { fontSize: 10 },
  body: { padding: 12, gap: 4 },
  foot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" },
  date: { flexDirection: "row", alignItems: "center", gap: 4 },
  trash: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
});
