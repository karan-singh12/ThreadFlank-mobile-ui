import Slider from "@react-native-community/slider";
import { router } from "expo-router";
import { Bookmark, Check, Download, Film, Palette, RotateCcw, Share2, Undo2 } from "lucide-react-native";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Chip, Segmented, TabSwitch } from "@/components/ui/Chip";
import { GlassCard } from "@/components/ui/GlassCard";
import { Notice } from "@/components/ui/Notice";
import { Select } from "@/components/ui/Select";
import { CardGlow } from "@/components/ui/Step";
import { Swatches } from "@/components/ui/Swatches";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import { EYESHADOWS, FINISHES, LIPSTICKS, MOTIONS, POSES, type PoseId } from "@/data/look-edits";
import { OCCASIONS, drapeContent as copy } from "@/data/studio-content";
import { useAuth } from "@/features/auth/AuthProvider";
import { useSetCreditBalance } from "@/features/billing/api";
import { LookShareSheet } from "@/features/share/ShareSheets";
import { workspaceApi } from "@/features/workspace/api";
import { useLooksCache } from "@/features/workspace/hooks";
import { errorMessage, OutOfCreditsError } from "@/lib/api/client";
import { persistMedia, shareMedia } from "@/lib/media";
import { colors, radius } from "@/theme";
import { animateLook, editLook } from "../api";
import type { Result, StageView } from "../types";

type Tool = "poses" | "makeup" | "motion";
const TOOLS: { id: Tool; label: string }[] = [
  { id: "poses", label: copy.posesLabel },
  { id: "makeup", label: copy.makeupLabel },
  { id: "motion", label: copy.livenessLabel },
];

