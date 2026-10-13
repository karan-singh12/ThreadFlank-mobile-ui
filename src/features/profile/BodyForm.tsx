import { Camera, Check, ImagePlus, ScanFace, X } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Chip";
import { Photo } from "@/components/ui/Photo";
import { TextField } from "@/components/ui/TextField";
import { GENDERS, SKIN_TONES, profileContent as copy } from "@/data/studio-content";
import { useAuth } from "@/features/auth/AuthProvider";
import { errorMessage } from "@/lib/api/client";
import { pickImage, uploadFile } from "@/lib/media";
import { colors, radius } from "@/theme";

export type BodyValues = {
  /** The person's selfie (upload path). Drape keeps their face from it. */
  photo: string;
  gender: string;
  age: string;
  heightCm: string;
  weightKg: string;
  skinTone: string;
};

export const EMPTY_BODY: BodyValues = { photo: "", gender: "", age: "", heightCm: "", weightKg: "", skinTone: "" };

export const toNumber = (v: string) => {
  const n = Number(v);
  return v.trim() && Number.isFinite(n) && n > 0 ? Math.round(n) : undefined;
};

export const skinLabel = (hex?: string | null) => SKIN_TONES.find((t) => t.hex === hex)?.label;

export function bodySummary(p: { heightCm?: number | null; weightKg?: number | null; age?: number | null; skinTone?: string | null }) {
  return [p.age && `${p.age}y`, p.heightCm && `${p.heightCm} cm`, p.weightKg && `${p.weightKg} kg`, skinLabel(p.skinTone)].filter(Boolean).join(" · ");
}

const digits = (v: string) => v.replace(/[^\d]/g, "");

/**
 * A selfie plus body details, shared by your own profile and circle members. Drape renders the
 * person from these directly: the face from the selfie, the build from the details.
 */
export function BodyForm({ value, onChange }: { value: BodyValues; onChange: (next: BodyValues) => void }) {
  const set = <K extends keyof BodyValues>(key: K, v: BodyValues[K]) => onChange({ ...value, [key]: v });

  return (
    <View style={styles.wrap}>
      <SelfiePicker value={value.photo} onChange={(photo) => set("photo", photo)} />

      <View style={styles.group}>
        <AppText variant="label" color={colors.muted}>
          {copy.gender}
        </AppText>
        <Segmented size="sm" value={value.gender} onChange={(g) => set("gender", g)} options={GENDERS} />
      </View>

      <View style={styles.group}>
        <View style={styles.threeCol}>
          <TextField size="md" capsLabel label={copy.age} keyboardType="number-pad" maxLength={3} value={value.age} onChangeText={(v) => set("age", digits(v))} containerStyle={styles.flex} />
          <TextField size="md" capsLabel label={copy.height} keyboardType="number-pad" maxLength={3} value={value.heightCm} onChangeText={(v) => set("heightCm", digits(v))} containerStyle={styles.flex} />
          <TextField size="md" capsLabel label={copy.weight} keyboardType="number-pad" maxLength={3} value={value.weightKg} onChangeText={(v) => set("weightKg", digits(v))} containerStyle={styles.flex} />
        </View>
        <AppText variant="xs" color={colors.muted}>
          {copy.bodyHint}
        </AppText>
      </View>

      <View style={styles.group}>
        <AppText variant="label" color={colors.muted}>
          {copy.skinTone}
          {value.skinTone ? (
            <AppText variant="xs" color={colors.subtle}>
              {"  "}· {skinLabel(value.skinTone)}
            </AppText>
          ) : null}
        </AppText>
        <View style={styles.tones} accessibilityRole="radiogroup" accessibilityLabel={copy.skinTone}>
          {SKIN_TONES.map((t) => {
            const active = value.skinTone === t.hex;
            return (
              <Pressable
                key={t.id}
                onPress={() => set("skinTone", t.hex)}
                accessibilityRole="radio"
                accessibilityLabel={t.label}
                accessibilityState={{ selected: active }}
                style={[styles.toneRing, active && styles.toneRingOn]}
              >
                <View style={[styles.tone, { backgroundColor: t.hex }]}>{active && <Check size={16} strokeWidth={3} color="rgba(0,0,0,0.7)" />}</View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

/** The selfie: taken with the front camera, or picked from the gallery. */
function SelfiePicker({ value, onChange }: { value: string; onChange: (photo: string) => void }) {
  const { token } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const take = async (source: "camera" | "library") => {
    if (!token) return;
    const file = await pickImage({ source, front: source === "camera", edit: true, aspect: [3, 4] });
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      onChange(await uploadFile(token, file, "twins"));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.group}>
      <AppText variant="label" color={colors.muted}>
        {copy.photo}
      </AppText>
      <View style={styles.selfieRow}>
        <View style={styles.selfie}>
          {value ? <Photo src={value} alt="Selfie" style={StyleSheet.absoluteFill} /> : !uploading && <ScanFace size={32} strokeWidth={1.5} color={colors.muted} />}
          {uploading && (
            <View style={styles.selfieBusy}>
              <ActivityIndicator color="#fff" />
            </View>
          )}
          {value && !uploading ? (
            <Pressable onPress={() => onChange("")} hitSlop={6} style={styles.selfieRemove} accessibilityLabel={copy.removeSelfie}>
              <X size={14} color="#fff" />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.selfieActions}>
          <Button size="sm" icon={Camera} disabled={uploading} onPress={() => take("camera")}>
            {copy.takeSelfie}
          </Button>
          <Button size="sm" variant="ghost" icon={ImagePlus} disabled={uploading} onPress={() => take("library")}>
            {copy.fromGallery}
          </Button>
          <AppText variant="xs" color={error ? colors.red : colors.muted} accessibilityRole={error ? "alert" : undefined}>
            {error || copy.photoHint}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 22 },
  group: { gap: 8 },
  flex: { flex: 1 },
  threeCol: { flexDirection: "row", gap: 10 },
  tones: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  toneRing: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  toneRingOn: { borderColor: "rgba(255,255,255,0.9)" },
  tone: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  selfieRow: { flexDirection: "row", gap: 16, alignItems: "center" },
  selfie: {
    width: 112,
    aspectRatio: 3 / 4,
    borderRadius: radius.card,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  selfieBusy: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  selfieRemove: { position: "absolute", top: 4, right: 4, width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.6)" },
  selfieActions: { flex: 1, gap: 8 },
});
