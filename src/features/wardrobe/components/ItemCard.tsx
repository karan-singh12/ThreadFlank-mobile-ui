import { LinearGradient } from "expo-linear-gradient";
import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Photo } from "@/components/ui/Photo";
import type { WardrobeItem } from "@/features/workspace/api";
import { colors, radius } from "@/theme";
import { isUnworn } from "../combos";

/** Garment card, as on the web: the piece on a soft studio plate, name beneath. Tapping opens the detail sheet. */
function ItemCardImpl({ item, onOpen }: { item: WardrobeItem; onOpen: () => void }) {
  const unworn = isUnworn(item);
  return (
    <Pressable onPress={onOpen} accessibilityLabel={`Open ${item.name}`} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.plate}>
        <LinearGradient colors={["#1c1840", "#0b0c22"]} start={{ x: 0.5, y: 0.2 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
        <Photo src={item.image} alt={item.name} fit="contain" style={styles.photo} />
        {unworn && (
          <View style={styles.unworn}>
            <AppText variant="micro" weight="medium" color="#f6c453">
              Unworn 90d+
            </AppText>
          </View>
        )}
      </View>
      <AppText variant="sm" numberOfLines={1} style={styles.name}>
        {item.name}
      </AppText>
      {item.brand ? (
        <AppText variant="micro" color={colors.muted} numberOfLines={1} style={styles.brand}>
          {item.brand.toUpperCase()}
        </AppText>
      ) : null}
    </Pressable>
  );
}

export const ItemCard = memo(ItemCardImpl);

const styles = StyleSheet.create({
  card: { flex: 1 },
  pressed: { opacity: 0.85 },
  plate: { aspectRatio: 3 / 4, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  photo: { ...StyleSheet.absoluteFill, margin: 12, backgroundColor: "transparent" },
  unworn: { position: "absolute", left: 10, top: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(0,0,0,0.45)", paddingHorizontal: 10, paddingVertical: 4 },
  name: { marginTop: 10, paddingHorizontal: 4 },
  brand: { paddingHorizontal: 4, letterSpacing: 0.8 },
});
