import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import { BadgeCheck, LayoutGrid, Pause, Play, Volume2, VolumeX, X } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Modal, PanResponder, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Photo";
import { assetUrl } from "@/lib/api/config";
import { timeAgo } from "@/lib/format";
import { colors } from "@/theme";
import type { ApiBrandStory } from "../api";
import type { StoryGroup } from "../hooks";

/** How long a photo story stays up. Videos play to their end. */
const IMAGE_MS = 5000;
/** Swipe down this far (px) to close. */
const CLOSE_DRAG = 120;

function StoryVideo({ uri, paused, muted, onProgress, onEnd }: { uri: string; paused: boolean; muted: boolean; onProgress: (p: number) => void; onEnd: () => void }) {
  const player = useVideoPlayer(uri, (p) => {
    p.muted = true;
    p.timeUpdateEventInterval = 0.1;
    p.play();
  });

  useEffect(() => {
    const time = player.addListener("timeUpdate", ({ currentTime }) => {
      if (player.duration > 0) onProgress(currentTime / player.duration);
    });
    const end = player.addListener("playToEnd", onEnd);
    return () => {
      time.remove();
      end.remove();
    };
  }, [player, onProgress, onEnd]);

  useEffect(() => {
    if (paused) player.pause();
    else player.play();
  }, [paused, player]);

  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  return <VideoView player={player} contentFit="cover" nativeControls={false} style={StyleSheet.absoluteFill} />;
}

/**
 * Full-screen brand stories, Instagram style: a progress bar per story, tap the right side for
 * the next story and the left for the previous, hold to pause, swipe down to close. Moves on to
 * the next brand when one runs out.
 */
