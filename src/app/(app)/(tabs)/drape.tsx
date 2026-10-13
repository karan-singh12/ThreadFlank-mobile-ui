import { router, useLocalSearchParams } from "expo-router";
import { Camera, PenLine, Shirt, Sparkles, Users } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppBackground } from "@/components/ui/AppBackground";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { Step } from "@/components/ui/Step";
import { TextField } from "@/components/ui/TextField";
import { LOOK_MAX_PEOPLE, drapeContent as copy, type GroupPosture } from "@/data/studio-content";
import { AppHeader } from "@/features/app/AppHeader";
import { useSetCreditBalance, useWallet } from "@/features/billing/api";
import { emptyMember, filledPieces, outfitFromItem, runGroupDrape, slotForOutfit, withPiece } from "@/features/drape/api";
import { DrapeStage } from "@/features/drape/components/DrapeStage";
import { MemberOutfits, MemberPicker, PosturePicker } from "@/features/drape/components/GroupControls";
import { ResultStudio } from "@/features/drape/components/ResultStudio";
import { SceneGrid, SceneTabs } from "@/features/drape/components/SceneGrid";
import type { MemberSpec, Outfit, Result, RunState, StageView } from "@/features/drape/types";
import { useAuth } from "@/features/auth/AuthProvider";
import type { StudioScene } from "@/features/workspace/api";
import { SELF_ID, baseImage, usePeople, useScenes, useTwin, useWardrobe, type Person } from "@/features/workspace/hooks";
import { errorMessage, OutOfCreditsError } from "@/lib/api/client";
import { colors, GUTTER, TAB_BAR_HEIGHT } from "@/theme";

/** How often the progress copy advances while a render runs. */
const STEP_MS = 5000;
const FALLBACK_SCENE: StudioScene = { id: "studio", name: "Studio", category: "Studio", cssGradient: "radial-gradient(circle at 50% 30%, #2a2548 0%, #0d0c1f 70%)" };
const nameOf = (p: Person) => (p.isSelf ? "You" : p.name);