/** Everything you can do with a finished render: save, share, download, poses, makeup and video. */
export function ResultStudio({
  result,
  pieces,
  defaultName,
  onChange,
  onView,
  onReset,
}: {
  result: Result;
  pieces: string[];
  defaultName: string;
  onChange: (fn: (r: Result) => Result) => void;
  onView: (v: StageView) => void;
  onReset: () => void;
}) {
  const { token } = useAuth();
  const toast = useToast();
  const setCredits = useSetCreditBalance();
  const looksCache = useLooksCache();
  const [tool, setTool] = useState<Tool>("poses");
  const [busy, setBusy] = useState<string | null>(null);
  const [toolError, setToolError] = useState("");
  const [toolNeedsCredits, setToolNeedsCredits] = useState(false);
  const [lipstick, setLipstick] = useState<string>(LIPSTICKS[2].hex);
  const [eyeshadow, setEyeshadow] = useState<string | null>(null);
  const [blush, setBlush] = useState(30);
  const [finish, setFinish] = useState<string>(FINISHES[0].id);
  const [motion, setMotion] = useState<string>(MOTIONS[0].id);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [occasion, setOccasion] = useState<string>(OCCASIONS[0].id);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [lookId, setLookId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const occasionOptions = useMemo(() => OCCASIONS.map((o) => ({ value: o.id, label: o.label })), []);
  const opts = { token: token!, onCredits: setCredits };

  const tryTool = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    setToolError("");
    setToolNeedsCredits(false);
    try {
      await fn();
    } catch (e) {
      setToolError(errorMessage(e));
      setToolNeedsCredits(e instanceof OutOfCreditsError);
    } finally {
      setBusy(null);
    }
  };

  const makePose = (pose: PoseId) =>
    tryTool(`pose:${pose}`, async () => {
      if (result.poses.some((p) => p.pose === pose)) return onView({ kind: "pose", pose });
      const source = result.history[0] ?? result.image;
      const imageUrl = await editLook(source, { mode: "pose", pose }, opts);
      onChange((r) => ({ ...r, poses: [...r.poses.filter((p) => p.pose !== pose), { pose, imageUrl }] }));
      onView({ kind: "pose", pose });
    });

  const applyMakeup = () =>
    tryTool("makeup", async () => {
      const imageUrl = await editLook(result.image, { mode: "makeup", makeup: { lipstick, eyeshadow: eyeshadow ?? undefined, blush, finish } }, opts);
      onChange((r) => ({ ...r, image: imageUrl, history: [...r.history, r.image] }));
      onView({ kind: "main" });
    });

  const undoMakeup = () => {
    onChange((r) => (r.history.length ? { ...r, image: r.history[r.history.length - 1], history: r.history.slice(0, -1) } : r));
    onView({ kind: "main" });
  };

  const animate = () =>
    tryTool("motion", async () => {
      const video = await animateLook(result.image, motion, opts);
      onChange((r) => ({ ...r, video }));
      onView({ kind: "video" });
    });

  /** Keeps our own copies of the render, poses and video, then saves the look. Returns its id. */
  const save = async () => {
    if (!token) throw new Error("Sign in to save looks");
    if (lookId) return lookId;
    setState("saving");
    setError("");
    try {
      const image = await persistMedia(token, result.image, "looks");
      const poseVariants = await Promise.all(result.poses.map(async (p) => ({ pose: p.pose, imageUrl: await persistMedia(token, p.imageUrl, "looks") })));
      const videoUrl = result.video ? await persistMedia(token, result.video, "looks", "video") : undefined;
      const look = await workspaceApi.saveLook(token, { name: name.trim() || defaultName, occasion, image, pieces, poseVariants, videoUrl });
      looksCache.upsert(look);
      setLookId(look.id);
      setState("saved");
      setOpen(false);
      toast.show(copy.saved, { action: { label: "View →", onPress: () => router.navigate("/saved") } });
      return look.id;
    } catch (e) {
      setError(errorMessage(e));
      setState("idle");
      throw e;
    }
  };

  const download = async () => {
    setDownloading(true);
    try {
      await shareMedia(result.image, "image/png");
    } catch (e) {
      toast.show(errorMessage(e, "Couldn't open the share sheet."), { tone: "error" });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <GlassCard strong padding={16}>
      <CardGlow glow={{ color: "#1fffec", at: "top-right" }} />
      <View style={styles.header}>
        <View style={styles.flex}>
          <View style={styles.row}>
            <Check size={14} strokeWidth={2.5} color={colors.green} />
            <AppText variant="label" color={colors.green}>
              {copy.resultTitle}
            </AppText>
          </View>
          <AppText variant="title" numberOfLines={1} style={styles.title}>
            {name || defaultName}
          </AppText>
        </View>
        <Pressable onPress={onReset} style={styles.retry} hitSlop={6}>
          <RotateCcw size={14} color={colors.subtle} />
          <AppText variant="xs" color={colors.subtle}>
            {copy.retry}
          </AppText>
        </Pressable>
      </View>

      <View style={styles.actions}>
        <Button size="md" icon={state === "saved" ? Check : Bookmark} disabled={state === "saved"} onPress={() => setOpen((v) => !v)} style={styles.action}>
          {state === "saved" ? "Saved" : "Save"}
        </Button>
        <Button size="md" variant="ghost" icon={Share2} onPress={() => setSharing(true)} style={styles.action}>
          {copy.share}
        </Button>
        <Button size="md" variant="ghost" icon={Download} loading={downloading} onPress={download} style={styles.action}>
          {copy.download}
        </Button>
      </View>

      {open && (
        <View style={styles.saveForm}>
          <TextField size="md" capsLabel label={copy.lookName} maxLength={60} value={name} onChangeText={setName} />
          <Select label={copy.occasion} value={occasion} onChange={setOccasion} options={occasionOptions} />
          <Button fullWidth loading={state === "saving"} onPress={() => save().catch(() => undefined)}>
            {copy.confirmSave}
          </Button>
        </View>
      )}
      {error ? <Notice tone="error" style={styles.gapTop}>{error}</Notice> : null}

      <View style={styles.tools}>
        <TabSwitch value={tool} onChange={setTool} options={TOOLS} />

        {tool === "poses" && (
          <View style={styles.toolBody}>
            <AppText variant="xs" color={colors.muted}>
              {copy.posesHint}
            </AppText>
            <View style={styles.poseGrid}>
              {POSES.map((p) => {
                const made = result.poses.some((x) => x.pose === p.id);
                const loading = busy === `pose:${p.id}`;
                return (
                  <Chip
                    key={p.id}
                    label={p.label}
                    selected={made}
                    disabled={Boolean(busy)}
                    onPress={() => makePose(p.id)}
                    leading={loading ? <ActivityIndicator size="small" color={colors.subtle} /> : made ? <Check size={14} color={colors.chipOnText} /> : undefined}
                    style={styles.pose}
                  />
                );
              })}
            </View>
          </View>
        )}

        {tool === "makeup" && (
          <View style={styles.toolBody}>
            <AppText variant="xs" color={colors.muted}>
              {copy.makeupHint}
            </AppText>
            <Swatches label={copy.lipstick} options={LIPSTICKS} value={lipstick} onChange={(v) => setLipstick(v ?? LIPSTICKS[0].hex)} />
            <Swatches label={copy.eyeshadow} options={EYESHADOWS} value={eyeshadow} onChange={setEyeshadow} allowNone />
            <View style={styles.sliderBlock}>
              <AppText variant="label" color={colors.muted}>
                {copy.blush} · {blush}%
              </AppText>
              <Slider
                minimumValue={0}
                maximumValue={100}
                step={5}
                value={blush}
                onValueChange={setBlush}
                minimumTrackTintColor={colors.accentBright}
                maximumTrackTintColor="rgba(255,255,255,0.15)"
                thumbTintColor="#fff"
                accessibilityLabel={copy.blush}
              />
            </View>
            <View style={styles.sliderBlock}>
              <AppText variant="label" color={colors.muted}>
                {copy.finish}
              </AppText>
              <Segmented size="sm" value={finish} onChange={setFinish} options={FINISHES} />
            </View>
            <View style={styles.row}>
              <Button icon={Palette} loading={busy === "makeup"} disabled={Boolean(busy)} onPress={applyMakeup}>
                {copy.applyMakeup}
              </Button>
              {result.history.length > 0 && (
                <Button variant="ghost" icon={Undo2} disabled={Boolean(busy)} onPress={undoMakeup}>
                  {copy.undo}
                </Button>
              )}
            </View>
          </View>
        )}

        {tool === "motion" && (
          <View style={styles.toolBody}>
            <AppText variant="xs" color={colors.muted}>
              {copy.livenessHint}
            </AppText>
            <Segmented size="sm" value={motion} onChange={setMotion} options={MOTIONS} />
            <Button icon={Film} loading={busy === "motion"} disabled={Boolean(busy)} onPress={animate}>
              {result.video ? "Re-animate" : copy.animate}
            </Button>
          </View>
        )}

        {toolError ? (
          <Notice tone="error">
            <View style={styles.errorBody}>
              <AppText variant="sm" color="#fecaca">
                {toolError}
              </AppText>
              {toolNeedsCredits && (
                <Pressable onPress={() => router.push("/credits")}>
                  <AppText variant="sm" weight="medium" style={styles.underline}>
                    {copy.credits.buy}
                  </AppText>
                </Pressable>
              )}
            </View>
          </Notice>
        ) : null}
      </View>

      <LookShareSheet open={sharing} onClose={() => setSharing(false)} lookId={lookId} ensureLookId={save} image={result.image} video={result.video} name={name || defaultName} />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  title: { marginTop: 4 },
  retry: { height: 32, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, borderRadius: 16 },
  actions: { flexDirection: "row", gap: 8, marginTop: 16 },
  action: { flex: 1, alignSelf: "auto" },
  saveForm: { gap: 12, marginTop: 12, padding: 12, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: "rgba(0,0,0,0.2)" },
  gapTop: { marginTop: 12 },
  tools: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.lineSoft, gap: 14 },
  toolBody: { gap: 14 },
  poseGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pose: { minWidth: "30%", justifyContent: "center" },
  sliderBlock: { gap: 6 },
  errorBody: { gap: 6 },
  underline: { textDecorationLine: "underline" },
});
