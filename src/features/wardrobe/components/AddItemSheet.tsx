import { Camera, ImagePlus, Link2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Notice } from "@/components/ui/Notice";
import { Photo } from "@/components/ui/Photo";
import { Select } from "@/components/ui/Select";
import { Sheet } from "@/components/ui/Sheet";
import { TextField } from "@/components/ui/TextField";
import { WARDROBE_CATEGORIES, wardrobeContent } from "@/data/studio-content";
import { useAuth } from "@/features/auth/AuthProvider";
import { fetchGarmentImage } from "@/features/drape/api";
import { workspaceApi, type WardrobeItem } from "@/features/workspace/api";
import { errorMessage } from "@/lib/api/client";
import { pickImage, uploadFile } from "@/lib/media";
import { colors, radius } from "@/theme";

const copy = wardrobeContent.form;
const CATEGORY_OPTIONS = WARDROBE_CATEGORIES.map((c) => ({ value: c, label: c }));

/** Add a piece you own: a photo (camera, gallery or product link), details, and a duplicate check. */
export function AddItemSheet({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: (item: WardrobeItem) => void }) {
  const { token } = useAuth();
  const [image, setImage] = useState("");
  const [link, setLink] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<string>(WARDROBE_CATEGORIES[0]);
  const [color, setColor] = useState("");
  const [tags, setTags] = useState("");
  const [cost, setCost] = useState("");
  const [similar, setSimilar] = useState<WardrobeItem[]>([]);
  const [busy, setBusy] = useState<"upload" | "link" | "save" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) return;
    // Start fresh next time.
    setImage("");
    setLink("");
    setName("");
    setBrand("");
    setCategory(WARDROBE_CATEGORIES[0]);
    setColor("");
    setTags("");
    setCost("");
    setSimilar([]);
    setError("");
    setBusy(null);
  }, [open]);

  // "You already own something similar": check as the name/category/colour settle.
  useEffect(() => {
    if (!token || name.trim().length < 3) return;
    const id = setTimeout(() => {
      workspaceApi
        .similarItems(token, { category, color: color.trim() || undefined, name: name.trim() })
        .then(setSimilar)
        .catch(() => setSimilar([]));
    }, 500);
    return () => clearTimeout(id);
  }, [token, name, category, color]);

  const upload = async (source: "camera" | "library") => {
    if (!token) return;
    const file = await pickImage({ source, edit: true, aspect: [3, 4] });
    if (!file) return;
    setBusy("upload");
    setError("");
    try {
      setImage(await uploadFile(token, file, "wardrobe"));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const choosePhoto = () =>
    Alert.alert(copy.photo, undefined, [
      { text: "Take photo", onPress: () => upload("camera") },
      { text: "Choose from gallery", onPress: () => upload("library") },
      { text: "Cancel", style: "cancel" },
    ]);

  const fromLink = async () => {
    if (!link.trim()) return;
    setBusy("link");
    setError("");
    try {
      setImage(await fetchGarmentImage(link.trim()));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const submit = async () => {
    if (!token || !image || !name.trim()) return;
    setBusy("save");
    setError("");
    try {
      const item = await workspaceApi.addWardrobeItem(token, {
        name: name.trim(),
        brand: brand.trim() || undefined,
        category,
        image,
        color: color.trim() || undefined,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        costPaid: cost.trim() ? Math.round(Number(cost)) : undefined,
      });
      onAdded(item);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(null);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={copy.title}
      footer={
        <Button fullWidth size="lg" loading={busy === "save"} disabled={!image || !name.trim() || busy !== null} onPress={submit}>
          {copy.submit}
        </Button>
      }
    >
      <View style={styles.photoRow}>
        <Pressable onPress={choosePhoto} style={styles.photoBox} accessibilityLabel={copy.upload}>
          {image ? (
            <Photo src={image} alt="Item preview" fit="contain" style={StyleSheet.absoluteFill} />
          ) : (
            <>
              <ImagePlus size={24} color={colors.muted} strokeWidth={1.5} />
              <AppText variant="xs" color={colors.muted}>
                {copy.upload}
              </AppText>
            </>
          )}
          {busy === "upload" && (
            <View style={styles.photoBusy}>
              <ActivityIndicator color="#fff" />
            </View>
          )}
        </Pressable>
        <View style={styles.linkCol}>
          <AppText variant="xs" color={colors.muted}>
            {copy.orLink}
          </AppText>
          <View style={styles.linkRow}>
            <TextField size="md" value={link} onChangeText={setLink} placeholder="https://" keyboardType="url" autoCapitalize="none" autoCorrect={false} containerStyle={styles.flex} accessibilityLabel={copy.orLink} />
            {busy === "link" ? (
              <ActivityIndicator color={colors.accentBright} style={styles.linkBusy} />
            ) : (
              <IconButton icon={Link2} label="Fetch image from link" onPress={fromLink} disabled={!link.trim()} size={44} />
            )}
          </View>
          <Button variant="glass" size="sm" icon={Camera} onPress={() => upload("camera")}>
            Take photo
          </Button>
        </View>
      </View>

      <TextField size="md" capsLabel label={copy.name} maxLength={60} value={name} onChangeText={setName} />
      <View style={styles.twoCol}>
        <TextField size="md" capsLabel label={copy.brand} maxLength={40} value={brand} onChangeText={setBrand} containerStyle={styles.flex} />
        <Select label={copy.category} value={category} onChange={setCategory} options={CATEGORY_OPTIONS} style={styles.flex} />
      </View>
      <View style={styles.twoCol}>
        <TextField size="md" capsLabel label={copy.color} maxLength={24} value={color} onChangeText={setColor} containerStyle={styles.flex} />
        <TextField size="md" capsLabel label="Price paid (₹)" keyboardType="number-pad" value={cost} onChangeText={(v) => setCost(v.replace(/[^\d]/g, ""))} containerStyle={styles.flex} />
      </View>
      <TextField size="md" capsLabel label={copy.tags} hint={copy.tagsHint} value={tags} onChangeText={setTags} />

      {name.trim().length >= 3 && similar.length > 0 && (
        <View style={styles.similar}>
          <AppText variant="sm" color="#fef3c7">
            You already own something similar:
          </AppText>
          <View style={styles.similarRow}>
            {similar.slice(0, 4).map((s) => (
              <View key={s.id} style={styles.similarItem}>
                <View style={styles.similarThumb}>
                  <Photo src={s.image} alt={s.name} fit="contain" style={StyleSheet.absoluteFill} />
                </View>
                <AppText variant="micro" color={colors.muted} numberOfLines={1}>
                  {s.name}
                </AppText>
              </View>
            ))}
          </View>
        </View>
      )}

      {error ? <Notice tone="error">{error}</Notice> : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  photoRow: { flexDirection: "row", gap: 16 },
  photoBox: {
    width: 112,
    aspectRatio: 3 / 4,
    borderRadius: radius.card,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    overflow: "hidden",
  },
  photoBusy: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  linkCol: { flex: 1, justifyContent: "flex-end", gap: 8 },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  linkBusy: { width: 44 },
  twoCol: { flexDirection: "row", gap: 12 },
  similar: { borderRadius: radius.md, borderWidth: 1, borderColor: "rgba(252,211,77,0.3)", backgroundColor: "rgba(252,211,77,0.06)", padding: 12, gap: 8 },
  similarRow: { flexDirection: "row", gap: 8 },
  similarItem: { width: 56, gap: 4 },
  similarThumb: { width: 56, height: 56, borderRadius: 8, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.05)" },
});
