import { router } from "expo-router";
import { Check, Layers, MapPin, Shirt, Sparkles } from "lucide-react-native";
import { useMemo, useState, type ReactNode } from "react";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Pressable } from "@/components/ui/Pressable";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { Notice } from "@/components/ui/Notice";
import { Photo } from "@/components/ui/Photo";
import { useAuth } from "@/features/auth/AuthProvider";
import { workspaceApi, type OccasionPlan, type PlannedOutfit, type WardrobeItem } from "@/features/workspace/api";
import { openExternal } from "@/lib/links";
import { colors, fonts, radius } from "@/theme";

// Same planner as the web's Wardrobe → Outfit Planner (User-Panel/src/features/wardrobe/OccasionPlannerView.tsx).
const OCCASIONS = [
  { id: "wedding", label: "Wedding" },
  { id: "festive", label: "Festive" },
  { id: "gala", label: "Cocktail & Gala" },
  { id: "party", label: "Night Out" },
  { id: "corporate", label: "Corporate" },
  { id: "date", label: "Date Night" },
  { id: "vacation", label: "Vacation" },
  { id: "casual", label: "Casual" },
] as const;
const WEDDING_EVENTS = ["Haldi", "Mehendi", "Sangeet", "Phere / Wedding", "Reception", "Cocktail"];
const WEDDING_ROLES = ["Bride / Groom", "Immediate Family", "Close Friend", "Guest"];
const WEDDING_DURATIONS = ["1 Day", "2 Days", "3 Days", "4+ Days"];
const SOURCING_OPTIONS = [
  { id: "wardrobe_only", label: "Wardrobe only", hint: "Style 100% from your closet" },
  { id: "mix_match", label: "Smart Mix & Match", hint: "Match wardrobe with key additions" },
  { id: "new_purchase", label: "Curate New", hint: "Fresh brand recommendations" },
] as const;
const FESTIVE_TYPES = ["Diwali", "Eid", "Navratri", "Pooja", "Celebration"];

const shopLinks = (q: string) => [
  { label: "Myntra", href: `https://www.myntra.com/${encodeURIComponent(q.trim().replace(/\s+/g, "-"))}` },
  { label: "Nykaa Fashion", href: `https://www.nykaafashion.com/catalogsearch/result/?q=${encodeURIComponent(q)}` },
  { label: "Amazon", href: `https://www.amazon.in/s?k=${encodeURIComponent(q)}` },
];

/** A numbered step of the planner form. */
function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <GlassCard>
      <View style={styles.stepHead}>
        <View style={styles.keycap}>
          <AppText variant="xs" color="#c9bcff">
            {n}
          </AppText>
        </View>
        <AppText variant="sm" weight="medium">
          {title}
        </AppText>
      </View>
      <View style={styles.stepBody}>{children}</View>
    </GlassCard>
  );
}

function Label({ children }: { children: string }) {
  return (
    <AppText variant="label" color={colors.muted}>
      {children.toUpperCase()}
    </AppText>
  );
}

function Chips<T extends string>({ options, active, onPick, check }: { options: readonly T[]; active: (v: T) => boolean; onPick: (v: T) => void; check?: boolean }) {
  return (
    <View style={styles.wrap}>
      {options.map((o) => (
        <Chip key={o} size="sm" label={o} selected={active(o)} icon={check && active(o) ? Check : undefined} onPress={() => onPick(o)} />
      ))}
    </View>
  );
}

