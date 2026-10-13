import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { Columns2, Film, PenLine, Shirt, Sparkles, UserRound } from "lucide-react-native";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, PanResponder, Pressable, ScrollView, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Photo } from "@/components/ui/Photo";
import { Keycap } from "@/components/ui/Step";
import { POSES } from "@/data/look-edits";
import { drapeContent as copy } from "@/data/studio-content";
import type { StudioScene } from "@/features/workspace/api";
import { baseImage, type Person } from "@/features/workspace/hooks";
import { assetUrl } from "@/lib/api/config";
import { colors, gradients, radius } from "@/theme";
import type { BoardEntry, Result, RunState, StageView } from "../types";

/** The studio backdrop (web: radial #1d1940 → #0d0c1f). The scene itself is only painted by the render. */
function Backdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "#0d0c1f" }]} />
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="stage" cx="50%" cy="35%" r="70%">
            <Stop offset="0" stopColor="#1d1940" stopOpacity={1} />
            <Stop offset="1" stopColor="#0d0c1f" stopOpacity={1} />
          </RadialGradient>
        </Defs>
        <Ellipse cx="50%" cy="35%" rx="90%" ry="80%" fill="url(#stage)" />
      </Svg>
    </View>
  );
}

/** A photo framed to its own aspect ratio, fitted into the stage. */
function FramedPhoto({ src, alt, onFail }: { src: string; alt: string; onFail?: () => void }) {
  const [ratio, setRatio] = useState(0.75);
  return (
    <View style={[styles.frame, { aspectRatio: ratio }]}>
      <Image
        source={{ uri: assetUrl(src) }}
        accessibilityLabel={alt}
        contentFit="contain"
        transition={200}
        onLoad={(e) => e.source.width && setRatio(e.source.width / e.source.height)}
        onError={onFail}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

function FramedVideo({ src }: { src: string }) {
  const player = useVideoPlayer(assetUrl(src), (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return (
    <View style={[styles.frame, { aspectRatio: 0.75 }]}>
      <VideoView player={player} contentFit="contain" nativeControls fullscreenOptions={{ enable: true }} style={StyleSheet.absoluteFill} />
    </View>
  );
}

/** Drag the handle to wipe between the twin (before) and the render (after). */
function CompareSlider({ before, after }: { before: string; after: string }) {
  const [width, setWidth] = useState(0);
  const [ratio, setRatio] = useState(0.75);
  const [pos, setPos] = useState(0.5);
  const widthRef = useRef(0);
  const start = useRef(0.5);
  const posRef = useRef(0.5);
  posRef.current = pos;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        start.current = posRef.current;
      },
      onPanResponderMove: (_, g) => {
        if (!widthRef.current) return;
        setPos(Math.min(1, Math.max(0, start.current + g.dx / widthRef.current)));
      },
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width;
    setWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={[styles.frame, { aspectRatio: ratio }]} onLayout={onLayout} {...pan.panHandlers} accessibilityLabel="Compare before and after" accessibilityHint="Drag sideways">
      <Image source={{ uri: assetUrl(before) }} contentFit="contain" style={StyleSheet.absoluteFill} />
      <View style={[styles.afterClip, { left: width * pos }]}>
        <Image
          source={{ uri: assetUrl(after) }}
          contentFit="contain"
          onLoad={(e) => e.source.width && setRatio(e.source.width / e.source.height)}
          style={[styles.afterImage, { left: -width * pos, width }]}
        />
      </View>
      <View pointerEvents="none" style={[styles.divider, { left: width * pos - 1 }]}>
        <View style={styles.handle}>
          <Columns2 size={16} color={colors.canvas} />
        </View>
      </View>
      <View style={[styles.tag, styles.tagLeft]} pointerEvents="none">
        <AppText variant="micro" color="#fff">
          {copy.before}
        </AppText>
      </View>
      <View style={[styles.tag, styles.tagRight]} pointerEvents="none">
        <AppText variant="micro" color="#fff">
          {copy.after}
        </AppText>
      </View>
    </View>
  );
}

/** Every chosen piece as a swatch, grouped by person, pinned to the stage before the first render. */
function LookBoard({ board }: { board: BoardEntry[] }) {
  const rows = board.filter((b) => b.pieces.length > 0);
  const total = rows.reduce((n, b) => n + b.pieces.length, 0);
  return (
    <View style={styles.board}>
      <View style={styles.boardHead}>
        <View style={styles.row}>
          <Sparkles size={11} color={colors.cyan} />
          <AppText variant="micro" weight="medium" color="rgba(255,255,255,0.6)" style={styles.caps}>
            Look board
          </AppText>
        </View>
        <AppText variant="micro" color="rgba(255,255,255,0.45)">
          {total === 1 ? "1 piece" : `${total} pieces`}
        </AppText>
      </View>
      {rows.map((b) => (
        <View key={b.id} style={styles.boardRow}>
          {board.length > 1 && (
            <AppText variant="micro" weight="medium" color="rgba(255,255,255,0.8)">
              {b.name}
            </AppText>
          )}
          <View style={styles.swatches}>
            {b.pieces.map((piece, i) => (
              <View key={`${piece.label}-${i}`} style={styles.swatch}>
                {piece.preview ? <Photo src={piece.preview} alt="" fit="contain" style={StyleSheet.absoluteFill} /> : <PenLine size={16} color={colors.canvas} />}
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

/** No selfie yet, or the saved one no longer loads. */
function NoTwin({ self, name, broken }: { self: boolean; name?: string; broken: boolean }) {
  return (
    <GlassCard padding={24} style={styles.noTwin}>
      <View style={styles.noTwinInner}>
        <Keycap icon={UserRound} size={60} iconSize={26} />
        <AppText variant="title" align="center">
          {broken ? (self ? copy.twinMissingTitle : `Couldn’t load ${name}’s selfie`) : self ? copy.noTwinTitle : `Add a selfie for ${name}`}
        </AppText>
        <AppText variant="sm" color={colors.muted} align="center">
          {broken ? copy.twinMissingBody : copy.noTwinBody}
        </AppText>
        <Button onPress={() => router.push({ pathname: "/profile", params: { tab: self ? "twin" : "circle" } })}>{copy.setupTwin}</Button>
      </View>
    </GlassCard>
  );
}

/** Progress while a render runs: a light band sweeping the stage, a spinner, an elapsed timer, cancel. */
function RenderOverlay({ label, estimate = "usually ~20s", onCancel }: { label: string; estimate?: string; onCancel: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  const scan = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const started = Date.now();
    const id = setInterval(() => setElapsed(Math.round((Date.now() - started) / 1000)), 1000);
    const loops = [
      Animated.loop(Animated.sequence([Animated.timing(scan, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }), Animated.timing(scan, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.ease), useNativeDriver: true })])),
      Animated.loop(Animated.timing(spin, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true })),
      Animated.loop(Animated.timing(bar, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true })),
    ];
    loops.forEach((l) => l.start());
    return () => {
      clearInterval(id);
      loops.forEach((l) => l.stop());
    };
  }, [scan, spin, bar]);

  return (
    <View style={styles.overlay} accessibilityLiveRegion="polite">
      <Animated.View pointerEvents="none" style={[styles.scan, { transform: [{ translateY: scan.interpolate({ inputRange: [0, 1], outputRange: [-100, 520] }) }] }]}>
        <LinearGradient colors={["transparent", "rgba(127,98,246,0.25)", "transparent"]} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <GlassCard padding={24} style={styles.overlayCard}>
        <View style={styles.overlayInner}>
          <View style={styles.spinnerWrap}>
            <Animated.View style={[styles.spinner, { transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] }]} />
            <Shirt size={20} color={colors.accentBright} strokeWidth={1.75} />
          </View>
          <AppText variant="body" align="center" style={styles.minLine}>
            {label}
          </AppText>
          <View style={styles.track}>
            <Animated.View style={[styles.trackFill, { transform: [{ translateX: bar.interpolate({ inputRange: [0, 1], outputRange: [-90, 270] }) }] }]}>
              <LinearGradient colors={[colors.accent, colors.accentBright]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            </Animated.View>
          </View>
          <View style={styles.overlayFoot}>
            <AppText variant="xs" color={colors.muted}>
              {elapsed}s · {estimate}
            </AppText>
            <Pressable onPress={onCancel} hitSlop={8}>
              <AppText variant="xs" color={colors.subtle}>
                {copy.cancel}
              </AppText>
            </Pressable>
          </View>
        </View>
      </GlassCard>
    </View>
  );
}

function Thumb({ active, onPress, label, children }: { active: boolean; onPress: () => void; label: string; children: ReactNode }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} accessibilityState={{ selected: active }} style={styles.thumb}>
      <View style={[styles.thumbImage, active ? styles.thumbOn : styles.thumbOff]}>{children}</View>
      <AppText variant="micro" color={active ? "#fff" : "rgba(255,255,255,0.6)"} numberOfLines={1} style={styles.thumbLabel}>
        {label}
      </AppText>
    </Pressable>
  );
}

/**
 * The studio canvas. Before a render: each person's selfie (or a prompt to add one) and the look
 * board; while rendering: the progress overlay; afterwards: the render, its poses and video, and a
 * before/after compare for single looks.
 */
export function DrapeStage({
  mode,
  scene,
  person,
  group,
  board,
  run,
  view,
  onView,
  progress,
  estimate,
  onCancel,
}: {
  mode: "single" | "group";
  scene: StudioScene;
  person?: Person;
  group: Person[];
  board: BoardEntry[];
  run: RunState;
  view: StageView;
  onView: (v: StageView) => void;
  progress: string;
  estimate?: string;
  onCancel: () => void;
}) {
  const result: Result | null = run.status === "done" ? run.result : null;
  const [comparing, setComparing] = useState(false);
  const [broken, setBroken] = useState<string[]>([]);
  const markBroken = (src: string) => setBroken((b) => (b.includes(src) ? b : [...b, src]));
  const twinOf = (p?: Person) => {
    const src = baseImage(p);
    return src && !broken.includes(src) ? src : undefined;
  };

  const before = mode === "single" ? twinOf(person) : undefined;
  const canCompare = Boolean(result && before && view.kind === "main" && !result.collage);
  const isComparing = comparing && canCompare;
  const hasStrip = Boolean(result && (result.poses.length > 0 || result.video));

  let content: ReactNode;
  if (result) {
    if (view.kind === "video" && result.video) {
      content = <FramedVideo key={result.video} src={result.video} />;
    } else if (isComparing) {
      content = <CompareSlider before={before!} after={result.image} />;
    } else if (result.collage && view.kind === "main") {
      content = (
        <View style={styles.collage}>
          {result.collage.map((src) => (
            <View key={src} style={styles.collageItem}>
              <Image source={{ uri: assetUrl(src) }} contentFit="contain" style={StyleSheet.absoluteFill} />
            </View>
          ))}
        </View>
      );
    } else {
      const src = view.kind === "pose" ? result.poses.find((p) => p.pose === view.pose)?.imageUrl ?? result.image : result.image;
      content = <FramedPhoto key={src} src={src} alt="Your draped look" />;
    }
  } else if (mode === "single") {
    content = before ? (
      <FramedPhoto key={before} src={before} alt={`${person?.name ?? "Person"} selfie`} onFail={() => markBroken(before)} />
    ) : (
      <NoTwin self={Boolean(person?.isSelf)} name={person?.name} broken={Boolean(baseImage(person))} />
    );
  } else if (group.some((p) => twinOf(p))) {
    content = (
      <View style={styles.groupRow}>
        {group.map((p) => {
          const src = twinOf(p);
          return (
            <View key={p.id} style={styles.groupItem}>
              {src ? (
                <View style={styles.groupPhoto}>
                  <Image source={{ uri: assetUrl(src) }} contentFit="contain" onError={() => markBroken(src)} style={StyleSheet.absoluteFill} />
                </View>
              ) : (
                <View style={styles.groupMissing}>
                  <UserRound size={24} color={colors.muted} strokeWidth={1.5} />
                </View>
              )}
              <View style={styles.groupName}>
                <AppText variant="micro" color="#fff">
                  {p.isSelf ? "You" : p.name}
                </AppText>
              </View>
            </View>
          );
        })}
      </View>
    );
  } else {
    content = (
      <View style={styles.emptyStage}>
        <Shirt size={40} strokeWidth={1.25} color="rgba(255,255,255,0.7)" />
        <AppText variant="sm" color="rgba(255,255,255,0.7)">
          {copy.emptyStage}
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.stage}>
      <Backdrop />
      <View style={styles.topBar} pointerEvents="box-none">
        <View style={styles.scenePill}>
          <LinearGradient colors={gradients.glassPill} style={[StyleSheet.absoluteFill, styles.pillRound]} />
          <View style={styles.cyanDot} />
          <AppText variant="xs" color="rgba(255,255,255,0.55)">
            Scene
          </AppText>
          <AppText variant="xs" weight="medium" color="#fff" numberOfLines={1} style={styles.flexShrink}>
            {scene.name}
          </AppText>
        </View>
        {canCompare && (
          <Pressable onPress={() => setComparing((c) => !c)} accessibilityState={{ selected: isComparing }} style={[styles.compareBtn, isComparing ? styles.compareOn : null]}>
            {isComparing && <LinearGradient colors={gradients.chipOn} style={[StyleSheet.absoluteFill, styles.pillRound]} />}
            <Columns2 size={14} color={isComparing ? colors.chipOnText : "#fff"} />
            <AppText variant="xs" weight="medium" color={isComparing ? colors.chipOnText : "#fff"}>
              {copy.compare}
            </AppText>
          </Pressable>
        )}
      </View>

      <View style={[styles.content, { paddingBottom: hasStrip ? 92 : 20 }]}>{content}</View>

      {!result && run.status !== "running" && board.some((b) => b.pieces.length > 0) && <LookBoard board={board} />}

      {result && hasStrip && (
        <View style={styles.stripWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
            <Thumb active={view.kind === "main"} onPress={() => onView({ kind: "main" })} label="Look">
              <Photo src={result.image} alt="" style={StyleSheet.absoluteFill} />
            </Thumb>
            {result.poses.map((p) => (
              <Thumb key={p.pose} active={view.kind === "pose" && view.pose === p.pose} onPress={() => onView({ kind: "pose", pose: p.pose })} label={POSES.find((x) => x.id === p.pose)?.label ?? p.pose}>
                <Photo src={p.imageUrl} alt="" style={StyleSheet.absoluteFill} />
              </Thumb>
            ))}
            {result.video && (
              <Thumb active={view.kind === "video"} onPress={() => onView({ kind: "video" })} label="Video">
                <View style={styles.videoThumb}>
                  <Film size={16} color="#fff" />
                </View>
              </Thumb>
            )}
          </ScrollView>
        </View>
      )}

      {run.status === "running" && <RenderOverlay label={progress} estimate={estimate} onCancel={onCancel} />}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { width: "100%", aspectRatio: 4 / 5, overflow: "hidden", borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.lineSoft },
  topBar: { position: "absolute", top: 12, left: 12, right: 12, zIndex: 10, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  scenePill: {
    height: 32,
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(1,2,20,0.4)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  pillRound: { borderRadius: 16 },
  cyanDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.cyan },
  flexShrink: { flexShrink: 1 },
  compareBtn: {
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(1,2,20,0.4)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  compareOn: { borderColor: "transparent" },
  content: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, paddingTop: 56 },
  frame: { height: "100%", maxWidth: "100%", borderRadius: 18, overflow: "hidden", backgroundColor: "rgba(0,0,0,0.2)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  afterClip: { position: "absolute", top: 0, bottom: 0, right: 0, overflow: "hidden" },
  afterImage: { position: "absolute", top: 0, bottom: 0 },
  divider: { position: "absolute", top: 0, bottom: 0, width: 2, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  handle: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", marginLeft: -1 },
  tag: { position: "absolute", top: 12, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 8, paddingVertical: 2 },
  tagLeft: { left: 12 },
  tagRight: { right: 12 },
  collage: { flex: 1, width: "100%", flexDirection: "row", gap: 8 },
  collageItem: { flex: 1, borderRadius: 14, overflow: "hidden", backgroundColor: "rgba(0,0,0,0.2)" },
  groupRow: { flex: 1, width: "100%", flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 12 },
  groupItem: { flex: 1, maxWidth: 240, height: "100%", alignItems: "center", justifyContent: "flex-end", gap: 8 },
  groupPhoto: { width: "100%", flex: 1, borderRadius: 18, overflow: "hidden", backgroundColor: "rgba(0,0,0,0.2)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  groupMissing: { width: "70%", aspectRatio: 3 / 4, alignItems: "center", justifyContent: "center", borderRadius: radius.card, borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(255,255,255,0.2)" },
  groupName: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2, backgroundColor: "rgba(1,2,20,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  emptyStage: { alignItems: "center", gap: 12 },
  noTwin: { maxWidth: 340 },
  noTwinInner: { alignItems: "center", gap: 12 },
  board: {
    position: "absolute",
    right: 12,
    bottom: 12,
    maxWidth: "72%",
    gap: 8,
    borderRadius: radius.card,
    padding: 10,
    backgroundColor: "rgba(1,2,20,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  boardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  caps: { textTransform: "uppercase", letterSpacing: 1.2, fontSize: 10 },
  boardRow: { gap: 4 },
  swatches: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  swatch: { width: 44, height: 44, borderRadius: 12, overflow: "hidden", backgroundColor: "#fff", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  stripWrap: { position: "absolute", left: 12, right: 12, bottom: 12, alignItems: "center" },
  strip: { gap: 6, padding: 6, borderRadius: radius.card, backgroundColor: "rgba(1,2,20,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  thumb: { width: 48, alignItems: "center", gap: 4 },
  thumbImage: { width: 48, aspectRatio: 3 / 4, borderRadius: 8, overflow: "hidden", borderWidth: 1 },
  thumbOn: { borderColor: "rgba(255,255,255,0.9)", borderWidth: 2 },
  thumbOff: { borderColor: "rgba(255,255,255,0.1)", opacity: 0.75 },
  thumbLabel: { fontSize: 10 },
  videoThumb: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(102,69,235,0.3)" },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(1,2,20,0.6)", overflow: "hidden" },
  scan: { position: "absolute", left: 0, right: 0, top: 0, height: 96 },
  overlayCard: { width: "86%", maxWidth: 320 },
  overlayInner: { alignItems: "center", gap: 16 },
  spinnerWrap: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  spinner: { position: "absolute", width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: "rgba(255,255,255,0.1)", borderTopColor: colors.accentBright },
  minLine: { minHeight: 24 },
  track: { height: 4, width: "100%", borderRadius: 2, backgroundColor: "rgba(255,255,255,0.1)", overflow: "hidden" },
  trackFill: { height: "100%", width: "33%", borderRadius: 2, overflow: "hidden" },
  overlayFoot: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
