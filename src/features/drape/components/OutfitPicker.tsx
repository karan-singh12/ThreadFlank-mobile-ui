import { router } from "expo-router";
import { Camera, ImagePlus, Link2, PenLine, Shirt, Sparkles, X, type LucideIcon } from "lucide-react-native";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Chip, Segmented, TabSwitch } from "@/components/ui/Chip";
import { Notice } from "@/components/ui/Notice";
import { Photo } from "@/components/ui/Photo";
import { Keycap } from "@/components/ui/Step";
import { TextField } from "@/components/ui/TextField";
import { ETHNIC_GARMENTS } from "@/data/garment-kinds";
import { GARMENT_TYPES, drapeContent as copy, type GarmentType } from "@/data/studio-content";
import type { WardrobeItem } from "@/features/workspace/api";
import { errorMessage } from "@/lib/api/client";
import { pickImage } from "@/lib/media";
import { colors, radius } from "@/theme";
import { fetchGarmentImage, hostOf, outfitFromItem } from "../api";
import type { Outfit, OutfitSource } from "../types";

const SOURCES: { id: OutfitSource; label: string; icon: LucideIcon }[] = [
  { id: "link", label: copy.sources.link, icon: Link2 },
  { id: "upload", label: copy.sources.upload, icon: ImagePlus },
  { id: "wardrobe", label: copy.sources.wardrobe, icon: Shirt },
  { id: "describe", label: copy.sources.describe, icon: PenLine },
];

const SOURCE_NAMES: Record<OutfitSource, string> = { link: "From a link", upload: "Your photo", wardrobe: "From your wardrobe", describe: "Described" };

/**
 * Pick a garment from a store link, a photo, the wardrobe or a description. `slotType` comes from the
 * outfit slot: a type limits the Indian-wear kinds to it, and null (accessories) hides them.
 */
