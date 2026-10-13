import { LinearGradient } from "expo-linear-gradient";
import { LayoutGrid } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Photo } from "@/components/ui/Photo";
import { discoverContent } from "@/data/app-content";
import { colors } from "@/theme";
import type { Brand } from "../model";

const SIZE = 64;

/** Story ring: conic-ish gradient = filtered brand, violet→cyan = unseen, grey = all seen. */
function Ring({ active, fresh, seen = false, children }: { active: boolean; fresh: boolean; seen?: boolean; children: ReactNode }) {
  const stops: readonly [string, string, ...string[]] | null = active ? ["#1fc5db", "#6645eb", "#d946ef", "#1fc5db"] : fresh ? ["#7f62f6", "#1fc5db"] : null;
  return (
    <View style={styles.ring}>
      {stops ? (
        <LinearGradient colors={stops} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, styles.round]} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.round, { backgroundColor: seen ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.1)" }]} />
      )}
      <View style={styles.inner}>
        <View style={styles.clip}>{children}</View>
      </View>
    </View>
  );
}

/**
 * Brand circles. A brand with active stories opens them (`onOpen`); one without filters the
 * feed to that brand (`onSelect`).
 */
export function BrandStories({ brands, selected, onSelect, onOpen }: { brands: Brand[]; selected: string; onSelect: (id: string) => void; onOpen: (brandId: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} accessibilityRole="tablist" accessibilityLabel="Brand stories">
      <Pressable onPress={() => onSelect("all")} style={styles.item} accessibilityRole="tab" accessibilityState={{ selected: selected === "all" }}>
        <Ring active={selected === "all"} fresh={false}>
          <LinearGradient colors={["#2a2168", "#0c0a26"]} style={[StyleSheet.absoluteFill, styles.center]}>
            <LayoutGrid size={24} color="#fff" strokeWidth={1.75} />
          </LinearGradient>
        </Ring>
        <AppText variant="micro" weight="medium" color={selected === "all" ? colors.ink : colors.subtle} numberOfLines={1} style={styles.label}>
          {discoverContent.allStoriesLabel}
        </AppText>
      </Pressable>

      {brands.map((b) => {
        const active = selected === b.id;
        return (
          <Pressable
            key={b.id}
            onPress={() => (b.hasStory ? onOpen(b.id) : onSelect(active ? "all" : b.id))}
            onLongPress={() => onSelect(active ? "all" : b.id)}
            style={styles.item}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={b.hasStory ? `${b.name} stories${b.hasNewStory ? ", new" : ""}` : b.name}
          >
            <Ring active={active} fresh={b.hasNewStory} seen={Boolean(b.hasStory && !b.hasNewStory)}>
              <Photo src={b.image} alt={b.name} tone={b.tone} initials style={StyleSheet.absoluteFill} />
            </Ring>
            <AppText variant="micro" weight={active ? "semibold" : "medium"} color={active ? colors.ink : colors.subtle} numberOfLines={1} style={styles.label}>
              {b.name}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 14, paddingHorizontal: 4, paddingVertical: 4 },
  item: { width: 70, alignItems: "center" },
  ring: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, padding: 2 },
  round: { borderRadius: SIZE / 2 },
  inner: { flex: 1, borderRadius: SIZE / 2, backgroundColor: colors.canvas, padding: 2 },
  clip: { flex: 1, borderRadius: SIZE / 2, overflow: "hidden" },
  center: { alignItems: "center", justifyContent: "center", borderRadius: SIZE / 2 },
  label: { marginTop: 6, width: "100%", textAlign: "center", letterSpacing: -0.2 },
});
