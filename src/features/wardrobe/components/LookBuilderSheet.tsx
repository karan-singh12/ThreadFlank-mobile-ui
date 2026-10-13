import { Image } from "expo-image";
import { router } from "expo-router";
import { Bookmark, Check, Shirt } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { captureRef } from "react-native-view-shot";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { Select } from "@/components/ui/Select";
import { Sheet } from "@/components/ui/Sheet";
import { TextField } from "@/components/ui/TextField";
import { OCCASIONS } from "@/data/studio-content";
import { useAuth } from "@/features/auth/AuthProvider";
import { workspaceApi, type WardrobeItem } from "@/features/workspace/api";
import { useLooksCache } from "@/features/workspace/hooks";
import { errorMessage } from "@/lib/api/client";
import { assetUrl } from "@/lib/api/config";
import { uploadFile } from "@/lib/media";
import { colors, radius } from "@/theme";

const OCCASION_OPTIONS = OCCASIONS.map((o) => ({ value: o.id, label: o.label }));

/**
 * "Create a new look from scratch": the chosen pieces laid out on a cream flat-lay board, which is
 * captured as the look's image (the web draws the same board on a canvas).
 */
export function LookBuilderSheet({ items, open, onClose }: { items: WardrobeItem[]; open: boolean; onClose: () => void }) {
  const { token } = useAuth();
  const looksCache = useLooksCache();
  const boardRef = useRef<View>(null);
  const [name, setName] = useState("");
  const [occasion, setOccasion] = useState<string>(OCCASIONS[0].id);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");
  /** Board images that have finished (loaded or failed), so the capture isn't taken half-drawn. */
  const settled = useRef(new Set<string>());
  const cols = items.length <= 2 ? Math.max(1, items.length) : items.length <= 4 ? 2 : 3;
  const ids = useMemo(() => items.map((i) => i.id).join(","), [items]);

  useEffect(() => {
    if (!open) return;
    setName(items.map((i) => i.name).slice(0, 2).join(" + ").slice(0, 60));
    setOccasion(OCCASIONS[0].id);
    setState("idle");
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ids]);

  const settle = (id: string) => settled.current.add(id);

  /** Waits (at most ~2.5 s) for the board's images before capturing it. */
  const boardReady = async () => {
    for (let waited = 0; waited < 2500 && items.some((i) => !settled.current.has(i.id)); waited += 100) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  };

  const save = async () => {
    if (!token || !items.length) return;
    setState("saving");
    setError("");
    try {
      let image = items[0].image;
      try {
        await boardReady();
        const uri = await captureRef(boardRef, { format: "png", quality: 1, result: "tmpfile" });
        image = await uploadFile(token, { uri, name: `flatlay-${Date.now()}.png`, type: "image/png" }, "looks");
      } catch {
        // If the board can't be captured, the main piece's photo stands in (as on the web).
      }
      const look = await workspaceApi.saveLook(token, { name: name.trim() || "My look", occasion, image, pieces: items.map((i) => i.name) });
      looksCache.upsert(look);
      setState("saved");
    } catch (e) {
      setError(errorMessage(e));
      setState("idle");
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Build a look"
      footer={
        state === "saved" ? (
          <View style={styles.row}>
            <Button variant="ghost" icon={Check} onPress={onClose} style={styles.flex}>
              Done
            </Button>
            <Button
              onPress={() => {
                onClose();
                router.navigate("/saved");
              }}
              style={styles.flex}
            >
              View saved looks
            </Button>
          </View>
        ) : (
          <View style={styles.row}>
            <Button icon={Bookmark} loading={state === "saving"} onPress={save} style={styles.flex}>
              Save as look
            </Button>
            {items[0] && (
              <Button
                variant="ghost"
                icon={Shirt}
                onPress={() => {
                  onClose();
                  router.navigate({ pathname: "/drape", params: { item: items[0].id } });
                }}
                style={styles.flex}
              >
                Drape it
              </Button>
            )}
          </View>
        )
      }
    >
      {/* The flat-lay board — what gets saved as the look's image. */}
      <View ref={boardRef} collapsable={false} style={styles.board}>
        <View style={styles.grid}>
          {items.map((i) => (
            <View key={i.id} style={[styles.cell, { width: `${100 / cols}%` }]}>
              <Image source={{ uri: assetUrl(i.image) }} contentFit="contain" onLoad={() => settle(i.id)} onError={() => settle(i.id)} style={styles.piece} />
            </View>
          ))}
        </View>
      </View>
      <TextField size="md" capsLabel label="Look name" maxLength={60} value={name} onChangeText={setName} />
      <Select label="Occasion" value={occasion} onChange={setOccasion} options={OCCASION_OPTIONS} />
      {state === "saved" && <Notice tone="success">Saved to your looks.</Notice>}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <AppText variant="xs" color={colors.muted}>
        The board above is saved as the look&apos;s picture.
      </AppText>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: "row", gap: 8 },
  board: { borderRadius: radius.card, overflow: "hidden", backgroundColor: "#f4f1ec", padding: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { aspectRatio: 1, padding: 6 },
  piece: { flex: 1 },
});
