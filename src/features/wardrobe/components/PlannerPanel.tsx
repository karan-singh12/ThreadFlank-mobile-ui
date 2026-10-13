import { router } from "expo-router";
import { ExternalLink, Shirt, WandSparkles } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Notice } from "@/components/ui/Notice";
import { Photo } from "@/components/ui/Photo";
import { Select } from "@/components/ui/Select";
import { TextField } from "@/components/ui/TextField";
import { OCCASIONS, wardrobeContent as copy } from "@/data/studio-content";
import { useAuth } from "@/features/auth/AuthProvider";
import { workspaceApi, type OccasionPlan, type PlannedOutfit, type WardrobeItem } from "@/features/workspace/api";
import { rupees } from "@/lib/format";
import { openExternal } from "@/lib/links";
import { colors, radius } from "@/theme";

const DRESS_CODES = ["", "Casual", "Smart casual", "Business", "Formal", "Black tie", "Traditional / ethnic"];
const OCCASION_OPTIONS = OCCASIONS.map((o) => ({ value: o.id, label: o.label }));
const DRESS_OPTIONS = DRESS_CODES.map((d) => ({ value: d, label: d || "Any" }));

/** Shoppable search links for a missing piece. */
const shopLinks = (q: string) => [
  { label: "Myntra", href: `https://www.myntra.com/${encodeURIComponent(q.trim().replace(/\s+/g, "-"))}` },
  { label: "Amazon", href: `https://www.amazon.in/s?k=${encodeURIComponent(q)}` },
  { label: "Nykaa Fashion", href: `https://www.nykaafashion.com/catalogsearch/result/?q=${encodeURIComponent(q)}` },
];

