import { router } from "expo-router";
import { Bookmark, Check, Shirt, Shuffle, Sparkles } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Checkbox } from "@/components/ui/Checkbox";
import { GlassCard } from "@/components/ui/GlassCard";
import { Photo } from "@/components/ui/Photo";
import { Select } from "@/components/ui/Select";
import { OCCASIONS, wardrobeContent as copy } from "@/data/studio-content";
import { useAuth } from "@/features/auth/AuthProvider";
import { workspaceApi, type WardrobeItem } from "@/features/workspace/api";
import { useLooksCache } from "@/features/workspace/hooks";
import { colors, radius } from "@/theme";
import { buildCombos } from "../combos";

type ShownCombo = { id: string; name: string; occasion: string; reason?: string; pieces: WardrobeItem[] };

const OCCASION_OPTIONS = [{ value: "", label: "Any occasion" }, ...OCCASIONS.map((o) => ({ value: o.id, label: o.label }))];

/**
 * New outfits from what you already own. The AI stylist builds them on the server (favouring
 * under-used pieces); a local rule-based mix shows instantly and is the fallback.
 */
export function CombosPanel({ items }: { items: WardrobeItem[] }) {
  const { token } = useAuth();
  const looksCache = useLooksCache();
  const [occasion, setOccasion] = useState("");
  const [focusUnderused, setFocusUnderused] = useState(true);
  const [aiCombos, setAiCombos] = useState<ShownCombo[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [seed, setSeed] = useState(1);
  const [saved, setSaved] = useState<Record<string, "saving" | "saved">>({});
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const enough = items.length >= 2;

  const localCombos = useCallback(
    (s: number): ShownCombo[] => buildCombos(items, s).map((c, i) => ({ id: c.id, name: `Wardrobe mix ${i + 1}`, occasion: c.occasion, pieces: c.pieces })),
    [items]
  );

  const generate = async () => {
    if (!token || !enough) return;
    setLoading(true);
    try {
      const ai = await workspaceApi.aiCombos(token, { occasion: occasion || undefined, count: 3, focusUnderused });
      const shaped = ai
        .map((c, i) => ({
          id: `${c.itemIds.join("+")}-${i}`,
          name: c.name,
          occasion: c.occasion,
          reason: c.reason,
          // Only pieces the user actually owns are shown, whatever the model returns.
          pieces: c.itemIds.map((id) => byId.get(id)).filter((p): p is WardrobeItem => Boolean(p)),
        }))
        .filter((c) => c.pieces.length >= 2);
      if (!shaped.length) throw new Error("empty");
      setAiCombos(shaped);
    } catch {
      setSeed((s) => s + 1);
      setAiCombos(null);
    } finally {
      setLoading(false);
    }
  };

  const source: "ai" | "local" = aiCombos ? "ai" : "local";
  const combos = useMemo(() => aiCombos ?? localCombos(seed), [aiCombos, localCombos, seed]);

  const save = async (combo: ShownCombo) => {
    if (!token) return;
    setSaved((s) => ({ ...s, [combo.id]: "saving" }));
    try {
      const look = await workspaceApi.saveLook(token, { name: combo.name, occasion: combo.occasion, image: combo.pieces[0].image, pieces: combo.pieces.map((p) => p.name) });
      looksCache.upsert(look);
      setSaved((s) => ({ ...s, [combo.id]: "saved" }));
    } catch {
      setSaved((s) => {
        const next = { ...s };
        delete next[combo.id];
        return next;
      });
    }
  };

  return (
    <GlassCard>
      <View style={styles.titleRow}>
        <Sparkles size={16} color={colors.accentBright} />
        <AppText variant="body" weight="medium">
          {copy.combosTitle}
        </AppText>
      </View>
      <AppText variant="xs" color={colors.muted} style={styles.sub}>
        {copy.combosDescription}
      </AppText>

      {!enough ? (
        <AppText variant="sm" color={colors.muted} style={styles.gap}>
          {copy.combosNeedMore}
        </AppText>
      ) : (
        <>
          <View style={styles.controls}>
            <Select label="Occasion" value={occasion} onChange={setOccasion} options={OCCASION_OPTIONS} />
            <Checkbox checked={focusUnderused} onChange={setFocusUnderused} label="Use forgotten pieces" />
            <Pressable onPress={generate} disabled={loading} style={[styles.ask, loading && styles.dim]}>
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Shuffle size={14} color="#fff" />}
              <AppText variant="xs" weight="medium" color="#fff">
                {source === "ai" && combos.length ? "More ideas" : "Ask the AI stylist"}
              </AppText>
            </Pressable>
          </View>
          {source === "local" && combos.length > 0 && (
            <AppText variant="micro" color={colors.muted} style={styles.gapSmall}>
              Quick mixes shown — ask the AI stylist for smarter pairings.
            </AppText>
          )}

          {combos.length === 0 ? (
            <AppText variant="sm" color={colors.muted} style={styles.gap}>
              {copy.combosNeedMore}
            </AppText>
          ) : (
            <View style={styles.list}>
              {combos.map((combo) => (
                <View key={combo.id} style={styles.combo}>
                  <AppText variant="sm" numberOfLines={1}>
                    {combo.name}
                  </AppText>
                  <View style={styles.pieces}>
                    {combo.pieces.map((p) => (
                      <View key={p.id} style={styles.piece}>
                        <Photo src={p.image} alt={p.name} fit="contain" style={StyleSheet.absoluteFill} />
                      </View>
                    ))}
                  </View>
                  {combo.reason ? (
                    <AppText variant="xs" color={colors.subtle}>
                      {combo.reason}
                    </AppText>
                  ) : null}
                  <View style={styles.comboFoot}>
                    <AppText variant="label" color={colors.muted} style={styles.occasion}>
                      {OCCASIONS.find((o) => o.id === combo.occasion)?.label ?? combo.occasion}
                    </AppText>
                    <View style={styles.comboActions}>
                      <Pressable onPress={() => router.navigate({ pathname: "/drape", params: { item: combo.pieces[0].id } })} style={styles.small}>
                        <Shirt size={12} color="#fff" />
                        <AppText variant="xs" color="#fff">
                          {copy.drape}
                        </AppText>
                      </Pressable>
                      <Pressable onPress={() => save(combo)} disabled={Boolean(saved[combo.id])} style={[styles.small, Boolean(saved[combo.id]) && styles.dim]}>
                        {saved[combo.id] === "saved" ? (
                          <Check size={12} color="#fff" />
                        ) : saved[combo.id] === "saving" ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Bookmark size={12} color="#fff" />
                        )}
                        <AppText variant="xs" color="#fff">
                          {saved[combo.id] === "saved" ? "Saved" : "Save"}
                        </AppText>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sub: { marginTop: 4 },
  gap: { marginTop: 16 },
  gapSmall: { marginTop: 8 },
  controls: { marginTop: 16, gap: 12 },
  ask: { height: 36, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.accentBright },
  dim: { opacity: 0.6 },
  list: { marginTop: 16, gap: 12 },
  combo: { gap: 8, borderRadius: radius.md, borderWidth: 1, borderColor: colors.lineSoft, backgroundColor: "rgba(255,255,255,0.02)", padding: 12 },
  pieces: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  piece: { width: 56, height: 56, borderRadius: 8, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.05)" },
  comboFoot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  occasion: { fontSize: 11 },
  comboActions: { flexDirection: "row", gap: 6 },
  small: { height: 28, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.08)" },
});
