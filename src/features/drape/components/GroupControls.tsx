import { router } from "expo-router";
import { Check, ChevronRight, Crown, Footprints, Gem, Glasses, Layers, Plus, Shirt, ShoppingBag, Sparkles, X, type LucideIcon } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { Photo } from "@/components/ui/Photo";
import { Sheet } from "@/components/ui/Sheet";
import { TextField } from "@/components/ui/TextField";
import { DRAPE_SLOTS, GROUP_POSTURES, drapeContent as copy, type DrapeSlot, type GroupPosture } from "@/data/studio-content";
import type { WardrobeItem } from "@/features/workspace/api";
import { baseImage, type Person } from "@/features/workspace/hooks";
import { colors, radius } from "@/theme";
import { filledPieces, postureLabel, resolvePosture, withPiece } from "../api";
import type { MemberSpec } from "../types";
import { OutfitPicker } from "./OutfitPicker";

const SLOT_ICONS: Record<DrapeSlot, LucideIcon> = {
  top: Shirt,
  bottom: Layers,
  dress: Sparkles,
  shoes: Footprints,
  eyewear: Glasses,
  headwear: Crown,
  bag: ShoppingBag,
  jewelry: Gem,
};

const displayName = (p: Person) => (p.isSelf ? "You" : p.name);
const twinRoute = (p: Person) => ({ pathname: "/profile" as const, params: { tab: p.isSelf ? "twin" : "circle" } });

/**
 * Who's in the look. You're in by default; others are added from your Twin Circle, and the
 * relation set there (Partner, Friend, Sibling…) drives the group pose.
 */