/** Occasion Planner: up to 3 outfits from your wardrobe, a confidence score, gap pieces to buy, and the style rules it followed. */
export function PlannerPanel({ items }: { items: WardrobeItem[] }) {
  const { token } = useAuth();
  const [occasion, setOccasion] = useState<string>(OCCASIONS[0].id);
  const [dressCode, setDressCode] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [plan, setPlan] = useState<OccasionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const ask = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    setPlan(null);
    try {
      const label = OCCASIONS.find((o) => o.id === occasion)?.label ?? occasion;
      setPlan(
        await workspaceApi.planOccasion(token, {
          eventType: label,
          dressCode: dressCode || undefined,
          location: location.trim() || undefined,
          budget: budget ? Math.round(Number(budget)) : undefined,
          notes: notes.trim() || undefined,
        })
      );
    } catch {
      setError(copy.plannerError);
    } finally {
      setLoading(false);
    }
  };

  const outfits: PlannedOutfit[] = plan?.outfits?.outfits ?? [];

  return (
    <GlassCard>
      <View style={styles.titleRow}>
        <WandSparkles size={16} color={colors.accentBright} />
        <AppText variant="body" weight="medium">
          {copy.plannerTitle}
        </AppText>
      </View>

      <View style={styles.form}>
        <View style={styles.twoCol}>
          <Select label="Occasion" value={occasion} onChange={setOccasion} options={OCCASION_OPTIONS} style={styles.flex} />
          <Select label="Dress code" value={dressCode} onChange={setDressCode} options={DRESS_OPTIONS} style={styles.flex} />
        </View>
        <View style={styles.twoCol}>
          <TextField size="md" capsLabel label="Location" maxLength={80} value={location} onChangeText={setLocation} placeholder="e.g. Udaipur" containerStyle={styles.flex} />
          <TextField size="md" capsLabel label="Budget (₹)" keyboardType="number-pad" value={budget} onChangeText={(v) => setBudget(v.replace(/[^\d]/g, ""))} containerStyle={styles.flex} />
        </View>
        <TextField size="md" capsLabel multiline label="Notes" maxLength={300} value={notes} onChangeText={setNotes} placeholder={copy.plannerNotes} />
        <Button fullWidth loading={loading} loadingText="Planning…" onPress={ask}>
          {copy.plannerCta}
        </Button>
      </View>

      {error ? <Notice tone="error" style={styles.gap}>{error}</Notice> : null}

      {outfits.length > 0 && plan?.styleGuide && plan.styleGuide.length > 0 && (
        <View style={styles.rules}>
          <AppText variant="micro" color={colors.muted}>
            Style rules used:
          </AppText>
          {plan.styleGuide.map((title) => (
            <View key={title} style={styles.rule}>
              <AppText variant="micro" color={colors.subtle}>
                {title}
              </AppText>
            </View>
          ))}
        </View>
      )}

      {plan && outfits.length === 0 && (
        <View style={styles.raw}>
          <AppText variant="sm" color={colors.subtle}>
            {plan.raw}
          </AppText>
        </View>
      )}

      {outfits.map((o, i) => {
        // Only pieces the user actually owns are shown, whatever ids the model returned.
        const pieces = (o.itemIds ?? []).map((id) => byId.get(id)).filter((p): p is WardrobeItem => Boolean(p));
        const missing =
          typeof o.missing === "string"
            ? o.missing
              ? [{ item: o.missing.replace(/^Missing:\s*/i, ""), searchQuery: o.missing.replace(/^Missing:\s*/i, "") }]
              : []
            : o.missing ?? [];
        return (
          <View key={i} style={styles.outfit}>
            <View style={styles.outfitHead}>
              <AppText variant="sm" weight="medium" numberOfLines={1} style={styles.flex}>
                {o.name || `Outfit ${i + 1}`}
              </AppText>
              {o.confidence != null && (
                <View style={styles.match}>
                  <AppText variant="micro" color={colors.accentBright}>
                    {Math.round(o.confidence)}% match
                  </AppText>
                </View>
              )}
            </View>
            {pieces.length > 0 && (
              <View style={styles.pieces}>
                {pieces.map((p) => (
                  <Pressable key={p.id} onPress={() => router.navigate({ pathname: "/drape", params: { item: p.id } })} style={styles.piece} accessibilityLabel={p.name}>
                    <Photo src={p.image} alt={p.name} fit="contain" style={StyleSheet.absoluteFill} />
                  </Pressable>
                ))}
              </View>
            )}
            {o.why ? (
              <AppText variant="xs" color={colors.subtle}>
                {o.why}
              </AppText>
            ) : null}
            {missing.length > 0 && (
              <View style={styles.missing}>
                {missing.map((m) => (
                  <View key={m.item} style={styles.missingItem}>
                    <AppText variant="xs" color="#fde68a">
                      Missing: {m.item}
                      {m.estimatedPrice ? (
                        <AppText variant="xs" color={colors.muted}>
                          {" "}
                          · ~{rupees(m.estimatedPrice)}
                        </AppText>
                      ) : null}
                    </AppText>
                    <View style={styles.links}>
                      {shopLinks(m.searchQuery || m.item).map((l) => (
                        <Pressable key={l.label} onPress={() => openExternal(l.href)} style={styles.link}>
                          <AppText variant="xs" color={colors.accentBright}>
                            {l.label}
                          </AppText>
                          <ExternalLink size={12} color={colors.accentBright} />
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
            {pieces[0] && (
              <Pressable onPress={() => router.navigate({ pathname: "/drape", params: { item: pieces[0].id } })} style={styles.drape}>
                <Shirt size={12} color={colors.accentBright} />
                <AppText variant="xs" color={colors.accentBright}>
                  Drape it
                </AppText>
              </Pressable>
            )}
          </View>
        );
      })}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  form: { marginTop: 16, gap: 12 },
  twoCol: { flexDirection: "row", gap: 12 },
  gap: { marginTop: 12 },
  rules: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 16 },
  rule: { borderRadius: 999, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.glass, paddingHorizontal: 8, paddingVertical: 2 },
  raw: { marginTop: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.lineSoft, backgroundColor: "rgba(255,255,255,0.02)", padding: 12 },
  outfit: { marginTop: 12, gap: 8, borderRadius: radius.md, borderWidth: 1, borderColor: colors.lineSoft, backgroundColor: "rgba(255,255,255,0.02)", padding: 12 },
  outfitHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  match: { borderRadius: 999, backgroundColor: "rgba(102,69,235,0.25)", paddingHorizontal: 8, paddingVertical: 2 },
  pieces: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  piece: { width: 48, height: 48, borderRadius: 8, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.05)" },
  missing: { gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" },
  missingItem: { gap: 4 },
  links: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  link: { flexDirection: "row", alignItems: "center", gap: 4 },
  drape: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start" },
});
