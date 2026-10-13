import { Check, Lock, Shirt, Sparkles, Unlock } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Photo } from "@/components/ui/Photo";
import { Sheet } from "@/components/ui/Sheet";
import { Swatches } from "@/components/ui/Swatches";
import type { PlanRow } from "@/features/social/api";
import { colors, radius } from "@/theme";
import { colourHex, EVENT_COLOURS } from "../hooks";

const SWATCHES = EVENT_COLOURS.map((c) => ({ name: c.name, hex: c.hex }));

/** One person's planned look for an event: photo, status, main colour, and pick / ideas / lock actions. */
export function PlanCard({
  plan,
  warned,
  busy,
  onPick,
  onSuggest,
  onColour,
  onLock,
}: {
  plan: PlanRow;
  warned: boolean;
  busy: boolean;
  onPick: () => void;
  onSuggest: () => void;
  onColour: (c: string | null) => void;
  onLock: () => void;
}) {
  const [colourOpen, setColourOpen] = useState(false);
  const locked = plan.status === "LOCKED";
  const image = plan.look?.image ?? plan.person.twin ?? plan.person.avatar;

  return (
    <View style={[styles.card, warned && styles.warned]}>
      <View style={styles.media}>
        {image ? (
          <Photo src={image} alt={plan.person.name} style={[StyleSheet.absoluteFill, !plan.look && styles.faded]} />
        ) : (
          <View style={styles.initial}>
            <AppText style={styles.initialText} color={colors.muted}>
              {plan.person.name.charAt(0)}
            </AppText>
          </View>
        )}
        {!plan.look && (
          <AppText variant="xs" color="rgba(255,255,255,0.8)" align="center" style={styles.noLook}>
            No look picked yet
          </AppText>
        )}
        <View style={[styles.status, locked ? styles.statusLocked : styles.statusPlanning]}>
          {locked && <Lock size={12} color={colors.canvas} />}
          <AppText variant="micro" weight="medium" color={locked ? colors.canvas : "#fff"}>
            {locked ? "Locked in" : "Planning"}
          </AppText>
        </View>
        {plan.color && (
          <View style={styles.colour}>
            <View style={[styles.colourDot, { backgroundColor: colourHex(plan.color) ?? plan.color }]} />
            <AppText variant="micro" color="#fff">
              {plan.color}
            </AppText>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <AppText variant="sm" weight="medium" numberOfLines={1}>
          {plan.person.isMe ? "You" : plan.person.name}
          {plan.look ? (
            <AppText variant="sm" color={colors.muted}>
              {" "}
              · {plan.look.name}
            </AppText>
          ) : null}
        </AppText>

        {plan.canEdit ? (
          <>
            <Pressable onPress={() => setColourOpen(true)} disabled={busy || locked} style={[styles.colourField, (busy || locked) && styles.disabled]}>
              <AppText variant="xs" color={plan.color ? colors.ink : colors.muted}>
                {plan.color ? `Main colour · ${plan.color}` : "Main colour…"}
              </AppText>
            </Pressable>
            <View style={styles.actions}>
              <Pressable onPress={onPick} disabled={busy || locked} style={[styles.action, (busy || locked) && styles.disabled]}>
                <Shirt size={14} color="#fff" />
                <AppText variant="xs" color="#fff">
                  {plan.look ? "Change" : "Pick look"}
                </AppText>
              </Pressable>
              {plan.person.isMe && (
                <Pressable onPress={onSuggest} disabled={busy || locked} style={[styles.action, (busy || locked) && styles.disabled]}>
                  <Sparkles size={14} color="#fff" />
                  <AppText variant="xs" color="#fff">
                    Ideas
                  </AppText>
                </Pressable>
              )}
              <Pressable onPress={onLock} disabled={busy || (!locked && !plan.lookId)} style={[styles.action, styles.lock, (busy || (!locked && !plan.lookId)) && styles.dimmer]}>
                {busy ? <ActivityIndicator size="small" color="#fff" /> : locked ? <Unlock size={14} color="#fff" /> : <Check size={14} color="#fff" />}
                <AppText variant="xs" color="#fff">
                  {locked ? "Unlock" : "Lock in"}
                </AppText>
              </Pressable>
            </View>
          </>
        ) : (
          <AppText variant="xs" color={colors.muted}>
            {plan.person.kind === "PROFILE" ? "Planned by the circle owner" : "They pick their own look"}
          </AppText>
        )}
      </View>

      <Sheet open={colourOpen} onClose={() => setColourOpen(false)} title="Main colour" maxHeight={0.6}>
        <Swatches
          label="Colour"
          options={SWATCHES}
          value={colourHex(plan.color) ?? null}
          allowNone
          onChange={(hex) => {
            onColour(hex ? EVENT_COLOURS.find((c) => c.hex === hex)?.name ?? null : null);
            setColourOpen(false);
          }}
        />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: radius.panel, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(102,69,235,0.08)" },
  warned: { borderColor: "rgba(252,211,77,0.6)" },
  media: { aspectRatio: 3 / 4, backgroundColor: "rgba(255,255,255,0.04)" },
  faded: { opacity: 0.6 },
  initial: { flex: 1, alignItems: "center", justifyContent: "center" },
  initialText: { fontSize: 32, lineHeight: 40 },
  noLook: { position: "absolute", left: 0, right: 0, bottom: 12 },
  status: { position: "absolute", top: 8, left: 8, flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  statusLocked: { backgroundColor: "rgba(40,230,157,0.9)" },
  statusPlanning: { backgroundColor: "rgba(0,0,0,0.6)" },
  colour: { position: "absolute", top: 8, right: 8, flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 8, paddingVertical: 2 },
  colourDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },
  body: { padding: 10, gap: 8 },
  colourField: { height: 32, justifyContent: "center", paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.glass },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  action: { height: 32, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)" },
  lock: { backgroundColor: colors.accentBright },
  disabled: { opacity: 0.5 },
  dimmer: { opacity: 0.4 },
});
