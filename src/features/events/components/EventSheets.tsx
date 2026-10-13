import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Notice } from "@/components/ui/Notice";
import { Photo } from "@/components/ui/Photo";
import { Sheet } from "@/components/ui/Sheet";
import { useAuth } from "@/features/auth/AuthProvider";
import { socialApi } from "@/features/social/api";
import type { PlannedOutfit } from "@/features/workspace/api";
import { useLooks, useWardrobe } from "@/features/workspace/hooks";
import { errorMessage } from "@/lib/api/client";
import { colors, radius } from "@/theme";

/** Pick one of your saved looks for an event plan (tap the current one again to clear it). */
export function LookPickerSheet({ open, title, current, onClose, onPick }: { open: boolean; title: string; current: string | null; onClose: () => void; onPick: (lookId: string | null) => Promise<void> }) {
  const looks = useLooks();
  const [saving, setSaving] = useState<string | null>(null);
  const list = looks.data ?? [];

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {looks.isLoading ? (
        <ActivityIndicator color={colors.accentBright} />
      ) : list.length === 0 ? (
        <Notice>
          <View style={styles.noticeBody}>
            <AppText variant="sm" color={colors.subtle}>
              You have no saved looks yet.
            </AppText>
            <Pressable
              onPress={() => {
                onClose();
                router.navigate("/drape");
              }}
            >
              <AppText variant="sm" color={colors.accentBright}>
                Create one in Drape
              </AppText>
            </Pressable>
          </View>
        </Notice>
      ) : (
        <View style={styles.grid}>
          {list.map((l) => (
            <Pressable
              key={l.id}
              disabled={Boolean(saving)}
              onPress={async () => {
                setSaving(l.id);
                try {
                  await onPick(l.id === current ? null : l.id);
                } finally {
                  setSaving(null);
                }
              }}
              style={[styles.look, l.id === current && styles.lookOn]}
            >
              <View style={styles.lookImage}>
                <Photo src={l.image} alt={l.name} style={StyleSheet.absoluteFill} />
                {saving === l.id && (
                  <View style={styles.saving}>
                    <ActivityIndicator color="#fff" />
                  </View>
                )}
              </View>
              <AppText variant="xs" numberOfLines={1} style={styles.lookName}>
                {l.name}
              </AppText>
            </Pressable>
          ))}
        </View>
      )}
    </Sheet>
  );
}

/** AI outfit ideas for one plan, built from the planner agent and your wardrobe. */
export function SuggestionsSheet({ open, eventId, planId, onClose }: { open: boolean; eventId: string; planId: string | null; onClose: () => void }) {
  const { token } = useAuth();
  const wardrobe = useWardrobe();
  const query = useQuery({
    queryKey: ["event-suggest", token, eventId, planId],
    queryFn: () => socialApi.suggestPlan(token!, eventId, planId!),
    enabled: Boolean(open && token && planId),
    staleTime: Infinity,
    retry: false,
  });
  const outfits = (query.data?.outfits?.outfits ?? []) as PlannedOutfit[];
  const byId = new Map((wardrobe.data ?? []).map((i) => [i.id, i]));

  return (
    <Sheet open={open} onClose={onClose} title="AI outfit ideas for this event">
      {query.isError ? (
        <Notice tone="error">{errorMessage(query.error)}</Notice>
      ) : query.isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accentBright} />
          <AppText variant="sm" color={colors.muted}>
            Reading your wardrobe…
          </AppText>
        </View>
      ) : outfits.length === 0 ? (
        <AppText variant="sm" color={colors.subtle}>
          {query.data?.raw}
        </AppText>
      ) : (
        <>
          {outfits.map((o, i) => (
            <View key={i} style={styles.outfit}>
              <AppText variant="sm" weight="medium">
                {o.name || `Option ${i + 1}`}
                {o.confidence != null ? (
                  <AppText variant="xs" color={colors.accentBright}>
                    {"  "}
                    {Math.round(o.confidence)}% match
                  </AppText>
                ) : null}
              </AppText>
              <View style={styles.pieces}>
                {o.itemIds
                  .map((id) => byId.get(id))
                  .map((p) =>
                    p ? (
                      <Pressable
                        key={p.id}
                        onPress={() => {
                          onClose();
                          router.navigate({ pathname: "/drape", params: { item: p.id } });
                        }}
                        style={styles.piece}
                        accessibilityLabel={p.name}
                      >
                        <Photo src={p.image} alt={p.name} fit="contain" style={StyleSheet.absoluteFill} />
                      </Pressable>
                    ) : null
                  )}
              </View>
              {o.why ? (
                <AppText variant="xs" color={colors.subtle}>
                  {o.why}
                </AppText>
              ) : null}
              {Array.isArray(o.missing) && o.missing.length > 0 && (
                <AppText variant="xs" color="#fde68a">
                  Missing: {o.missing.map((m) => m.item).join(", ")}
                </AppText>
              )}
            </View>
          ))}
          <AppText variant="xs" color={colors.muted}>
            Drape a piece, save the look, then pick it for this event.
          </AppText>
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  noticeBody: { gap: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  look: { width: "31%", borderRadius: radius.md, overflow: "hidden", borderWidth: 1, borderColor: colors.line },
  lookOn: { borderColor: colors.accentBright, borderWidth: 2 },
  lookImage: { aspectRatio: 3 / 4, backgroundColor: colors.glass },
  saving: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  lookName: { paddingHorizontal: 8, paddingVertical: 6 },
  loading: { flexDirection: "row", alignItems: "center", gap: 10 },
  outfit: { gap: 8, borderRadius: radius.md, borderWidth: 1, borderColor: colors.lineSoft, backgroundColor: "rgba(255,255,255,0.02)", padding: 12 },
  pieces: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  piece: { width: 56, height: 56, borderRadius: 8, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.05)" },
});
