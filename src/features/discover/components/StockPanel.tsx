import { router } from "expo-router";
import { ExternalLink, Sparkles } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Chip } from "@/components/ui/Chip";
import { openExternal } from "@/lib/links";
import { colors, radius } from "@/theme";
import type { ApiVariant } from "../api";
import { drapeParams } from "../model";

/**
 * Stock-aware "Try this on your twin": pick a colour and size that's actually available,
 * then drape that exact variant.
 */
export function StockPanel({ variants, postImage, brandName }: { variants: ApiVariant[]; postImage: string; brandName: string }) {
  const products = useMemo(() => {
    const map = new Map<string, ApiVariant[]>();
    for (const v of variants) map.set(v.productName, [...(map.get(v.productName) ?? []), v]);
    return [...map.entries()];
  }, [variants]);
  const [productName, setProductName] = useState(products[0]?.[0] ?? "");
  const rows = products.find(([name]) => name === productName)?.[1] ?? [];
  const colours = [...new Map(rows.map((v) => [v.color, v])).values()];
  const [chosenColour, setColour] = useState<string | undefined>(undefined);
  // Default to the first colour that has stock; a product switch resets the choice.
  const colour = colours.some((c) => c.color === chosenColour)
    ? chosenColour
    : (colours.find((c) => rows.some((r) => r.color === c.color && r.inStock)) ?? colours[0])?.color;
  const sizes = rows.filter((v) => v.color === colour);
  const [size, setSize] = useState<string | null>(null);
  const picked = sizes.find((v) => v.size === size) ?? null;
  const image = picked?.imageUrl ?? sizes[0]?.imageUrl ?? postImage;
  const anyInStock = rows.some((r) => r.inStock);

  if (!products.length) return null;

  const tryOn = () => router.push(drapeParams(image, brandName, `${productName}${colour ? ` · ${colour}` : ""}${picked ? ` · ${picked.size}` : ""}`));

  return (
    <View style={styles.panel}>
      {products.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.products}>
          {products.map(([name]) => (
            <Chip
              key={name}
              size="sm"
              label={name}
              selected={name === productName}
              onPress={() => {
                setProductName(name);
                setSize(null);
                setColour(undefined);
              }}
            />
          ))}
        </ScrollView>
      )}

      <View style={styles.wrap}>
        {colours.map((c) => {
          const on = colour === c.color;
          return (
            <Pressable
              key={c.color}
              onPress={() => {
                setColour(c.color);
                setSize(null);
              }}
              accessibilityState={{ selected: on }}
              style={[styles.colour, on ? styles.colourOn : null]}
            >
              <View style={[styles.swatch, { backgroundColor: c.colorHex ?? "#888" }]} />
              <AppText variant="micro" color={on ? colors.ink : colors.subtle}>
                {c.color}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.wrap}>
        {sizes.map((v) => {
          const on = size === v.size;
          const low = v.inStock && v.stockCount != null && v.stockCount <= 3;
          return (
            <Pressable
              key={v.id}
              disabled={!v.inStock}
              onPress={() => setSize(v.size)}
              accessibilityState={{ selected: on, disabled: !v.inStock }}
              accessibilityLabel={`${v.size}, ${v.inStock ? (low ? `only ${v.stockCount} left` : "in stock") : "out of stock"}`}
              style={[styles.size, !v.inStock && styles.sizeOut, v.inStock && on && styles.sizeOn]}
            >
              <AppText variant="xs" color={v.inStock ? colors.ink : colors.muted} style={!v.inStock ? styles.strike : undefined}>
                {v.size}
              </AppText>
              {low && <View style={styles.lowDot} />}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footer}>
        <AppText variant="xs" color={colors.subtle} style={styles.status}>
          {!anyInStock ? (
            <AppText variant="xs" color={colors.red}>
              Sold out
            </AppText>
          ) : picked ? (
            <>
              {picked.price != null && <AppText variant="xs">₹{picked.price.toLocaleString("en-IN")} · </AppText>}
              {picked.stockCount != null && picked.stockCount <= 3 ? `Only ${picked.stockCount} left` : "In stock"}
            </>
          ) : (
            "Pick a size"
          )}
        </AppText>
        <View style={styles.actions}>
          {picked?.productUrl && (
            <Pressable onPress={() => openExternal(picked.productUrl!)} style={styles.buy}>
              <AppText variant="micro" color="#fff">
                Buy
              </AppText>
              <ExternalLink size={12} color="#fff" />
            </Pressable>
          )}
          <Pressable onPress={tryOn} style={styles.try}>
            <Sparkles size={12} color="#fff" />
            <AppText variant="micro" weight="medium" color="#fff">
              Try on your twin
            </AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { marginTop: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: "rgba(255,255,255,0.03)", padding: 12, gap: 8 },
  products: { gap: 6 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  colour: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", paddingHorizontal: 8, paddingVertical: 3 },
  colourOn: { borderColor: colors.accentBright },
  swatch: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  size: { minWidth: 36, alignItems: "center", borderRadius: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", paddingHorizontal: 8, paddingVertical: 4 },
  sizeOut: { borderColor: colors.lineSoft },
  sizeOn: { borderColor: colors.accentBright, backgroundColor: "rgba(102,69,235,0.25)" },
  strike: { textDecorationLine: "line-through" },
  lowDot: { position: "absolute", top: -3, right: -3, width: 8, height: 8, borderRadius: 4, backgroundColor: "#fcd34d" },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 4 },
  status: { flex: 1 },
  actions: { flexDirection: "row", gap: 6 },
  buy: { height: 28, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  try: { height: 28, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, borderRadius: 14, backgroundColor: colors.accentBright },
});
