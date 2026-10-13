import { router } from "expo-router";
import { Check, Repeat2, Shirt, Trash2, Undo2 } from "lucide-react-native";
import { memo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Photo } from "@/components/ui/Photo";
import { wardrobeContent as copy } from "@/data/studio-content";
import type { WardrobeItem } from "@/features/workspace/api";
import { rupees } from "@/lib/format";
import { colors, radius } from "@/theme";
import { isUnworn, UNWORN_DAYS } from "../combos";

type Props = {
  item: WardrobeItem;
  busy: boolean;
  selecting: boolean;
  selected: boolean;
  onSelect: () => void;
  onWorn: () => void;
  onUndo: () => void;
  onPrice: () => void;
  onRemove: () => void;
};

/** One wardrobe item: photo, quick Drape/delete, cost per wear, and "Wore it today". */
function ItemCardImpl({ item, busy, selecting, selected, onSelect, onWorn, onUndo, onPrice, onRemove }: Props) {
  const unworn = isUnworn(item);
  return (
    <View style={[styles.card, selected && styles.cardSelected]}>
      <Pressable onPress={selecting ? onSelect : undefined} disabled={!selecting} style={styles.media} accessibilityLabel={selecting ? `Select ${item.name}` : item.name} accessibilityState={selecting ? { selected } : undefined}>
        <Photo src={item.image} alt={item.name} fit="contain" style={StyleSheet.absoluteFill} />
        {selecting ? (
          <View style={styles.selectCorner}>
            <View style={[styles.selectDot, selected && styles.selectDotOn]}>{selected && <Check size={14} strokeWidth={3} color="#fff" />}</View>
          </View>
        ) : (
          <>
            {unworn && (
              <View style={styles.unworn}>
                <AppText variant="micro" weight="medium" color={colors.canvas} style={styles.tiny}>
                  Unworn {UNWORN_DAYS}d+
                </AppText>
              </View>
            )}
            <View style={styles.quick}>
              <Pressable onPress={() => router.navigate({ pathname: "/drape", params: { item: item.id } })} style={styles.drape}>
                <Shirt size={14} color={colors.canvas} />
                <AppText variant="xs" weight="medium" color={colors.canvas}>
                  {copy.drape}
                </AppText>
              </Pressable>
              <Pressable onPress={onRemove} disabled={busy} style={styles.trash} accessibilityLabel={`${copy.remove} ${item.name}`}>
                <Trash2 size={14} color="#fff" />
              </Pressable>
            </View>
          </>
        )}
      </Pressable>

      <View style={styles.body}>
        <View>
          <AppText variant="sm" numberOfLines={1}>
            {item.name}
          </AppText>
          <AppText variant="xs" color={colors.muted} numberOfLines={1}>
            {[item.brand, item.category, item.color].filter(Boolean).join(" · ")}
          </AppText>
        </View>
        <View style={styles.meta}>
          <Pressable onPress={onPrice} hitSlop={6} accessibilityLabel="Set the price you paid">
            {item.costPerWear != null ? (
              <AppText variant="micro" color={colors.subtle}>
                <AppText variant="micro">{rupees(item.costPerWear)}</AppText>/wear
              </AppText>
            ) : (
              <AppText variant="micro" color={colors.subtle}>
                Add price
              </AppText>
            )}
          </Pressable>
          <AppText variant="micro" color={colors.muted}>
            Worn {item.wornCount}×
          </AppText>
        </View>
        <View style={styles.actions}>
          <Pressable onPress={onWorn} disabled={busy || selecting} style={[styles.wore, (busy || selecting) && styles.disabled]}>
            {busy ? <ActivityIndicator size="small" color="#fff" /> : <Repeat2 size={14} color="#fff" />}
            <AppText variant="xs" color="#fff">
              Wore it today
            </AppText>
          </Pressable>
          {item.wornCount > 0 && (
            <Pressable onPress={onUndo} disabled={busy || selecting} style={styles.undo} accessibilityLabel="Undo last wear">
              <Undo2 size={14} color={colors.muted} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

export const ItemCard = memo(ItemCardImpl);

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: radius.card, overflow: "hidden", borderWidth: 1, borderColor: colors.lineSoft, backgroundColor: "rgba(255,255,255,0.02)" },
  cardSelected: { borderColor: colors.accentBright, borderWidth: 2 },
  media: { aspectRatio: 3 / 4, backgroundColor: "rgba(255,255,255,0.05)" },
  selectCorner: { position: "absolute", top: 8, right: 8 },
  selectDot: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.5)", backgroundColor: "rgba(0,0,0,0.4)" },
  selectDotOn: { backgroundColor: colors.accentBright, borderColor: "transparent" },
  unworn: { position: "absolute", top: 8, left: 8, borderRadius: 999, backgroundColor: "rgba(252,211,77,0.9)", paddingHorizontal: 8, paddingVertical: 2 },
  tiny: { fontSize: 10 },
  quick: { position: "absolute", left: 8, right: 8, bottom: 8, flexDirection: "row", gap: 6 },
  drape: { flex: 1, height: 32, borderRadius: 16, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  trash: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" },
  body: { padding: 10, gap: 8 },
  meta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
  actions: { flexDirection: "row", gap: 6 },
  wore: { flex: 1, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  undo: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.5 },
});