export function StoryViewer({
  groups,
  startBrandId,
  onClose,
  onSeen,
  onShowPosts,
}: {
  groups: StoryGroup[];
  startBrandId: string;
  onClose: () => void;
  onSeen: (story: ApiBrandStory) => void;
  onShowPosts: (brandId: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const firstUnseen = (g: StoryGroup | undefined) => Math.max(0, g?.stories.findIndex((s) => !s.viewed) ?? 0);
  const startIndex = Math.max(0, groups.findIndex((g) => g.brandId === startBrandId));
  const [groupIndex, setGroupIndex] = useState(startIndex);
  const [storyIndex, setStoryIndex] = useState(() => firstUnseen(groups[startIndex]));
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const progressRef = useRef(0);
  const drag = useRef(new Animated.Value(0)).current;

  const group = groups[groupIndex];
  const story = group?.stories[storyIndex];
  const isVideo = story?.mediaType?.toUpperCase() === "VIDEO";

  const next = useCallback(() => {
    if (!group) return;
    if (storyIndex < group.stories.length - 1) setStoryIndex((i) => i + 1);
    else if (groupIndex < groups.length - 1) {
      setGroupIndex((i) => i + 1);
      setStoryIndex(firstUnseen(groups[groupIndex + 1]));
    } else onClose();
  }, [group, storyIndex, groupIndex, groups, onClose]);

  const prev = useCallback(() => {
    if (storyIndex > 0) setStoryIndex((i) => i - 1);
    else if (groupIndex > 0) {
      setGroupIndex((i) => i - 1);
      setStoryIndex(groups[groupIndex - 1].stories.length - 1);
    }
  }, [storyIndex, groupIndex, groups]);

  // Each story starts from an empty bar and records one view.
  useEffect(() => {
    progressRef.current = 0;
    setProgress(0);
    if (story) onSeen(story);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  // Photos run on a timer (kept in a ref, so pausing resumes where it stopped).
  useEffect(() => {
    if (!story || isVideo || paused) return;
    let last = Date.now();
    let frame = requestAnimationFrame(function tick() {
      const now = Date.now();
      progressRef.current = Math.min(1, progressRef.current + (now - last) / IMAGE_MS);
      last = now;
      setProgress(progressRef.current);
      if (progressRef.current >= 1) {
        next();
        return;
      }
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [story, isVideo, paused, next]);

  // Prefetch the next photo so it appears instantly.
  useEffect(() => {
    const upcoming = group?.stories[storyIndex + 1] ?? groups[groupIndex + 1]?.stories[0];
    if (upcoming && upcoming.mediaType?.toUpperCase() !== "VIDEO") void Image.prefetch(assetUrl(upcoming.mediaUrl));
  }, [group, storyIndex, groupIndex, groups]);

  // Hold to pause, tap the sides to move, swipe down to close.
  const gesture = useRef({ x: 0, y: 0, t: 0 });
  const handlers = useRef({ next, prev, onClose });
  handlers.current = { next, prev, onClose };
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        gesture.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY, t: Date.now() };
        setPaused(true);
      },
      onPanResponderMove: (_, g) => drag.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (e, g) => {
        setPaused(false);
        if (g.dy > CLOSE_DRAG) {
          handlers.current.onClose();
          return;
        }
        Animated.spring(drag, { toValue: 0, useNativeDriver: true }).start();
        const tap = Date.now() - gesture.current.t < 250 && Math.abs(g.dx) < 10 && Math.abs(g.dy) < 10;
        if (!tap) return;
        if (e.nativeEvent.pageX < width / 3) handlers.current.prev();
        else handlers.current.next();
      },
      onPanResponderTerminate: () => {
        setPaused(false);
        Animated.spring(drag, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  const onVideoProgress = useCallback((p: number) => setProgress(p), []);

  if (!group || !story) return null;

  const scale = drag.interpolate({ inputRange: [0, 300], outputRange: [1, 0.8], extrapolate: "clamp" });
  const opacity = drag.interpolate({ inputRange: [0, 300], outputRange: [1, 0.5], extrapolate: "clamp" });

  return (
    <Modal visible animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.stage, { opacity, transform: [{ translateY: drag }, { scale }] }]}>
          {isVideo ? (
            <StoryVideo key={story.id} uri={assetUrl(story.mediaUrl)} paused={paused} muted={muted} onProgress={onVideoProgress} onEnd={next} />
          ) : (
            <Image key={story.id} source={{ uri: assetUrl(story.mediaUrl) }} contentFit="cover" style={StyleSheet.absoluteFill} accessibilityLabel={story.caption ?? `${group.brand.name} story`} />
          )}
          <LinearGradient colors={["rgba(0,0,0,0.6)", "transparent"]} style={styles.topShade} pointerEvents="none" />
          <LinearGradient colors={["transparent", "rgba(0,0,0,0.75)"]} style={styles.bottomShade} pointerEvents="none" />

          {/* Tap / hold / swipe surface, under the controls. */}
          <View style={StyleSheet.absoluteFill} {...pan.panHandlers} />

          <View style={[styles.top, { paddingTop: Math.max(insets.top, 12) }]} pointerEvents="box-none">
            <View style={styles.bars}>
              {group.stories.map((s, i) => (
                <View key={s.id} style={styles.bar}>
                  <View style={[styles.barFill, { width: `${i < storyIndex ? 100 : i === storyIndex ? progress * 100 : 0}%` }]} />
                </View>
              ))}
            </View>
            <View style={styles.headerRow} pointerEvents="box-none">
              <View style={styles.logo}>
                <Photo src={group.brand.logoUrl} alt={group.brand.name} initials style={StyleSheet.absoluteFill} />
              </View>
              <View style={styles.headerText}>
                <AppText variant="sm" weight="medium" color="#fff" numberOfLines={1}>
                  {group.brand.name}
                </AppText>
                {group.brand.isVerified && <BadgeCheck size={16} color={colors.surface} fill={colors.cyan} />}
                <AppText variant="xs" color="rgba(255,255,255,0.6)">
                  {timeAgo(story.createdAt)}
                </AppText>
              </View>
              <Pressable onPress={() => setPaused((p) => !p)} hitSlop={8} style={styles.ctrl} accessibilityLabel={paused ? "Play" : "Pause"}>
                {paused ? <Play size={20} color="#fff" /> : <Pause size={20} color="#fff" />}
              </Pressable>
              {isVideo && (
                <Pressable onPress={() => setMuted((m) => !m)} hitSlop={8} style={styles.ctrl} accessibilityLabel={muted ? "Unmute" : "Mute"}>
                  {muted ? <VolumeX size={20} color="#fff" /> : <Volume2 size={20} color="#fff" />}
                </Pressable>
              )}
              <Pressable onPress={onClose} hitSlop={8} style={styles.ctrl} accessibilityLabel="Close stories">
                <X size={24} color="#fff" />
              </Pressable>
            </View>
          </View>

          <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 20) }]} pointerEvents="box-none">
            {story.caption ? (
              <AppText variant="body" color="#fff" align="center" style={styles.caption} pointerEvents="none">
                {story.caption}
              </AppText>
            ) : null}
            <Button variant="light" size="md" icon={LayoutGrid} onPress={() => onShowPosts(group.brandId)} style={styles.center}>
              {`See ${group.brand.name} posts`}
            </Button>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "#000" },
  stage: { flex: 1, backgroundColor: colors.surface, overflow: "hidden" },
  topShade: { position: "absolute", top: 0, left: 0, right: 0, height: 150 },
  bottomShade: { position: "absolute", bottom: 0, left: 0, right: 0, height: 200 },
  top: { position: "absolute", top: 0, left: 0, right: 0, paddingHorizontal: 12 },
  bars: { flexDirection: "row", gap: 4 },
  bar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)", overflow: "hidden" },
  barFill: { height: "100%", backgroundColor: "#fff", borderRadius: 2 },
  headerRow: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 36, height: 36, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  headerText: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  ctrl: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 18 },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, alignItems: "center", gap: 12, paddingHorizontal: 20 },
  caption: { textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 6 },
  center: { alignSelf: "center" },
});
