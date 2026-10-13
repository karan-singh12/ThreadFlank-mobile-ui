import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { BadgeCheck, Bookmark, ExternalLink, Heart, Link2, MessageCircle, MoreHorizontal, Send, ShoppingBag, Sparkles, Tag } from "lucide-react-native";
import { memo, useRef, useState } from "react";
import { Animated, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Photo";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { discoverContent as copy } from "@/data/app-content";
import { useAuth } from "@/features/auth/AuthProvider";
import { PostShareSheet } from "@/features/share/ShareSheets";
import { errorMessage } from "@/lib/api/client";
import { WEB_ORIGIN } from "@/lib/api/config";
import { timeAgo } from "@/lib/format";
import { colors, GUTTER, radius } from "@/theme";
import { discoverApi, type PostComment } from "../api";
import { drapeParams, type Brand, type BrandPost } from "../model";
import { CommentsSheet } from "./CommentsSheet";
import { StockPanel } from "./StockPanel";

const PREVIEW_COMMENTS = 2;
const DOUBLE_TAP_MS = 280;

function PostCardImpl({ post, brand }: { post: BrandPost; brand: Brand }) {
  const { token } = useAuth();
  const toast = useToast();
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [saved, setSaved] = useState(post.saved);
  const [comments, setComments] = useState<PostComment[]>(post.comments);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [commentsOpen, setCommentsOpen] = useState<false | "read" | "write">(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const likeBusy = useRef(false);
  const saveBusy = useRef(false);
  const lastTap = useRef(0);
  const burst = useRef(new Animated.Value(0)).current;

  const visible = comments.slice(-PREVIEW_COMMENTS);
  const hiddenCount = Math.max(0, commentsCount - visible.length);
  const handle = brand.handle.startsWith("@") ? brand.handle.slice(1) : brand.handle;
  const tryOn = () => router.push(drapeParams(post.image, brand.name, post.caption));

  const playBurst = () => {
    burst.setValue(0);
    Animated.sequence([
      Animated.spring(burst, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 12 }),
      Animated.timing(burst, { toValue: 0, duration: 260, delay: 260, useNativeDriver: true }),
    ]).start();
  };

  /** Optimistic like; the server's answer (and count) wins, and a failure puts it back. */
  const toggleLike = async () => {
    if (likeBusy.current || !token) return;
    likeBusy.current = true;
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    if (next) {
      playBurst();
      if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
    try {
      const res = await discoverApi.toggleLike(token, post.id);
      setLiked(res.liked);
      setLikes(res.likesCount);
    } catch (e) {
      setLiked(!next);
      setLikes((n) => n - (next ? 1 : -1));
      toast.show(errorMessage(e), { tone: "error" });
    } finally {
      likeBusy.current = false;
    }
  };

  const onImagePress = () => {
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      lastTap.current = 0;
      if (liked) playBurst();
      else void toggleLike();
    } else {
      lastTap.current = now;
    }
  };

  const toggleSave = async () => {
    if (saveBusy.current || !token) return;
    saveBusy.current = true;
    const next = !saved;
    setSaved(next);
    try {
      const res = await discoverApi.toggleSave(token, post.id);
      setSaved(res.saved);
      toast.show(res.saved ? copy.savedNote : copy.unsavedNote, res.saved ? { action: { label: `${copy.openSaved} →`, onPress: () => router.navigate("/saved") } } : undefined);
    } catch (e) {
      setSaved(!next);
      toast.show(errorMessage(e), { tone: "error" });
    } finally {
      saveBusy.current = false;
    }
  };

  const copyLink = async () => {
    setMenuOpen(false);
    await Clipboard.setStringAsync(`${WEB_ORIGIN}/p/${post.id}`);
    toast.show(copy.linkCopied);
  };

  const heartScale = burst.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <LinearGradient colors={["#c4b1fa", "#7b61f0"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ring}>
          <View style={styles.ringInner}>
            <View style={styles.ringClip}>
              <Photo src={brand.image} alt={brand.name} tone={brand.tone} initials style={StyleSheet.absoluteFill} />
            </View>
          </View>
        </LinearGradient>
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <AppText variant="sm" weight="medium" numberOfLines={1} style={styles.shrink}>
              {brand.name}
            </AppText>
            {brand.verified && <BadgeCheck size={16} color="#fff" fill={colors.accent} accessibilityLabel="Verified" />}
          </View>
          <AppText variant="xs" color={colors.muted} numberOfLines={1}>
            {brand.handle} · {post.postedAgo}
          </AppText>
        </View>
        <View style={styles.category}>
          <AppText variant="micro" color={colors.subtle}>
            {post.category}
          </AppText>
        </View>
        <Pressable onPress={() => setMenuOpen(true)} hitSlop={8} style={styles.more} accessibilityLabel="More options">
          <MoreHorizontal size={20} color={colors.muted} />
        </Pressable>
      </View>

      <Pressable onPress={onImagePress} style={styles.media} accessibilityLabel={post.caption} accessibilityHint="Double tap to like">
        <Photo src={post.image} alt={post.caption} tone={post.tone} style={StyleSheet.absoluteFill} />
        <Animated.View pointerEvents="none" style={[styles.burst, { opacity: burst, transform: [{ scale: heartScale }] }]}>
          <Heart size={96} color="#fff" fill="#fff" />
        </Animated.View>

        {post.tags.length > 0 && (
          <Pressable onPress={() => setTagsOpen((v) => !v)} style={styles.tagBtn} accessibilityLabel={copy.shopLabel} accessibilityState={{ expanded: tagsOpen }}>
            <Tag size={16} color="#fff" />
          </Pressable>
        )}
        {tagsOpen && (
          <View style={styles.tagList} pointerEvents="none">
            {post.tags.map((t) => (
              <View key={t.name} style={styles.tagItem}>
                <ShoppingBag size={14} color={colors.cyan} />
                <AppText variant="xs" color="#fff">
                  {t.name}
                </AppText>
                <AppText variant="xs" color={colors.green}>
                  {t.price}
                </AppText>
              </View>
            ))}
          </View>
        )}
      </Pressable>

      <View style={styles.body}>
        <View style={styles.actions}>
          <Pressable onPress={toggleLike} style={styles.action} accessibilityLabel={liked ? "Unlike" : "Like"} accessibilityState={{ selected: liked }}>
            <Heart size={25} strokeWidth={1.75} color={liked ? "#ff4d7d" : "#fff"} fill={liked ? "#ff4d7d" : "transparent"} />
          </Pressable>
          <Pressable onPress={() => setCommentsOpen("write")} style={styles.action} accessibilityLabel="Comment">
            <MessageCircle size={25} strokeWidth={1.75} color="#fff" />
          </Pressable>
          <Pressable onPress={() => setSharing(true)} style={styles.action} accessibilityLabel="Share">
            <Send size={23} strokeWidth={1.75} color="#fff" />
          </Pressable>
          <Pressable onPress={toggleSave} style={styles.action} accessibilityLabel={saved ? "Remove from saved" : "Save"} accessibilityState={{ selected: saved }}>
            <Bookmark size={25} strokeWidth={1.75} color={saved ? "#ddd6fe" : "#fff"} fill={saved ? "#ddd6fe" : "transparent"} />
          </Pressable>
          <Button size="sm" icon={Sparkles} onPress={tryOn} style={styles.tryOn}>
            Try On Look
          </Button>
        </View>

        <AppText variant="sm" weight="medium" style={styles.likes}>
          {copy.likes(likes)}
        </AppText>
        {post.caption ? (
          <AppText variant="sm" color={colors.inkSoft} style={styles.caption}>
            <AppText variant="sm" weight="medium">
              {handle}{"  "}
            </AppText>
            {post.caption}
          </AppText>
        ) : null}

        {post.variants.length > 0 && <StockPanel variants={post.variants} postImage={post.image} brandName={brand.name} />}

        {post.tags.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagChips}>
            {post.tags.map((t) => (
              <View key={t.name} style={styles.tagChip}>
                <ShoppingBag size={12} color="#fff" />
                <AppText variant="xs" color="#fff">
                  {t.name} ·{" "}
                </AppText>
                <AppText variant="xs" color={colors.green}>
                  {t.price}
                </AppText>
              </View>
            ))}
          </ScrollView>
        )}

        {hiddenCount > 0 && (
          <Pressable onPress={() => setCommentsOpen("read")} style={styles.viewAll}>
            <AppText variant="sm" color={colors.muted}>
              {copy.viewComments(commentsCount)}
            </AppText>
          </Pressable>
        )}
        {visible.map((c) => (
          <View key={c.id} style={[styles.comment, c.pending && styles.pending]}>
            <AppText variant="sm" color={colors.inkSoft} style={styles.commentText}>
              <AppText variant="sm" weight="medium">
                {c.author}{" "}
              </AppText>
              {c.text}
              {c.createdAt ? (
                <AppText variant="micro" color={colors.muted}>
                  {"  "}
                  {timeAgo(c.createdAt)}
                </AppText>
              ) : null}
            </AppText>
          </View>
        ))}

        <Pressable onPress={() => setCommentsOpen("write")} style={styles.addComment} accessibilityRole="button">
          <AppText variant="sm" color={colors.muted} style={styles.shrink}>
            {copy.commentPlaceholder}
          </AppText>
          <AppText variant="sm" weight="medium" color="#ddd6fe" style={styles.postLabel}>
            {copy.postButton}
          </AppText>
        </Pressable>
      </View>

      <CommentsSheet
        open={Boolean(commentsOpen)}
        autoFocus={commentsOpen === "write"}
        onClose={() => setCommentsOpen(false)}
        postId={post.id}
        initial={comments}
        onChange={(next, count) => {
          setComments(next);
          setCommentsCount(count);
        }}
      />
      <PostShareSheet open={sharing} onClose={() => setSharing(false)} post={post} brand={brand} />
      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} maxHeight={0.5}>
        <MenuItem icon={Link2} label={copy.copyLink} onPress={copyLink} />
        <MenuItem
          icon={ExternalLink}
          label={copy.openPost}
          onPress={() => {
            setMenuOpen(false);
            router.push({ pathname: "/post/[id]", params: { id: post.id } });
          }}
        />
        <MenuItem
          icon={Sparkles}
          label={copy.tryOn}
          onPress={() => {
            setMenuOpen(false);
            tryOn();
          }}
        />
      </Sheet>
    </View>
  );
}

