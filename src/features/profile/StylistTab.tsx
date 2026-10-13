import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { BadgeCheck, Clock, Scissors, ShieldAlert } from "lucide-react-native";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Notice } from "@/components/ui/Notice";
import { Loader } from "@/components/ui/States";
import { TextField } from "@/components/ui/TextField";
import { useAuth } from "@/features/auth/AuthProvider";
import { socialApi, type StylistProfile } from "@/features/social/api";
import { errorMessage } from "@/lib/api/client";
import { queryKeys } from "@/lib/queryKeys";
import { colors } from "@/theme";

const STATUS: Record<StylistProfile["status"], { icon: typeof Clock; text: string; tone: string }> = {
  PENDING: { icon: Clock, text: "Your application is being reviewed by our team.", tone: "#fde68a" },
  VERIFIED: { icon: BadgeCheck, text: "You're a verified stylist. Looks from shoppers who ask for a review appear in your queue.", tone: colors.green },
  REJECTED: { icon: ShieldAlert, text: "Your application wasn't approved. Update your profile and resubmit.", tone: colors.red },
  SUSPENDED: { icon: ShieldAlert, text: "Your stylist profile is suspended. Contact support for details.", tone: colors.red },
};

/** Apply to be a verified stylist or tailor, and see your status. */
export function StylistTab() {
  const { token } = useAuth();
  const client = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.stylistMe(token), queryFn: () => socialApi.myStylist(token!), enabled: Boolean(token) });
  const profile = query.data;
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setCity(profile.city ?? "");
    setBio(profile.bio ?? "");
    setSpecialties((profile.specialties ?? []).join(", "));
    setPortfolioUrl(profile.portfolioUrl ?? "");
  }, [profile]);

  const submit = async () => {
    if (!token) return;
    setSaving(true);
    setNotice(null);
    try {
      const next = await socialApi.applyStylist(token, {
        displayName: displayName.trim(),
        city: city.trim() || undefined,
        bio: bio.trim() || undefined,
        specialties: specialties
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        portfolioUrl: portfolioUrl.trim() || undefined,
      });
      client.setQueryData(queryKeys.stylistMe(token), next);
      setNotice({ tone: "success", text: next.status === "VERIFIED" ? "Profile updated" : "Application submitted" });
    } catch (e) {
      setNotice({ tone: "error", text: errorMessage(e) });
    } finally {
      setSaving(false);
    }
  };

  if (query.isLoading) return <Loader />;
  const status = profile ? STATUS[profile.status] : null;

  return (
    <View style={styles.wrap}>
      {status && profile ? (
        <GlassCard>
          <View style={styles.row}>
            <status.icon size={16} color={status.tone} />
            <AppText variant="sm" weight="medium" color={status.tone}>
              {profile.status.charAt(0) + profile.status.slice(1).toLowerCase()}
            </AppText>
          </View>
          <AppText variant="sm" color={colors.muted} style={styles.gap}>
            {status.text}
          </AppText>
          {profile.rejectionReason ? (
            <AppText variant="sm" color={colors.subtle} style={styles.gap}>
              Reason: {profile.rejectionReason}
            </AppText>
          ) : null}
          {profile.status === "VERIFIED" && (
            <Button fullWidth onPress={() => router.push("/stylist")} style={styles.gapLarge}>
              Open review queue
            </Button>
          )}
        </GlassCard>
      ) : (
        <Notice>Once you apply, our team verifies your profile. You can then review looks from shoppers.</Notice>
      )}

      <GlassCard>
        <View style={styles.row}>
          <Scissors size={20} color={colors.accentBright} />
          <AppText variant="title">{profile ? "Your stylist profile" : "Become a verified stylist"}</AppText>
        </View>
        <AppText variant="sm" color={colors.muted} style={styles.gap}>
          Stylists and tailors review looks that shoppers submit — especially wedding and festive wear — and suggest how to restyle them.
        </AppText>
        <View style={styles.form}>
          <TextField size="md" capsLabel label="Name clients see" maxLength={60} value={displayName} onChangeText={setDisplayName} />
          <TextField size="md" capsLabel label="City" maxLength={60} value={city} onChangeText={setCity} />
          <TextField size="md" capsLabel multiline label="About you" maxLength={600} value={bio} onChangeText={setBio} />
          <TextField size="md" capsLabel label="Specialties" hint="Comma separated, e.g. bridal, sherwani, alterations" value={specialties} onChangeText={setSpecialties} />
          <TextField
            size="md"
            capsLabel
            label="Portfolio link"
            keyboardType="url"
            autoCapitalize="none"
            maxLength={300}
            value={portfolioUrl}
            onChangeText={setPortfolioUrl}
            placeholder="https://instagram.com/…"
          />
          <Button fullWidth loading={saving} disabled={!displayName.trim() || profile?.status === "SUSPENDED"} onPress={submit}>
            {profile ? "Save profile" : "Apply"}
          </Button>
          {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  gap: { marginTop: 6 },
  gapLarge: { marginTop: 14 },
  form: { marginTop: 18, gap: 14 },
});
