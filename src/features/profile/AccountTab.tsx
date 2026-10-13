import { useQuery } from "@tanstack/react-query";
import { Activity, Camera } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Avatar } from "@/components/ui/Avatar";
import { BarChart, CHART_COLORS } from "@/components/ui/BarChart";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Notice } from "@/components/ui/Notice";
import { TextField } from "@/components/ui/TextField";
import { profileContent as copy } from "@/data/studio-content";
import { useAuth } from "@/features/auth/AuthProvider";
import { socialApi } from "@/features/social/api";
import { workspaceApi } from "@/features/workspace/api";
import { errorMessage } from "@/lib/api/client";
import { pickImage, uploadFile } from "@/lib/media";
import { queryKeys } from "@/lib/queryKeys";
import { colors, radius } from "@/theme";

const TASK_LABELS: Record<string, string> = {
  "try-on": "Try-ons",
  twin: "Twin builds",
  pose: "Poses",
  makeup: "Makeup",
  liveness: "Videos",
  "text-to-look": "Described looks",
  "agentic-reasoning": "Occasion planner",
  "wardrobe-combos": "Wardrobe combos",
  "caption-generation": "Captions",
  "rag-answer": "Answers",
};

/** Profile photo, username, bio, phone and location. */
export function AccountTab() {
  const { user, token, setUser } = useAuth();
  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const submit = async () => {
    if (!token || !user) return;
    setSaving(true);
    setNotice(null);
    try {
      const updated = await workspaceApi.updateProfile(token, { username: username.trim(), bio, location, phone: phone.trim() || undefined });
      await setUser({ ...user, ...updated });
      setNotice({ tone: "success", text: copy.accountSaved });
    } catch (e) {
      setNotice({ tone: "error", text: errorMessage(e) });
    } finally {
      setSaving(false);
    }
  };

  // A new photo is saved straight away, so it shows everywhere (header, menu) without pressing Save.
  const changeAvatar = async (source: "camera" | "library") => {
    if (!token || !user) return;
    const file = await pickImage({ source, front: source === "camera", edit: true, aspect: [1, 1] });
    if (!file) return;
    setUploading(true);
    setNotice(null);
    try {
      const url = await uploadFile(token, file, "user");
      const updated = await workspaceApi.updateProfile(token, { avatar: url });
      await setUser({ ...user, ...updated, avatar: updated?.avatar ?? url });
      setNotice({ tone: "success", text: copy.photoSaved });
    } catch (e) {
      setNotice({ tone: "error", text: errorMessage(e) });
    } finally {
      setUploading(false);
    }
  };

  const choosePhoto = () =>
    Alert.alert(copy.profilePhoto, undefined, [
      { text: "Take photo", onPress: () => changeAvatar("camera") },
      { text: "Choose from gallery", onPress: () => changeAvatar("library") },
      { text: "Cancel", style: "cancel" },
    ]);

  return (
    <View style={styles.wrap}>
      <GlassCard>
        <AppText variant="title">{copy.accountTitle}</AppText>
        <View style={styles.photoRow}>
          <View>
            <Avatar name={username || user?.email} src={user?.avatar} size={80} />
            {uploading && (
              <View style={styles.photoBusy}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
          </View>
          <View style={styles.flex}>
            <Button size="sm" variant="ghost" icon={Camera} disabled={uploading} onPress={choosePhoto}>
              {copy.profilePhoto}
            </Button>
            <AppText variant="xs" color={colors.muted} style={styles.hint}>
              {copy.profilePhotoHint}
            </AppText>
          </View>
        </View>
        <View style={styles.form}>
          <TextField size="md" capsLabel label={copy.email} value={user?.email ?? ""} editable={false} />
          <TextField size="md" capsLabel label={copy.username} maxLength={30} autoCapitalize="none" autoCorrect={false} value={username} onChangeText={setUsername} />
          <TextField size="md" capsLabel multiline label={copy.bio} maxLength={250} value={bio} onChangeText={setBio} />
          <TextField size="md" capsLabel label="Phone number" keyboardType="phone-pad" maxLength={20} value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" />
          <TextField size="md" capsLabel label={copy.location} maxLength={100} value={location} onChangeText={setLocation} />
          <Button fullWidth loading={saving} disabled={username.trim().length < 2} onPress={submit}>
            {copy.saveAccount}
          </Button>
          {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}
        </View>
      </GlassCard>
      <AiUsageCard />
    </View>
  );
}

/** Your own AI usage over the last 30 days. */
function AiUsageCard() {
  const { token } = useAuth();
  const query = useQuery({ queryKey: queryKeys.aiUsage(token), queryFn: () => socialApi.myAiUsage(token!), enabled: Boolean(token) });
  const data = query.data;

  return (
    <GlassCard>
      <View style={styles.row}>
        <Activity size={20} color={colors.accentBright} />
        <AppText variant="title">Your AI usage</AppText>
      </View>
      {query.isError ? (
        <AppText variant="sm" color={colors.muted} style={styles.hint}>
          Usage isn&apos;t available right now.
        </AppText>
      ) : !data ? (
        <ActivityIndicator color={colors.accentBright} style={styles.left} />
      ) : (
        <View style={styles.usage}>
          <View style={styles.stats}>
            <Stat label="Requests (30 days)" value={data.totals.requests.toLocaleString()} />
            <Stat label="Success rate" value={data.totals.successRate == null ? "—" : `${data.totals.successRate}%`} />
            <Stat label="All time" value={data.allTime.requests.toLocaleString()} />
          </View>
          {data.totals.requests > 0 && (
            <BarChart
              title="Requests per day"
              rows={data.daily.map((d) => ({ label: d.date.slice(5), values: { ok: d.requests - d.failed, failed: d.failed } }))}
              series={[
                { key: "ok", label: "Succeeded", color: CHART_COLORS.series1 },
                { key: "failed", label: "Failed", color: CHART_COLORS.critical },
              ]}
            />
          )}
          {data.byTask.length > 0 && (
            <View style={styles.tasks}>
              {data.byTask.map((t) => (
                <View key={t.taskType} style={styles.task}>
                  <AppText variant="xs" color={colors.subtle}>
                    {TASK_LABELS[t.taskType] ?? t.taskType} · <AppText variant="xs">{t.requests}</AppText>
                  </AppText>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </GlassCard>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="micro" color={colors.muted} style={styles.statLabel}>
        {label}
      </AppText>
      <AppText variant="title">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  flex: { flex: 1 },
  left: { alignSelf: "flex-start", marginTop: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  photoRow: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 16 },
  photoBusy: { ...StyleSheet.absoluteFill, borderRadius: 40, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  hint: { marginTop: 6 },
  form: { marginTop: 18, gap: 14 },
  usage: { marginTop: 14, gap: 16 },
  stats: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, borderRadius: radius.md, borderWidth: 1, borderColor: colors.lineSoft, backgroundColor: "rgba(255,255,255,0.02)", padding: 10, gap: 4 },
  statLabel: { textTransform: "uppercase", letterSpacing: 0.8, fontSize: 10 },
  tasks: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  task: { borderRadius: 999, borderWidth: 1, borderColor: colors.line, backgroundColor: "rgba(255,255,255,0.03)", paddingHorizontal: 12, paddingVertical: 4 },
});