export function OutfitPicker({
  value,
  onChange,
  wardrobe,
  wardrobeLoading,
  slotType,
  initialCategory,
}: {
  value: Outfit | null;
  onChange: (next: Outfit | null) => void;
  wardrobe: WardrobeItem[];
  wardrobeLoading: boolean;
  slotType?: GarmentType | null;
  initialCategory?: string | null;
}) {
  const [source, setSource] = useState<OutfitSource>(value?.source ?? (initialCategory && wardrobe.length ? "wardrobe" : "link"));
  const [link, setLink] = useState("");
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [category, setCategory] = useState(initialCategory && wardrobe.some((i) => i.category === initialCategory) ? initialCategory : "All");
  const [described, setDescribed] = useState(value?.source === "describe" ? value.prompt ?? "" : "");
  const kinds = slotType === undefined ? ETHNIC_GARMENTS : slotType === null ? [] : ETHNIC_GARMENTS.filter((k) => k.category === slotType);

  const categories = useMemo(() => ["All", ...Array.from(new Set(wardrobe.map((i) => i.category).filter(Boolean)))], [wardrobe]);
  const shownItems = category === "All" ? wardrobe : wardrobe.filter((i) => i.category === category);
  const garment = value && value.source !== "describe" ? value : null;

  const fetchLink = async () => {
    const url = link.trim();
    if (!url) return;
    setLinkBusy(true);
    setLinkError("");
    try {
      const image = await fetchGarmentImage(url);
      onChange({ source: "link", preview: image, label: hostOf(url), type: value?.type ?? "upper_body" });
    } catch (e) {
      setLinkError(errorMessage(e));
    } finally {
      setLinkBusy(false);
    }
  };

  const pick = async (from: "camera" | "library") => {
    const file = await pickImage({ source: from });
    if (file) onChange({ source: "upload", preview: file.uri, label: file.name, type: value?.type ?? "upper_body" });
  };

  const describe = (text: string) => {
    setDescribed(text);
    const clean = text.trim();
    onChange(clean.length >= 3 ? { source: "describe", preview: "", label: clean.slice(0, 48), prompt: clean, type: value?.type ?? "dresses" } : null);
  };

  return (
    <View style={styles.wrap}>
      <TabSwitch value={source} onChange={setSource} options={SOURCES} />

      {source === "link" && (
        <View style={styles.section}>
          <View style={styles.linkRow}>
            <TextField
              size="md"
              icon={Link2}
              value={link}
              onChangeText={setLink}
              placeholder={copy.linkPlaceholder}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={fetchLink}
              containerStyle={styles.flex}
              accessibilityLabel={copy.sources.link}
            />
            <Button size="md" loading={linkBusy} onPress={fetchLink} disabled={!link.trim()}>
              {copy.fetch}
            </Button>
          </View>
          <AppText variant="xs" color={colors.muted}>
            {copy.linkHint}
          </AppText>
          {linkError ? <Notice tone="error">{linkError}</Notice> : null}
        </View>
      )}

      {source === "upload" && (
        <View style={styles.drop}>
          <Keycap icon={ImagePlus} size={36} iconSize={16} />
          <AppText variant="sm" weight="medium">
            Add an outfit photo
          </AppText>
          <AppText variant="xs" color={colors.muted} align="center">
            {copy.uploadHint}
          </AppText>
          <View style={styles.dropActions}>
            <Button variant="glass" size="sm" icon={Camera} onPress={() => pick("camera")}>
              Camera
            </Button>
            <Button variant="glass" size="sm" icon={ImagePlus} onPress={() => pick("library")}>
              Gallery
            </Button>
          </View>
        </View>
      )}

      {source === "wardrobe" &&
        (wardrobeLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.accentBright} />
          </View>
        ) : wardrobe.length === 0 ? (
          <View style={styles.emptyWardrobe}>
            <Shirt size={24} color={colors.muted} strokeWidth={1.5} />
            <AppText variant="sm" color={colors.subtle}>
              {copy.wardrobeEmpty}
            </AppText>
            <Pressable onPress={() => router.navigate("/wardrobe")}>
              <AppText variant="sm" color={colors.accentBright}>
                Add items →
              </AppText>
            </Pressable>
          </View>
        ) : (
          <View style={styles.section}>
            {categories.length > 2 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {categories.map((c) => (
                  <Chip key={c} size="sm" label={c} selected={category === c} onPress={() => setCategory(c)} />
                ))}
              </ScrollView>
            )}
            <ScrollView style={styles.itemsScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              <View style={styles.items}>
                {shownItems.map((i) => {
                  const active = value?.itemId === i.id;
                  return (
                    <Pressable
                      key={i.id}
                      onPress={() => onChange(active ? null : outfitFromItem(i))}
                      accessibilityLabel={i.name}
                      accessibilityState={{ selected: active }}
                      style={[styles.item, active && styles.itemOn]}
                    >
                      <Photo src={i.image} alt={i.name} fit="contain" style={StyleSheet.absoluteFill} />
                      <View style={styles.itemLabel}>
                        <AppText variant="micro" color="rgba(255,255,255,0.9)" numberOfLines={1} style={styles.tiny}>
                          {i.name}
                        </AppText>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        ))}

      {source === "describe" && (
        <View style={styles.section}>
          <TextField
            size="md"
            multiline
            icon={PenLine}
            value={described}
            onChangeText={describe}
            maxLength={400}
            placeholder={copy.describePlaceholder}
            accessibilityLabel={copy.sources.describe}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {copy.describeExamples.map((ex) => (
              <Pressable key={ex} onPress={() => describe(ex)} style={styles.example}>
                <Sparkles size={12} color={colors.accentBright} />
                <AppText variant="xs" color={colors.subtle}>
                  {ex}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
          <AppText variant="xs" color={colors.muted}>
            {copy.describeHint}
          </AppText>
        </View>
      )}

      {garment && (
        <View style={styles.chosen}>
          <View style={styles.chosenThumb}>
            <Photo src={garment.preview} alt="" fit="contain" style={StyleSheet.absoluteFill} />
          </View>
          <View style={styles.flex}>
            <AppText variant="sm" weight="medium" numberOfLines={1}>
              {garment.label}
            </AppText>
            <AppText variant="xs" color={colors.muted} numberOfLines={1}>
              {SOURCE_NAMES[garment.source]} · {GARMENT_TYPES.find((g) => g.id === garment.type)?.label}
              {garment.kind ? ` · ${ETHNIC_GARMENTS.find((k) => k.id === garment.kind)?.label}` : ""}
            </AppText>
          </View>
          <Pressable onPress={() => onChange(null)} hitSlop={8} accessibilityLabel={copy.removeOutfit} style={styles.remove}>
            <X size={16} color={colors.muted} />
          </Pressable>
        </View>
      )}

      {garment && slotType === undefined && (
        <View style={styles.section}>
          <AppText variant="label" color={colors.muted}>
            {copy.steps.garment}
          </AppText>
          <Segmented size="sm" value={garment.type} onChange={(type) => onChange({ ...garment, type, kind: undefined })} options={GARMENT_TYPES} />
        </View>
      )}

      {garment && kinds.length > 0 && (
        <View style={styles.section}>
          <AppText variant="label" color={colors.muted}>
            {copy.indianWear}
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {kinds.map((k) => {
              const active = garment.kind === k.id;
              return (
                <Chip
                  key={k.id}
                  size="sm"
                  label={k.label}
                  selected={active}
                  onPress={() => onChange(active ? { ...garment, kind: undefined } : { ...garment, kind: k.id, type: k.category })}
                />
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  section: { gap: 8 },
  flex: { flex: 1 },
  linkRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  drop: {
    alignItems: "center",
    gap: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.02)",
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  dropActions: { flexDirection: "row", gap: 8, marginTop: 6 },
  loading: { height: 96, alignItems: "center", justifyContent: "center" },
  emptyWardrobe: { alignItems: "center", gap: 8, borderRadius: radius.card, borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(255,255,255,0.12)", paddingVertical: 24 },
  chips: { gap: 6 },
  itemsScroll: { maxHeight: 220 },
  items: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  item: { width: "23.5%", aspectRatio: 3 / 4, borderRadius: radius.md, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 2, borderColor: "transparent" },
  itemOn: { borderColor: "rgba(255,255,255,0.9)" },
  itemLabel: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 4, paddingVertical: 3, backgroundColor: "rgba(0,0,0,0.55)" },
  tiny: { fontSize: 10 },
  example: { height: 30, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, borderRadius: 15, borderWidth: 1, borderColor: colors.line },
  chosen: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(127,98,246,0.25)",
    backgroundColor: "rgba(102,69,235,0.07)",
    padding: 6,
    paddingRight: 8,
  },
  chosenThumb: { width: 40, height: 40, borderRadius: 8, overflow: "hidden", backgroundColor: "#fff" },
  remove: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
});