function MenuItem({ icon: Icon, label, onPress }: { icon: typeof Link2; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuItem, pressed && styles.menuPressed]}>
      <Icon size={18} color={colors.subtle} />
      <AppText variant="body" color={colors.inkSoft}>
        {label}
      </AppText>
    </Pressable>
  );
}

export const PostCard = memo(PostCardImpl);

const styles = StyleSheet.create({
  card: { backgroundColor: "rgba(13,12,29,0.3)", paddingBottom: 16, paddingTop: 4 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: GUTTER, paddingVertical: 12 },
  ring: { width: 40, height: 40, borderRadius: 20, padding: 2 },
  ringInner: { flex: 1, borderRadius: 20, backgroundColor: colors.canvas, padding: 2 },
  ringClip: { flex: 1, borderRadius: 20, overflow: "hidden" },
  headerText: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  shrink: { flexShrink: 1 },
  category: { borderRadius: 999, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 10, paddingVertical: 4 },
  more: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  media: { width: "100%", aspectRatio: 4 / 5, backgroundColor: "rgba(255,255,255,0.03)" },
  burst: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  tagBtn: {
    position: "absolute",
    left: 12,
    bottom: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  tagList: { position: "absolute", left: 12, bottom: 56, gap: 8 },
  tagItem: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: radius.md, backgroundColor: "rgba(1,2,20,0.85)", paddingHorizontal: 12, paddingVertical: 8 },
  body: { paddingHorizontal: GUTTER, paddingTop: 10 },
  actions: { flexDirection: "row", alignItems: "center", gap: 2, marginLeft: -8 },
  action: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  tryOn: { marginLeft: "auto" },
  likes: { marginTop: 4 },
  caption: { marginTop: 6 },
  tagChips: { gap: 8, marginTop: 12 },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(196,181,253,0.4)",
    backgroundColor: "rgba(196,181,253,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  viewAll: { marginTop: 10 },
  comment: { marginTop: 6 },
  commentText: { flexShrink: 1 },
  pending: { opacity: 0.6 },
  addComment: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.lineSoft, flexDirection: "row", alignItems: "center", gap: 8 },
  postLabel: { opacity: 0.5 },
  menuItem: { height: 52, flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 8, borderRadius: radius.md },
  menuPressed: { backgroundColor: "rgba(255,255,255,0.06)" },
});
