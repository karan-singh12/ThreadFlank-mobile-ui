import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { Animated, Dimensions, Easing, StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from "react-native";
import { GUTTER, radius as radii } from "@/theme";

/**
 * Loading placeholders, the web's `.shimmer`: a faint block with a lavender light sweeping across.
 * Every block shares one animated value, so the whole screen shimmers in sync with a single animation.
 */
const sweep = new Animated.Value(0);
let running = 0;
let loop: Animated.CompositeAnimation | null = null;

function useSweep() {
  useEffect(() => {
    running += 1;
    if (running === 1) {
      sweep.setValue(0);
      loop = Animated.loop(Animated.timing(sweep, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }));
      loop.start();
    }
    return () => {
      running -= 1;
      if (running === 0) loop?.stop();
    };
  }, []);
}

const SCREEN = Dimensions.get("window").width;
const BAND = SCREEN * 0.7;
const translateX = sweep.interpolate({ inputRange: [0, 1], outputRange: [-BAND, SCREEN] });

export function Skeleton({ width = "100%", height, radius = radii.md, style }: { width?: DimensionValue; height?: DimensionValue; radius?: number; style?: StyleProp<ViewStyle> }) {
  useSweep();
  return (
    <View style={[styles.block, { width, height, borderRadius: radius }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[styles.band, { transform: [{ translateX }] }]}>
        <LinearGradient colors={["transparent", "rgba(171,154,255,0.14)", "transparent"]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
}

/** A few lines of text: the last one shorter, as real paragraphs end. */
export function SkeletonLines({ lines = 2, height = 12, gap = 8, style }: { lines?: number; height?: number; gap?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ gap }, style]}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} height={height} radius={height / 2} width={i === lines - 1 && lines > 1 ? "62%" : "100%"} />
      ))}
    </View>
  );
}

/** Page heading placeholder: eyebrow, title, one line of copy. */
export function SkeletonHeading({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.heading, style]}>
      <Skeleton width={72} height={10} radius={5} />
      <Skeleton width="78%" height={28} radius={8} />
      <Skeleton width="92%" height={12} radius={6} />
    </View>
  );
}

/** A horizontal row of chips. */
export function SkeletonChips({ count = 4, style }: { count?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.row, style]}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} width={i === 0 ? 56 : 84 + (i % 2) * 16} height={34} radius={radii.pill} />
      ))}
    </View>
  );
}

/** Two-column grid of portrait cards with a caption, as the wardrobe, saved looks and store grids. */
export function SkeletonGrid({ count = 4, ratio = 3 / 4, caption = true, style }: { count?: number; ratio?: number; caption?: boolean; style?: StyleProp<ViewStyle> }) {
  const width = (SCREEN - GUTTER * 2 - 12) / 2;
  return (
    <View style={[styles.grid, style]}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={{ width, gap: 8 }}>
          <Skeleton width={width} height={width / ratio} radius={18} />
          {caption ? <SkeletonLines lines={2} height={10} gap={6} /> : null}
        </View>
      ))}
    </View>
  );
}

/** List rows: avatar circle plus two lines (notifications, chats, queues). */
export function SkeletonRows({ count = 6, style }: { count?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.rows, style]}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.rowItem}>
          <Skeleton width={44} height={44} radius={22} />
          <View style={styles.flex}>
            <SkeletonLines lines={2} height={10} gap={7} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { overflow: "hidden", backgroundColor: "rgba(255,255,255,0.05)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.06)" },
  band: { position: "absolute", top: 0, bottom: 0, left: 0, width: BAND },
  heading: { gap: 10 },
  row: { flexDirection: "row", gap: 8, overflow: "hidden" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  rows: { gap: 18 },
  rowItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  flex: { flex: 1 },
});
