import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Heart, MessageCircle, Sparkles } from "lucide-react-native";
import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Photo } from "@/components/ui/Photo";
import { colors, radius } from "@/theme";
import { drapeParams, type Brand, type BrandPost } from "../model";

/** Grid view tile: the web's hover overlay is always visible on touch screens. */
function PostGridTileImpl({ post, brand }: { post: BrandPost; brand: Brand }) {
  return (
    <Pressable onPress={() => router.push({ pathname: "/post/[id]", params: { id: post.id } })} style={styles.tile} accessibilityLabel={`${brand.name}: ${post.caption}`}>
      <Photo src={post.image} alt={post.caption} tone={post.tone} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.92)"]} locations={[0.35, 0.6, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <View style={styles.top}>
        <View style={styles.logo}>
          <Photo src={brand.image} alt={brand.name} initials style={StyleSheet.absoluteFill} />
        </View>
        <AppText variant="micro" weight="semibold" color="#fff" numberOfLines={1} style={styles.flex}>
          {brand.name}
        </AppText>
      </View>
      <View style={styles.bottom}>
        <AppText variant="micro" color="rgba(255,255,255,0.9)" numberOfLines={2}>
          {post.caption}
        </AppText>
        <View style={styles.row}>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Heart size={13} color="#fff" fill="#fff" />
              <AppText variant="micro" weight="medium" color="#fff">
                {post.likes}
              </AppText>
            </View>
            <View style={styles.stat}>
              <MessageCircle size={13} color="#fff" fill="#fff" />
              <AppText variant="micro" weight="medium" color="#fff">
                {post.commentsCount}
              </AppText>
            </View>
          </View>
          <Pressable onPress={() => router.push(drapeParams(post.image, brand.name, post.caption))} hitSlop={6} accessibilityLabel="Try on">
            <LinearGradient colors={["#6645eb", "#1fc5db"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.try}>
              <Sparkles size={11} color="#fff" />
              <AppText variant="micro" weight="semibold" color="#fff">
                Try On
              </AppText>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

export const PostGridTile = memo(PostGridTileImpl);

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    aspectRatio: 4 / 5,
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(13,12,29,0.6)",
  },
  top: { position: "absolute", top: 10, left: 10, right: 10, flexDirection: "row", alignItems: "center", gap: 6 },
  logo: { width: 24, height: 24, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  flex: { flex: 1 },
  bottom: { position: "absolute", left: 10, right: 10, bottom: 10, gap: 6 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stats: { flexDirection: "row", gap: 10 },
  stat: { flexDirection: "row", alignItems: "center", gap: 3 },
  try: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
});
