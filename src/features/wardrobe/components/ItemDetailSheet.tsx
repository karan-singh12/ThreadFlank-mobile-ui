import { router } from "expo-router";
import { Edit2, Repeat2, Shirt, Tag, Trash2, Undo2 } from "lucide-react-native";
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Photo";
import { Sheet } from "@/components/ui/Sheet";
import type { WardrobeItem } from "@/features/workspace/api";
import { rupees } from "@/lib/format";
import { colors, radius } from "@/theme";
import { isUnworn } from "../combos";

type Props = {
  item: WardrobeItem | null;
  busy: boolean;
  onClose: () => void;
  onWorn: (item: WardrobeItem) => void;
  onUndo: (item: WardrobeItem) => void;
  onEditPrice: (item: WardrobeItem) => void;
  onRemove: (item: WardrobeItem) => void;
};

/** A wardrobe piece up close: cost per wear, wears, tags, and the same actions as the web's item detail. */
export function ItemDetailSheet({ item, busy, onClose, onWorn, onUndo, onEditPrice, onRemove }: Props) {
  if (!item) return null;
  const unworn = isUnworn(item);
  const confirmRemove = () =>
    Alert.alert(`Remove "${item.name}" from your wardrobe?`, undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          onRemove(item);
          onClose();
        },
      },
    ]);

  return (
    <Sheet open onClose={onClose} title={item.name} maxHeight={0.94}>
      <View style={styles.image}>
        <Photo src={item.image} alt={item.name} fit="contain" style={StyleSheet.absoluteFill} />
        {unworn && (
          <View style={styles.unworn}>
            <AppText variant="xs" weight="semibold" color={colors.canvas}>
              Unworn 90+ days
            </AppText>
          </View>
        )}
      </View>

      <View style={styles.tags}>
        {[item.brand, item.category, item.color].filter(Boolean).map((t, i) => (
          <View key={`${t}-${i}`} style={styles.pill}>
            <AppText variant="xs" color={i < 2 ? "rgba(255,255,255,0.9)" : colors.muted}>
              {t}
            </AppText>
          </View>
        ))}
      </View>

      <View style={styles.cpw}>
        <View style={styles.cpwHead}>
          <AppText variant="label" color={colors.accentBright}>
            COST-PER-WEAR INSIGHTS
          </AppText>
          <Pressable
            onPress={() => {
              onClose();
              onEditPrice(item);
            }}
            hitSlop={6}
            style={styles.row}
          >
            <Edit2 size={12} color={colors.accentBright} />
            <AppText variant="xs" weight="medium" color={colors.accentBright}>
              {item.costPaid != null ? "Edit Price" : "Add Price"}
            </AppText>
          </Pressable>
        </View>
        <View style={styles.stats}>
          {[
            ["Cost / Wear", item.costPerWear != null ? rupees(item.costPerWear) : "—"],
            ["Times Worn", `${item.wornCount}×`],
            ["Purchase Price", item.costPaid != null ? rupees(item.costPaid) : "Not set"],
          ].map(([k, v], i) => (
            <View key={k} style={[styles.stat, i === 2 && styles.statWide]}>
              <AppText variant="micro" color={colors.muted}>
                {k.toUpperCase()}
              </AppText>
              <AppText variant="body" weight="bold">
                {v}
              </AppText>
            </View>
          ))}
        </View>
        {item.lastWornAt ? (
          <AppText variant="micro" color={colors.muted}>
            Last worn on {new Date(item.lastWornAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
          </AppText>
        ) : null}
      </View>

      {item.tags.length > 0 && (
        <View style={styles.tags}>
          <Tag size={14} color={colors.muted} />
          {item.tags.map((tag) => (
            <View key={tag} style={styles.hashtag}>
              <AppText variant="micro" color={colors.muted}>
                #{tag}
              </AppText>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <View style={styles.row}>
          <Pressable onPress={() => onWorn(item)} disabled={busy} style={[styles.wore, busy && styles.disabled]}>
            {busy ? <ActivityIndicator size="small" color="#fff" /> : <Repeat2 size={16} color="#fff" />}
            <AppText variant="sm" weight="medium">
              Wore it today
            </AppText>
          </Pressable>
          {item.wornCount > 0 && (
            <Pressable onPress={() => onUndo(item)} disabled={busy} accessibilityLabel="Undo last wear" style={styles.square}>
              <Undo2 size={16} color={colors.muted} />
            </Pressable>
          )}
        </View>
        <View style={styles.row}>
          <Button
            icon={Shirt}
            style={styles.flex}
            fullWidth
            onPress={() => {
              onClose();
              router.navigate({ pathname: "/drape", params: { item: item.id } });
            }}
          >
            Try on in Drape Studio
          </Button>
          <Pressable onPress={confirmRemove} disabled={busy} accessibilityLabel="Remove item" style={[styles.square, styles.danger]}>
            <Trash2 size={16} color="#f87171" />
          </Pressable>
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  image: { aspectRatio: 3 / 4, borderRadius: radius.card, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.03)" },
  unworn: { position: "absolute", left: 12, top: 12, borderRadius: radius.pill, backgroundColor: "#fbbf24", paddingHorizontal: 12, paddingVertical: 4 },
  tags: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  pill: { borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.04)", paddingHorizontal: 10, paddingVertical: 3 },
  hashtag: { borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.02)", paddingHorizontal: 10, paddingVertical: 3 },
  cpw: { gap: 12, borderRadius: radius.card, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.03)", padding: 16 },
  cpwHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stat: { flexGrow: 1, flexBasis: "45%", gap: 4, borderRadius: radius.md, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.02)", padding: 12 },
  statWide: { flexBasis: "100%" },
  actions: { gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" },
  wore: { flex: 1, height: 44, borderRadius: radius.md, backgroundColor: "rgba(255,255,255,0.1)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  square: { width: 44, height: 44, borderRadius: radius.md, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  danger: { borderColor: "rgba(239,68,68,0.2)" },
  disabled: { opacity: 0.5 },
});