export function OccasionPlanner({ items }: { items: WardrobeItem[] }) {
  const { token } = useAuth();
  const [selectedOccasion, setSelectedOccasion] = useState<string>("wedding");
  const [weddingDuration, setWeddingDuration] = useState("3 Days");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["Sangeet", "Phere / Wedding", "Reception"]);
  const [weddingRole, setWeddingRole] = useState("Close Friend");
  const [festiveType, setFestiveType] = useState("Diwali");
  const [sourcingStrategy, setSourcingStrategy] = useState<string>("mix_match");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [dressCode, setDressCode] = useState("");
  const [plan, setPlan] = useState<OccasionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const toggleEvent = (evt: string) => setSelectedEvents((prev) => (prev.includes(evt) ? (prev.length > 1 ? prev.filter((e) => e !== evt) : prev) : [...prev, evt]));

  const executePlan = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    setPlan(null);
    const occasionLabel = OCCASIONS.find((o) => o.id === selectedOccasion)?.label ?? selectedOccasion;
    const contextParts: string[] = [`Occasion: ${occasionLabel}`];
    if (selectedOccasion === "wedding") {
      contextParts.push(`Duration: ${weddingDuration}`, `Ceremonies: ${selectedEvents.join(", ")}`, `Role: ${weddingRole}`);
    } else if (selectedOccasion === "festive") {
      contextParts.push(`Festive Occasion: ${festiveType}`);
    }
    const strat = SOURCING_OPTIONS.find((s) => s.id === sourcingStrategy);
    contextParts.push(`Sourcing: ${strat?.label} (${strat?.hint})`);
    try {
      setPlan(
        await workspaceApi.planOccasion(token, {
          eventType: occasionLabel,
          dressCode: dressCode.trim() || undefined,
          location: location.trim() || undefined,
          budget: budget ? Math.round(Number(budget)) : undefined,
          notes: contextParts.join(" | "),
        })
      );
    } catch {
      setError("Unable to generate outfit plan. Please check your network and try again.");
    } finally {
      setLoading(false);
    }
  };

  const outfits: PlannedOutfit[] = plan?.outfits?.outfits ?? [];

  return (
    <View style={styles.col}>
      <Step n={1} title="What's the occasion?">
        <View style={styles.wrap}>
          {OCCASIONS.map((o) => (
            <Chip key={o.id} size="sm" label={o.label} selected={selectedOccasion === o.id} onPress={() => setSelectedOccasion(o.id)} />
          ))}
        </View>
        {selectedOccasion === "wedding" && (
          <View style={styles.sub}>
            <View style={styles.field}>
              <Label>How long</Label>
              <Chips options={WEDDING_DURATIONS} active={(d) => weddingDuration === d} onPick={setWeddingDuration} />
            </View>
            <View style={styles.field}>
              <Label>Ceremonies to style</Label>
              <Chips options={WEDDING_EVENTS} active={(e) => selectedEvents.includes(e)} onPick={toggleEvent} check />
            </View>
            <View style={styles.field}>
              <Label>Your role</Label>
              <Chips options={WEDDING_ROLES} active={(r) => weddingRole === r} onPick={setWeddingRole} />
            </View>
          </View>
        )}
        {selectedOccasion === "festive" && (
          <View style={[styles.sub, styles.field]}>
            <Label>Which festival</Label>
            <Chips options={FESTIVE_TYPES} active={(f) => festiveType === f} onPick={setFestiveType} />
          </View>
        )}
      </Step>

      <Step n={2} title="Where should the outfits come from?">
        <View style={styles.col}>
          {SOURCING_OPTIONS.map((opt) => {
            const on = sourcingStrategy === opt.id;
            return (
              <Pressable key={opt.id} onPress={() => setSourcingStrategy(opt.id)} accessibilityRole="radio" accessibilityState={{ selected: on }} style={[styles.source, on ? styles.sourceOn : styles.sourceOff]}>
                <AppText variant="sm" weight="medium">
                  {opt.label}
                </AppText>
                <AppText variant="xs" color={colors.muted}>
                  {opt.hint}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </Step>

      <Step n={3} title="A few details">
        <View style={styles.col}>
          <View style={styles.input}>
            <MapPin size={16} color={colors.muted} />
            <TextInput value={location} onChangeText={setLocation} maxLength={80} placeholder="City, e.g. Udaipur" placeholderTextColor={colors.muted} style={styles.inputText} accessibilityLabel="City" />
          </View>
          <View style={styles.input}>
            <AppText variant="sm" color={colors.muted}>
              ₹
            </AppText>
            <TextInput value={budget} onChangeText={(v) => setBudget(v.replace(/[^\d]/g, ""))} keyboardType="number-pad" placeholder="Budget (optional)" placeholderTextColor={colors.muted} style={styles.inputText} accessibilityLabel="Budget in rupees" />
          </View>
          <View style={styles.input}>
            <TextInput value={dressCode} onChangeText={setDressCode} maxLength={120} placeholder="Dress code, e.g. Traditional, Pastel, Indo-Western" placeholderTextColor={colors.muted} style={styles.inputText} accessibilityLabel="Dress code" />
          </View>
        </View>
      </Step>

      {error ? <Notice tone="error">{error}</Notice> : null}

      <Button size="lg" fullWidth icon={Sparkles} loading={loading} loadingText="Planning your looks…" onPress={executePlan}>
        Plan my outfits
      </Button>

      {/* Results */}
      <View style={styles.results}>
        <GradientText variant="h3" tone="chromeSoft">
          Your looks
        </GradientText>
        <AppText variant="sm" color={colors.muted}>
          {outfits.length > 0 ? `${outfits.length} tailored ${outfits.length === 1 ? "combination" : "combinations"}` : "They'll appear here"}
        </AppText>
      </View>

      {!loading && outfits.length === 0 && !plan && (
        <GlassCard padding={28}>
          <View style={styles.emptyResult}>
            <View style={styles.emptyIcon}>
              <Layers size={22} color="#c9bcff" strokeWidth={1.75} />
            </View>
            <AppText variant="sm" color={colors.muted} align="center">
              Pick an occasion, add a few details, then tap “Plan my outfits”.
            </AppText>
          </View>
        </GlassCard>
      )}

      {!loading && plan && outfits.length === 0 && (
        <GlassCard>
          <AppText variant="sm" color={colors.subtle}>
            {plan.raw}
          </AppText>
        </GlassCard>
      )}

      {!loading && plan?.styleGuide && plan.styleGuide.length > 0 && (
        <View style={styles.wrap}>
          <AppText variant="xs" color={colors.muted}>
            Style rules applied
          </AppText>
          {plan.styleGuide.map((rule) => (
            <View key={rule} style={styles.rule}>
              <AppText variant="micro" color={colors.subtle}>
                {rule}
              </AppText>
            </View>
          ))}
        </View>
      )}

      {!loading &&
        outfits.map((outfit, idx) => {
          const pieces = (outfit.itemIds ?? []).map((id) => byId.get(id)).filter((p): p is WardrobeItem => Boolean(p));
          const missing =
            typeof outfit.missing === "string"
              ? outfit.missing
                ? [{ item: outfit.missing.replace(/^Missing:\s*/i, ""), searchQuery: outfit.missing.replace(/^Missing:\s*/i, "") }]
                : []
              : outfit.missing ?? [];
          return (
            <GlassCard key={idx}>
              <View style={styles.outfitHead}>
                <AppText variant="body" weight="medium" style={styles.flex}>
                  {outfit.name || `Look ${idx + 1}`}
                </AppText>
                {outfit.confidence != null && (
                  <View style={styles.match}>
                    <AppText variant="micro" weight="medium" color="#f6c453">
                      {Math.round(outfit.confidence)}% match
                    </AppText>
                  </View>
                )}
              </View>
              {pieces.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pieces}>
                  {pieces.map((p) => (
                    <View key={p.id} style={styles.pieceCol}>
                      <View style={styles.piece}>
                        <Photo src={p.image} alt={p.name} fit="contain" style={StyleSheet.absoluteFill} />
                      </View>
                      <AppText variant="micro" color={colors.subtle} numberOfLines={1}>
                        {p.name}
                      </AppText>
                    </View>
                  ))}
                </ScrollView>
              )}
              {outfit.why ? (
                <AppText variant="sm" color={colors.subtle} style={styles.why}>
                  {outfit.why}
                </AppText>
              ) : null}
              {missing.length > 0 && (
                <View style={styles.missing}>
                  <AppText variant="label" color="#f6c453">
                    WORTH ADDING
                  </AppText>
                  {missing.map((m, mIdx) => (
                    <View key={mIdx} style={styles.missingRow}>
                      <AppText variant="sm">{m.item}</AppText>
                      <View style={styles.wrap}>
                        {shopLinks(m.searchQuery || m.item).map((sl) => (
                          <Chip key={sl.label} size="sm" label={sl.label} onPress={() => openExternal(sl.href)} />
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              )}
              {pieces[0] && (
                <Button fullWidth icon={Shirt} style={styles.why} onPress={() => router.navigate({ pathname: "/drape", params: { item: pieces[0].id } })}>
                  Drape this look
                </Button>
              )}
            </GlassCard>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  col: { gap: 12 },
  wrap: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  stepHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  keycap: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(201,188,255,0.3)", backgroundColor: "rgba(102,69,235,0.15)" },
  stepBody: { marginTop: 16 },
  sub: { marginTop: 18, paddingTop: 18, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)", gap: 18 },
  field: { gap: 8 },
  source: { borderRadius: radius.card, padding: 14, gap: 4 },
  sourceOn: { backgroundColor: "rgba(102,69,235,0.2)", borderWidth: 1.5, borderColor: "rgba(171,154,255,0.7)" },
  sourceOff: { backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  input: { height: 48, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.04)", paddingHorizontal: 18 },
  inputText: { flex: 1, color: colors.ink, fontFamily: fonts.regular, fontSize: 14 },
  results: { marginTop: 12, gap: 4 },
  emptyResult: { alignItems: "center", gap: 16 },
  emptyIcon: { width: 56, height: 56, borderRadius: radius.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(201,188,255,0.3)", backgroundColor: "rgba(102,69,235,0.15)" },
  rule: { borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.04)", paddingHorizontal: 10, paddingVertical: 4 },
  outfitHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  match: { borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(246,196,83,0.3)", backgroundColor: "rgba(246,196,83,0.15)", paddingHorizontal: 10, paddingVertical: 4 },
  pieces: { gap: 12, marginTop: 14 },
  pieceCol: { width: 96, gap: 6 },
  piece: { aspectRatio: 3 / 4, borderRadius: radius.md, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", backgroundColor: "#13122e" },
  why: { marginTop: 14 },
  missing: { marginTop: 14, gap: 10, borderRadius: radius.card, borderWidth: 1, borderColor: "rgba(246,196,83,0.2)", backgroundColor: "rgba(246,196,83,0.06)", padding: 14 },
  missingRow: { gap: 6 },
});
