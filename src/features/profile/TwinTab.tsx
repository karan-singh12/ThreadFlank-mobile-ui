import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Shirt, Sparkles } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Pressable } from "@/components/ui/Pressable";
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
import { toDataUrl } from "@/lib/media";
import { useGridTiles } from "@/lib/useGridTiles";
import { colors, radius } from "@/theme";
import { BodyForm, bodySummary, EMPTY_BODY, toNumber, type BodyValues } from "./BodyForm";

const str = (n: number | null | undefined) => (n ? String(n) : "");

function twinToBody(t: TwinProfile | null): BodyValues {
  if (!t) return EMPTY_BODY;
  return { photo: t.selfieUrl || "", gender: t.gender ?? "", age: str(t.age), heightCm: str(t.heightCm), weightKg: str(t.weightKg), skinTone: t.skinTone ?? "" };
}

/** Your selfie, body details, generated twin and default Drape scene. */
export function TwinTab() {
  const { twin, loading, save, generate } = useTwin();
  if (loading) return <Loader />;
  return <TwinEditor initial={twin} save={save} generate={generate} />;
}

function TwinEditor({
  initial,
  save,
  generate,
}: {
  initial: TwinProfile | null;
  save: ReturnType<typeof useTwin>["save"];
  generate: ReturnType<typeof useTwin>["generate"];
}) {
  const [body, setBody] = useState<BodyValues>(() => twinToBody(initial));
  const scenesQuery = useScenes();
  const scenes = scenesQuery.data ?? [];
  const [sceneId, setSceneId] = useState<string | null>(initial?.backgroundId ?? null);
  const sceneTiles = useGridTiles(3, 8, 1);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const scene = scenes.find((b) => b.id === sceneId) ?? scenes.find((b) => b.isDefault) ?? scenes[0];
  // The generated twin: a clean portrait and the full-body photo Drape dresses.
  const [built, setBuilt] = useState({ portrait: initial?.avatarUrl ?? "", body: initial?.baseAvatarUrl ?? "" });
  const [building, setBuilding] = useState(false);

  // A new selfie is saved straight away, so it's never lost and Drape can use it at once.
  // It also clears the old twin, which was built from the previous face.
  const changeBody = (next: BodyValues) => {
    setBody(next);
    if (next.photo !== body.photo) {
      setBuilt({ portrait: "", body: "" });
      save({ selfieUrl: next.photo, avatarUrl: "", baseAvatarUrl: "" })
        .then(() => setNotice({ tone: "success", text: copy.saved }))
        .catch((e) => setNotice({ tone: "error", text: errorMessage(e) }));
    }
  };

  // Builds the portrait and full-body twin from the selfie. The server stores both and saves them on the profile.
  const build = async () => {
    if (!body.photo) {
      setNotice({ tone: "error", text: copy.generate.needSelfie });
      return;
    }
    setBuilding(true);
    setNotice(null);
    try {
      const next = await generate({
        image: await toDataUrl(body.photo, 1280),
        part: "both",
        gender: body.gender || undefined,
        age: toNumber(body.age),
        heightCm: toNumber(body.heightCm),
        weightKg: toNumber(body.weightKg),
        skinTone: body.skinTone || undefined,
      });
      setBuilt({ portrait: next.avatarUrl ?? "", body: next.baseAvatarUrl ?? "" });
      setNotice({ tone: "success", text: copy.generate.done });
    } catch (e) {
      setNotice({ tone: "error", text: errorMessage(e) });
    } finally {
      setBuilding(false);
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
        {built.body || body.photo ? (
          <Photo src={built.body || body.photo} alt={built.body ? "Your full-body twin" : "Your selfie"} fit="contain" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={styles.previewEmpty}>
            <AppText variant="sm" color="rgba(255,255,255,0.7)">
              {copy.twinMissing}
            </AppText>
          </View>
        )}
        {building && (
          <View style={styles.previewBusy}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      </View>
      {built.portrait && built.body ? (
        <View style={styles.thumbs}>
          {[
            { src: built.portrait, label: copy.generate.portrait },
            { src: built.body, label: copy.generate.body },
          ].map((t) => (
            <View key={t.label} style={styles.thumbCol}>
              <View style={styles.thumb}>
                <LinearGradient colors={scene ? sceneStops(scene) : ["#1a1838", "#0d0c1f"]} style={StyleSheet.absoluteFill} />
                <Photo src={t.src} alt={t.label} fit="contain" style={StyleSheet.absoluteFill} />
              </View>
              <AppText variant="micro" color={colors.muted} align="center">
                {t.label}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
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

        <View style={styles.generate}>
          <Button icon={Sparkles} loading={building} disabled={saving || !body.photo} onPress={build}>
            {built.body ? copy.generate.redo : copy.generate.action}
          </Button>
          <AppText variant="xs" color={colors.muted}>
            {building ? copy.generate.working : body.photo ? (built.body ? copy.generate.costRedo : copy.generate.costFirst) : copy.generate.needSelfie}
          </AppText>
        </View>

        {scenes.length > 0 && (
          <View style={styles.scenes}>
            <AppText variant="label" color={colors.muted}>
              {copy.background}
            </AppText>
            <View style={styles.sceneGrid} onLayout={sceneTiles.onLayout}>
              {scenes.map((b) => {
                const on = scene?.id === b.id;
                return (
                  <Pressable key={b.id} onPress={() => chooseScene(b.id)} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={b.name} style={[styles.scene, sceneTiles.tile, on ? styles.sceneOn : styles.sceneOff]}>
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
  previewBusy: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  thumbs: { flexDirection: "row", gap: 8, width: "70%", alignSelf: "center" },
  thumbCol: { flex: 1, gap: 4 },
  thumb: { aspectRatio: 3 / 4, borderRadius: radius.md, overflow: "hidden", borderWidth: 1, borderColor: colors.line },
  generate: { marginTop: 22, gap: 8, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: "rgba(255,255,255,0.03)" },
  sub: { marginTop: 4 },
  form: { marginTop: 20 },
  scenes: { marginTop: 22, gap: 8 },
  sceneGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  scene: { borderRadius: radius.md, overflow: "hidden", justifyContent: "flex-end", padding: 6 },
  sceneOn: { borderWidth: 2, borderColor: colors.accentBright },
  sceneOff: { opacity: 0.8 },
  sceneName: { textShadowColor: "rgba(0,0,0,0.6)", textShadowRadius: 3 },
  actions: { marginTop: 24, gap: 12 },
});
