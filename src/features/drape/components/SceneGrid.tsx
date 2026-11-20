import { LinearGradient } from "expo-linear-gradient";
import { Check } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Pressable } from "@/components/ui/Pressable";
import { AppText } from "@/components/ui/AppText";
import { Chip } from "@/components/ui/Chip";
import { Photo } from "@/components/ui/Photo";
import { drapeContent as copy } from "@/data/studio-content";
import type { StudioScene } from "@/features/workspace/api";
import { colors, gradients, radius } from "@/theme";

/** Colour stops pulled from a scene's CSS gradient (admin-curated), for a native gradient. */
export function sceneStops(scene: Pick<StudioScene, "cssGradient">): [string, string, ...string[]] {
  const stops = scene.cssGradient?.match(/#[0-9a-f]{6}\b/gi);
  return stops && stops.length >= 2 ? (stops as [string, string, ...string[]]) : ["#2a2548", "#0d0c1f"];
}

/** Filter chips for the scene categories (hidden when there's only one category). */
export function SceneTabs({ categories, value, onChange }: { categories: string[]; value: string; onChange: (c: string) => void }) {
  if (categories.length <= 2) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
      {categories.map((cat) => (
        <Chip key={cat} size="sm" label={cat === "all" ? "All" : cat} selected={value === cat} onPress={() => onChange(cat)} />
      ))}
    </ScrollView>
  );
}

/**
 * The scene the next render is placed in: image or gradient tiles, four across at 4:3, as on the web.
 * Tile size comes from the measured grid width: a % width with aspectRatio collapses in a wrapping row on RN 0.88.
 */
export function SceneGrid({ scenes, selectedId, onSelect }: { scenes: StudioScene[]; selectedId?: string; onSelect: (id: string) => void }) {
  const [gridWidth, setGridWidth] = useState(0);
  const tileWidth = gridWidth > 0 ? Math.floor((gridWidth - GAP * (COLUMNS - 1)) / COLUMNS) : 0;
  if (scenes.length === 0) {
    return (
      <View style={styles.empty}>
        <AppText variant="xs" color={colors.muted} align="center">
          No custom studio backgrounds available.
        </AppText>
      </View>
    );
  }
  return (
    <View style={styles.grid} onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)} accessibilityRole="radiogroup" accessibilityLabel={copy.steps.scene}>
      {tileWidth > 0 &&
        scenes.map((s) => {
        const on = selectedId === s.id;
        return (
          <Pressable key={s.id} onPress={() => onSelect(s.id)} accessibilityRole="radio" accessibilityLabel={s.name} accessibilityState={{ selected: on }} style={[styles.tile, { width: tileWidth, height: Math.round((tileWidth * 3) / 4) }, on && styles.tileOn]}>
            <LinearGradient colors={sceneStops(s)} style={StyleSheet.absoluteFill} />
            {s.imageUrl ? <Photo src={s.imageUrl} alt="" style={StyleSheet.absoluteFill} /> : null}
            <LinearGradient colors={["transparent", "rgba(0,0,0,0.1)", "rgba(0,0,0,0.8)"]} style={StyleSheet.absoluteFill} />
            <View style={styles.label}>
              <AppText variant="micro" weight="medium" color="#fff" numberOfLines={1} style={styles.flex}>
                {s.name}
              </AppText>
              {on && (
                <View style={styles.check}>
                  <LinearGradient colors={gradients.chipOn} style={[StyleSheet.absoluteFill, styles.round]} />
                  <Check size={10} strokeWidth={3} color={colors.chipOnText} />
                </View>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const COLUMNS = 4;
const GAP = 6;

const styles = StyleSheet.create({
  tabs: { gap: 6, marginBottom: 10 },
  empty: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: "rgba(255,255,255,0.02)", padding: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  tile: { borderRadius: radius.md, overflow: "hidden", borderWidth: 1, borderColor: colors.line },
  tileOn: { borderWidth: 2, borderColor: "rgba(255,255,255,0.9)" },
  label: { position: "absolute", left: 6, right: 6, bottom: 5, flexDirection: "row", alignItems: "center", gap: 4 },
  flex: { flex: 1 },
  check: { width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  round: { borderRadius: 8 },
});