export function MemberPicker({ people, selected, max, onAdd, onRemove }: { people: Person[]; selected: Person[]; max: number; onAdd: (id: string) => void; onRemove: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const available = people.filter((p) => !selected.some((s) => s.id === p.id));
  const full = selected.length >= max;

  return (
    <View style={styles.memberRow}>
      {selected.map((p) => {
        const ready = Boolean(baseImage(p));
        return (
          <View key={p.id} style={[styles.member, !ready && styles.memberWarn, selected.length > 1 ? styles.memberWithX : null]}>
            <Avatar name={p.name} src={baseImage(p)} size={28} />
            <AppText variant="xs" weight="medium" numberOfLines={1} style={styles.memberName}>
              {displayName(p)}
            </AppText>
            {!p.isSelf && p.relation ? (
              <AppText variant="micro" color={colors.cyan}>
                {p.relation}
              </AppText>
            ) : null}
            {!ready && (
              <Pressable onPress={() => router.push(twinRoute(p))} hitSlop={6}>
                <AppText variant="micro" color="#fcd34d" style={styles.underline}>
                  {copy.setupTwin}
                </AppText>
              </Pressable>
            )}
            {selected.length > 1 && (
              <Pressable onPress={() => onRemove(p.id)} hitSlop={6} accessibilityLabel={copy.group.remove(displayName(p))} style={styles.memberX}>
                <X size={14} color={colors.muted} />
              </Pressable>
            )}
          </View>
        );
      })}

      {!full && (
        <Pressable onPress={() => setOpen(true)} style={styles.add} accessibilityLabel={copy.group.add}>
          <Plus size={14} color={colors.subtle} />
          <AppText variant="xs" color={colors.subtle}>
            {copy.group.add}
          </AppText>
        </Pressable>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title={copy.group.addFromCircle} maxHeight={0.7}>
        {available.length === 0 ? (
          <AppText variant="sm" color={colors.subtle}>
            {copy.group.circleEmpty}
          </AppText>
        ) : (
          available.map((p) => {
            const ready = Boolean(baseImage(p));
            return (
              <Pressable
                key={p.id}
                disabled={!ready}
                onPress={() => {
                  onAdd(p.id);
                  setOpen(false);
                }}
                style={({ pressed }) => [styles.option, !ready && styles.disabled, pressed && styles.pressed]}
              >
                <Avatar name={p.name} src={baseImage(p)} size={40} />
                <View style={styles.flex}>
                  <AppText variant="body">{displayName(p)}</AppText>
                  <AppText variant="xs" color={colors.muted}>
                    {p.isSelf ? copy.group.twinReady : p.relation || "Circle member"}
                  </AppText>
                </View>
                {!ready && (
                  <AppText variant="micro" color="#fcd34d">
                    {copy.group.noTwin}
                  </AppText>
                )}
              </Pressable>
            );
          })
        )}
        <Pressable
          onPress={() => {
            setOpen(false);
            router.push({ pathname: "/profile", params: { tab: "circle" } });
          }}
          style={styles.manage}
        >
          <AppText variant="sm" color={colors.accentBright}>
            {copy.group.manageCircle}
          </AppText>
          <ChevronRight size={16} color={colors.accentBright} />
        </Pressable>
      </Sheet>
    </View>
  );
}

/** Group pose chips. "Auto" shows the pose the relations resolve to. */
export function PosturePicker({ people, value, onChange }: { people: Person[]; value: GroupPosture; onChange: (p: GroupPosture) => void }) {
  const auto = resolvePosture(people, "auto");
  return (
    <View style={styles.posture}>
      <AppText variant="label" color={colors.muted}>
        {copy.group.posture}
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {GROUP_POSTURES.map((p) => (
          <Chip key={p.id} size="sm" label={p.id === "auto" && auto ? copy.group.postureAuto(postureLabel(auto)) : p.label} selected={value === p.id} onPress={() => onChange(p.id)} />
        ))}
      </ScrollView>
      <AppText variant="micro" color={colors.muted}>
        {GROUP_POSTURES.find((p) => p.id === value)?.hint ?? copy.group.postureHint}
      </AppText>
    </View>
  );
}

/** Per-person outfit: a tab per person, a grid of slots, and the picker for the active slot. */
export function MemberOutfits({
  people,
  members,
  activeId,
  onActive,
  onChange,
  wardrobe,
  wardrobeLoading,
}: {
  people: Person[];
  members: Record<string, MemberSpec>;
  activeId: string;
  onActive: (id: string) => void;
  onChange: (id: string, next: MemberSpec) => void;
  wardrobe: WardrobeItem[];
  wardrobeLoading: boolean;
}) {
  const [slot, setSlot] = useState<DrapeSlot>("top");
  const person = people.find((p) => p.id === activeId) ?? people[0];
  if (!person) return null;
  const member: MemberSpec = members[person.id] || { pieces: {}, notes: "" };
  const slotInfo = DRAPE_SLOTS.find((s) => s.id === slot)!;

  return (
    <View style={styles.outfits}>
      {people.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {people.map((p) => {
            const count = filledPieces(members[p.id]).length;
            return (
              <Chip
                key={p.id}
                size="sm"
                selected={p.id === person.id}
                onPress={() => onActive(p.id)}
                label={`${displayName(p)} · ${count ? copy.group.pieces(count) : "+"}`}
                leading={<Avatar name={p.name} src={baseImage(p)} size={20} />}
              />
            );
          })}
        </ScrollView>
      )}

      <View style={styles.slots} accessibilityRole="tablist">
        {DRAPE_SLOTS.map((s) => {
          const piece = member.pieces[s.id];
          const active = slot === s.id;
          const Icon = SLOT_ICONS[s.id];
          return (
            <View key={s.id} style={styles.slotCell}>
              <Pressable
                onPress={() => setSlot(s.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={[styles.slot, active ? styles.slotOn : piece ? styles.slotFilled : null]}
              >
                {piece?.preview ? (
                  <View style={styles.slotThumb}>
                    <Photo src={piece.preview} alt="" fit="contain" style={StyleSheet.absoluteFill} />
                  </View>
                ) : piece ? (
                  <Check size={14} strokeWidth={3} color={active ? "#059669" : colors.green} />
                ) : (
                  <Icon size={14} strokeWidth={1.75} color={active ? colors.chipOnText : colors.subtle} />
                )}
                <AppText variant="micro" weight={active ? "medium" : "regular"} color={active ? colors.chipOnText : colors.subtle} numberOfLines={1} style={styles.flexShrink}>
                  {s.label}
                </AppText>
              </Pressable>
              {piece && (
                <Pressable onPress={() => onChange(person.id, withPiece(member, s.id, null))} hitSlop={6} accessibilityLabel={`Remove ${s.label}`} style={styles.slotX}>
                  <X size={10} color="#fff" />
                </Pressable>
              )}
            </View>
          );
        })}
      </View>
      {(slot === "dress" || slot === "top" || slot === "bottom") && (
        <AppText variant="micro" color={colors.muted}>
          {copy.group.dressHint}
        </AppText>
      )}

      <View style={styles.pickerWrap}>
        <OutfitPicker
          key={`${person.id}-${slot}`}
          value={member.pieces[slot] ?? null}
          onChange={(o) => onChange(person.id, withPiece(member, slot, o ? { ...o, type: slotInfo.type ?? o.type } : null))}
          wardrobe={wardrobe}
          wardrobeLoading={wardrobeLoading}
          slotType={slotInfo.type}
          initialCategory={slotInfo.wardrobe}
        />
      </View>

      <TextField
        size="md"
        value={member.notes}
        maxLength={300}
        onChangeText={(notes) => onChange(person.id, { ...member, notes })}
        placeholder={`${copy.group.notesFor(displayName(person))}, ${copy.group.notesPlaceholder}`}
        accessibilityLabel={copy.group.notesFor(displayName(person))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  memberRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  member: {
    height: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 3,
    paddingRight: 12,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.glass,
  },
  memberWithX: { paddingRight: 4 },
  memberWarn: { borderColor: "rgba(252,211,77,0.5)" },
  memberName: { maxWidth: 110 },
  memberX: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  underline: { textDecorationLine: "underline" },
  add: {
    height: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    borderRadius: 17,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.2)",
  },
  option: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8, paddingHorizontal: 6, borderRadius: radius.md },
  disabled: { opacity: 0.5 },
  pressed: { backgroundColor: "rgba(255,255,255,0.06)" },
  manage: { flexDirection: "row", alignItems: "center", gap: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.lineSoft },
  posture: { gap: 8 },
  chips: { gap: 6 },
  outfits: { gap: 10 },
  slots: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  slotCell: { width: "23.5%" },
  slot: {
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(255,255,255,0.03)",
    overflow: "hidden",
  },
  slotOn: { backgroundColor: "rgba(242,241,250,0.95)", borderColor: "transparent" },
  slotFilled: { borderColor: "rgba(40,230,157,0.4)" },
  slotThumb: { width: 24, height: 24, borderRadius: 4, overflow: "hidden", backgroundColor: "#fff" },
  slotX: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  pickerWrap: { borderTopWidth: 1, borderTopColor: colors.lineSoft, paddingTop: 10 },
});