export default function DrapeScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const params = useLocalSearchParams<{ image?: string; brand?: string; title?: string; item?: string; type?: string; person?: string }>();
  const { people } = usePeople();
  const wardrobe = useWardrobe();
  const wardrobeItems = useMemo(() => wardrobe.data ?? [], [wardrobe.data]);
  const scenesQuery = useScenes();
  const scenes = useMemo(() => scenesQuery.data ?? [], [scenesQuery.data]);
  const { data: wallet } = useWallet();
  const setCredits = useSetCreditBalance();
  const { twin, save: saveTwin } = useTwin();
  const scrollRef = useRef<ScrollView>(null);

  const initialPerson = params.person || SELF_ID;
  const [selectedIds, setSelectedIds] = useState<string[]>([initialPerson]);
  const [activeMemberId, setActiveMemberId] = useState(initialPerson);
  const [members, setMembers] = useState<Record<string, MemberSpec>>({});
  const [posture, setPosture] = useState<GroupPosture>("auto");
  const [sceneCategory, setSceneCategory] = useState("all");
  const [sceneChoice, setSceneChoice] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [run, setRun] = useState<RunState>({ status: "idle" });
  const [view, setView] = useState<StageView>({ kind: "main" });
  const [step, setStep] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  // ─── Scene: the user's saved default (on their twin profile), else the admin default ──
  const categories = useMemo(() => ["all", ...Array.from(new Set(scenes.map((s) => s.category).filter(Boolean)))], [scenes]);
  const displayedScenes = useMemo(() => (sceneCategory === "all" ? scenes : scenes.filter((s) => s.category === sceneCategory)), [scenes, sceneCategory]);
  const sceneId = sceneChoice ?? twin?.backgroundId ?? null;
  const scene = scenes.find((s) => s.id === sceneId) ?? scenes.find((s) => s.isDefault) ?? scenes[0] ?? FALLBACK_SCENE;
  const chooseScene = (id: string) => {
    setSceneChoice(id);
    void saveTwin({ backgroundId: id }).catch(() => undefined);
  };

  // ─── A garment passed in from Discover (?image=), the Wardrobe (?item=) or Trending ──
  const preload = useMemo((): Outfit | null => {
    const item = wardrobeItems.find((i) => i.id === params.item);
    if (item) return outfitFromItem(item);
    if (!params.image) return null;
    return {
      source: "link",
      label: params.title || (params.brand ? `${params.brand} Look` : "Discover Look"),
      preview: params.image,
      type: params.type === "lower_body" ? "lower_body" : params.type === "upper_body" ? "upper_body" : "dresses",
    };
  }, [params.item, params.image, params.title, params.brand, params.type, wardrobeItems]);

  const [preloaded, setPreloaded] = useState<string | null>(null);
  useEffect(() => {
    if (!preload || preload.preview === preloaded) return;
    setPreloaded(preload.preview);
    const category = wardrobeItems.find((i) => i.id === preload.itemId)?.category;
    // A new garment from outside replaces that slot for the person it was opened for.
    setMembers((prev) => ({ ...prev, [initialPerson]: withPiece(prev[initialPerson] ?? emptyMember(), slotForOutfit(preload, category), preload) }));
    setRun({ status: "idle" });
    setView({ kind: "main" });
  }, [preload, preloaded, wardrobeItems, initialPerson]);

  // ─── People in the look ─────────────────────────────────────────────────────
  const selectedPeople = useMemo(() => {
    const list = selectedIds.map((id) => people.find((p) => p.id === id)).filter((p): p is Person => Boolean(p));
    return list.length > 0 ? list : [people[0] ?? { id: SELF_ID, name: "You", relation: "You", isSelf: true }];
  }, [selectedIds, people]);
  const isGroup = selectedPeople.length > 1;
  const activeId = selectedPeople.some((p) => p.id === activeMemberId) ? activeMemberId : selectedPeople[0].id;

  const addPerson = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) || prev.length >= LOOK_MAX_PEOPLE ? prev : [...prev, id]));
    setActiveMemberId(id);
  };
  const removePerson = (id: string) => setSelectedIds((prev) => (prev.length <= 1 ? prev : prev.filter((x) => x !== id)));
  const updateMember = (id: string, next: MemberSpec) => setMembers((prev) => ({ ...prev, [id]: next }));

  // ─── Can we render? ─────────────────────────────────────────────────────────
  const missingTwins = selectedPeople.filter((p) => !baseImage(p));
  const anyOutfit = selectedPeople.some((p) => filledPieces(members[p.id]).length > 0);
  const running = run.status === "running";
  const cost = 1; // one finished image, even for a group
  const shortOfCredits = Boolean(wallet && wallet.balance < cost);
  const canRun = !running && missingTwins.length === 0 && anyOutfit && !shortOfCredits;
  const blocker = missingTwins.length ? copy.group.needTwins(missingTwins.map(nameOf).join(", ")) : !anyOutfit ? (isGroup ? copy.group.needOutfit : copy.needOutfit) : "";
  const progressSteps = isGroup ? copy.group.generating : copy.generating;

  useEffect(() => {
    if (run.status !== "running") return;
    const id = setInterval(() => setStep((s) => Math.min(s + 1, progressSteps.length - 1)), STEP_MS);
    return () => clearInterval(id);
  }, [run.status, progressSteps.length]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const cancel = () => {
    abortRef.current?.abort();
    setRun({ status: "idle" });
  };

  const finish = (image: string, extra: Partial<Result> = {}) => setRun({ status: "done", result: { image, poses: [], history: [], ...extra } });

  /** One request for everyone: the backend dresses each person in all their pieces and places them in the scene. */
  const generate = async () => {
    if (!token) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStep(0);
    setView({ kind: "main" });
    setRun({ status: "running", label: "" });
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    try {
      const res = await runGroupDrape({ people: selectedPeople, members, posture, scene, styling: prompt }, { token, signal: controller.signal, onCredits: setCredits });
      if (controller.signal.aborted) return;
      const failed = res.people.filter((p) => p.error).map((p) => p.name);
      const partial = failed.length ? copy.group.partial(failed.join(", ")) : undefined;
      if (res.imageUrl) {
        finish(res.imageUrl, { note: partial });
        return;
      }
      // The group couldn't be composed into one photo: show everyone's render side by side.
      const images = res.people.map((p) => p.imageUrl);
      if (images.length) finish(images[0], { collage: images, note: [copy.group.collage, partial].filter(Boolean).join(" ") });
      else setRun({ status: "error", message: res.composeError || "Couldn't combine the renders into one image. Try again." });
    } catch (e) {
      if (!controller.signal.aborted) setRun({ status: "error", message: errorMessage(e), outOfCredits: e instanceof OutOfCreditsError });
    }
  };

  const updateResult = (fn: (r: Result) => Result) => setRun((r) => (r.status === "done" ? { status: "done", result: fn(r.result) } : r));

  const labelsFor = (p: Person) => filledPieces(members[p.id]).map((x) => x.outfit.label);
  const pieces = isGroup ? selectedPeople.filter((p) => labelsFor(p).length).map((p) => `${nameOf(p)}: ${labelsFor(p).join(", ")}`) : labelsFor(selectedPeople[0]);
  const defaultName = isGroup
    ? `${selectedPeople.map((p) => (p.isSelf ? "Me" : p.name)).join(" & ")} look`
    : `${selectedPeople[0]?.isSelf ? "My" : `${selectedPeople[0]?.name}'s`} ${labelsFor(selectedPeople[0])[0] ?? "look"}`;
  const result = run.status === "done" ? run.result : null;
  const board = selectedPeople.map((p) => ({ id: p.id, name: nameOf(p), pieces: filledPieces(members[p.id]).map((x) => x.outfit) }));

  const dockBottom = TAB_BAR_HEIGHT + insets.bottom + 10;

  return (
    <View style={styles.fill}>
      <AppBackground />
      <View style={{ paddingTop: insets.top }}>
        <AppHeader />
      </View>
      <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: dockBottom + 72 }}>
        <DrapeStage
          mode={isGroup ? "group" : "single"}
          scene={scene}
          person={selectedPeople[0]}
          group={selectedPeople}
          board={board}
          run={run}
          view={view}
          onView={setView}
          progress={run.status === "running" ? run.label || progressSteps[step] : ""}
          estimate={isGroup ? copy.group.estimate : undefined}
          onCancel={cancel}
        />

        <View style={styles.controls}>
          {run.status === "error" && (
            <Notice tone="error">
              <View style={styles.errorBody}>
                <AppText variant="sm" color="#fecaca">
                  {run.message}
                </AppText>
                {run.outOfCredits && (
                  <Pressable onPress={() => router.push("/credits")}>
                    <AppText variant="sm" weight="medium" style={styles.underline}>
                      {copy.credits.buy}
                    </AppText>
                  </Pressable>
                )}
              </View>
            </Notice>
          )}
          {result?.note ? <Notice>{result.note}</Notice> : null}

          {result && (
            <ResultStudio
              key={result.history[0] ?? result.image}
              result={result}
              pieces={pieces}
              defaultName={defaultName.slice(0, 60)}
              onChange={updateResult}
              onView={setView}
              onReset={() => {
                setRun({ status: "idle" });
                setView({ kind: "main" });
              }}
            />
          )}

          <Step
            label={copy.steps.who}
            icon={Users}
            glow={{ color: "#1f8fff", at: "top-right" }}
            aside={
              <AppText variant="xs" color={colors.muted}>
                {selectedPeople.length}/{LOOK_MAX_PEOPLE}
              </AppText>
            }
          >
            <MemberPicker people={people} selected={selectedPeople} max={LOOK_MAX_PEOPLE} onAdd={addPerson} onRemove={removePerson} />
            {isGroup && (
              <View style={styles.divided}>
                <PosturePicker people={selectedPeople} value={posture} onChange={setPosture} />
              </View>
            )}
          </Step>

          <Step label={isGroup ? copy.steps.outfits : copy.steps.source} icon={Shirt} glow={{ color: "#d61fff", at: "bottom-left" }}>
            <MemberOutfits
              people={selectedPeople}
              members={members}
              activeId={activeId}
              onActive={setActiveMemberId}
              onChange={updateMember}
              wardrobe={wardrobeItems}
              wardrobeLoading={wardrobe.isLoading}
            />
          </Step>

          <Step
            label={copy.steps.prompt}
            icon={PenLine}
            glow={{ color: "#abb2fc", at: "bottom-right" }}
            aside={
              <AppText variant="xs" color={colors.muted}>
                {copy.optional}
              </AppText>
            }
          >
            <TextField size="md" multiline maxLength={300} value={prompt} onChangeText={setPrompt} placeholder={copy.promptPlaceholder} accessibilityLabel={copy.steps.prompt} />
          </Step>

          <Step label={copy.steps.scene} icon={Camera} glow={{ color: "#1fffec", at: "top-left" }}>
            <SceneTabs categories={categories} value={sceneCategory} onChange={setSceneCategory} />
            <SceneGrid scenes={displayedScenes} selectedId={scene.id} onSelect={chooseScene} />
          </Step>
        </View>
      </ScrollView>

      {/* The Drape button, docked above the tab bar. Out of credits, it becomes "Get credits". */}
      <View style={[styles.dock, { bottom: dockBottom }]} pointerEvents="box-none">
        {!running && blocker ? (
          <AppText variant="xs" color={colors.subtle} align="center" style={styles.blocker}>
            {blocker}
          </AppText>
        ) : null}
        {!running && shortOfCredits ? (
          <Button size="lg" fullWidth icon={Sparkles} onPress={() => router.push("/credits")}>
            {copy.credits.buy}
          </Button>
        ) : (
          <Button size="lg" fullWidth icon={running ? undefined : Sparkles} loading={running} disabled={!canRun} onPress={generate}>
            {running ? "Draping…" : `${isGroup ? "Drape group look" : "Drape it"}  ·  ${copy.credits.cost(cost)}`}
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  controls: { paddingHorizontal: GUTTER - 4, paddingTop: 12, gap: 12 },
  divided: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.lineSoft },
  errorBody: { gap: 6 },
  underline: { textDecorationLine: "underline" },
  dock: { position: "absolute", left: GUTTER - 4, right: GUTTER - 4, gap: 6 },
  blocker: { backgroundColor: "rgba(1,2,20,0.75)", alignSelf: "center", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, overflow: "hidden" },
});
