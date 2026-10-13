import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Shirt } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Notice } from "@/components/ui/Notice";
import { Photo } from "@/components/ui/Photo";
import { Loader } from "@/components/ui/States";
import { profileContent as copy } from "@/data/studio-content";
import { sceneStops } from "@/features/drape/components/SceneGrid";
import type { TwinProfile } from "@/features/workspace/api";
import { useScenes, useTwin } from "@/features/workspace/hooks";
import { errorMessage } from "@/lib/api/client";
import { colors, radius } from "@/theme";
import { BodyForm, bodySummary, EMPTY_BODY, toNumber, type BodyValues } from "./BodyForm";

const str = (n: number | null | undefined) => (n ? String(n) : "");

function twinToBody(t: TwinProfile | null): BodyValues {
  if (!t) return EMPTY_BODY;
  return { photo: t.selfieUrl || "", gender: t.gender ?? "", age: str(t.age), heightCm: str(t.heightCm), weightKg: str(t.weightKg), skinTone: t.skinTone ?? "" };
}

/** Your selfie, body details and default Drape scene. */
export function TwinTab() {
  const { twin, loading, save } = useTwin();
  if (loading) return <Loader />;
  return <TwinEditor initial={twin} save={save} />;
}

function TwinEditor({ initial, save }: { initial: TwinProfile | null; save: ReturnType<typeof useTwin>["save"] }) {
  const [body, setBody] = useState<BodyValues>(() => twinToBody(initial));
  const scenesQuery = useScenes();
  const scenes = scenesQuery.data ?? [];
  const [sceneId, setSceneId] = useState<string | null>(initial?.backgroundId ?? null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const scene = scenes.find((b) => b.id === sceneId) ?? scenes.find((b) => b.isDefault) ?? scenes[0];

  // A new selfie is saved straight away, so it's never lost and Drape can use it at once.
  const changeBody = (next: BodyValues) => {
    setBody(next);
    if (next.photo !== body.photo) {
      save({ selfieUrl: next.photo, baseAvatarUrl: "" })
        .then(() => setNotice({ tone: "success", text: copy.saved }))
        .catch((e) => setNotice({ tone: "error", text: errorMessage(e) }));
    }
  };

  const chooseScene = (id: string) => {
    setSceneId(id);
    void save({ backgroundId: id }).catch(() => undefined);
  };

  const submit = async () => {
    setSaving(true);
    setNotice(null);
    try {
      await save({
        gender: body.gender || undefined,
        age: toNumber(body.age),
        heightCm: toNumber(body.heightCm),
        weightKg: toNumber(body.weightKg),
        skinTone: body.skinTone || undefined,
        selfieUrl: body.photo, // an empty string clears a removed selfie
        baseAvatarUrl: "",
      });
      setNotice({ tone: "success", text: copy.saved });
    } catch (e) {
      setNotice({ tone: "error", text: errorMessage(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.preview}>
        <LinearGradient colors={scene ? sceneStops(scene) : ["#1a1838", "#0d0c1f"]} style={StyleSheet.absoluteFill} />
        {scene?.imageUrl ? <Photo src={scene.imageUrl} alt="" style={StyleSheet.absoluteFill} /> : null}
        {body.photo ? (
          <Photo src={body.photo} alt="Your selfie" fit="contain" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={styles.previewEmpty}>
            <AppText variant="sm" color="rgba(255,255,255,0.7)">
              {copy.twinMissing}
            </AppText>
          </View>
        )}
      </View>
      <AppText variant="sm" color={colors.muted} align="center">
        {bodySummary({ age: toNumber(body.age), heightCm: toNumber(body.heightCm), weightKg: toNumber(body.weightKg), skinTone: body.skinTone }) || "—"}
      </AppText>
      <Button variant="light" fullWidth icon={Shirt} onPress={() => router.navigate({ pathname: "/drape", params: { person: "me" } })}>
        {`${copy.drapeOn} you`}
      </Button>

      <GlassCard>
        <AppText variant="title">{copy.twinTitle}</AppText>
        <AppText variant="sm" color={colors.muted} style={styles.sub}>
          {copy.twinDescription}
        </AppText>
        <View style={styles.form}>
          <BodyForm value={body} onChange={changeBody} />
        </View>

        {scenes.length > 0 && (
          <View style={styles.scenes}>
            <AppText variant="label" color={colors.muted}>
              {copy.background}
            </AppText>
            <View style={styles.sceneGrid}>
              {scenes.map((b) => {
                const on = scene?.id === b.id;
                return (
                  <Pressable key={b.id} onPress={() => chooseScene(b.id)} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={b.name} style={[styles.scene, on ? styles.sceneOn : styles.sceneOff]}>
                    <LinearGradient colors={sceneStops(b)} style={StyleSheet.absoluteFill} />
                    {b.imageUrl ? <Photo src={b.imageUrl} alt="" style={StyleSheet.absoluteFill} /> : null}
                    <AppText variant="micro" color="#fff" numberOfLines={2} style={styles.sceneName}>
                      {b.name}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.actions}>
          <Button loading={saving} onPress={submit}>
            {copy.save}
          </Button>
          {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  preview: { aspectRatio: 3 / 4, borderRadius: radius.panel, overflow: "hidden", borderWidth: 1, borderColor: colors.line, width: "70%", alignSelf: "center" },
  previewEmpty: { flex: 1, alignItems: "center", justifyContent: "center" },
  sub: { marginTop: 4 },
  form: { marginTop: 20 },
  scenes: { marginTop: 22, gap: 8 },
  sceneGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  scene: { width: "31%", aspectRatio: 1, borderRadius: radius.md, overflow: "hidden", justifyContent: "flex-end", padding: 6 },
  sceneOn: { borderWidth: 2, borderColor: colors.accentBright },
  sceneOff: { opacity: 0.8 },
  sceneName: { textShadowColor: "rgba(0,0,0,0.6)", textShadowRadius: 3 },
  actions: { marginTop: 24, gap: 12 },
});
