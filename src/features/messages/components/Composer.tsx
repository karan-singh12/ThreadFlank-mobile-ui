import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Camera, Image as ImageIcon, SendHorizontal, Smile, X } from "lucide-react-native";
import { useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { colors, fonts, gradients } from "@/theme";

const EMOJI_LIST = ["😍", "🔥", "✨", "👗", "👠", "💎", "👍", "🙌", "❤️", "🤩", "🖤", "🕶️", "😂", "👀"];
/** The text box grows with the message up to about five lines, then scrolls. */
const MAX_HEIGHT = 128;

function RoundPrimary({ onPress, disabled, label, children }: { onPress: () => void; disabled?: boolean; label: string; children: ReactNode }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityLabel={label} style={({ pressed }) => [styles.round, (disabled || pressed) && styles.dim]}>
      <LinearGradient colors={gradients.primary} style={[StyleSheet.absoluteFill, styles.roundFill]} />
      {children}
    </Pressable>
  );
}

/**
 * Instagram-style composer: a camera button, a text box that grows as you type, and emoji /
 * gallery buttons that give way to Send once there's something to send.
 */
export function Composer({
  value,
  onChange,
  onSend,
  onCamera,
  onGallery,
  attachment,
  onRemoveAttachment,
  uploading,
  placeholder,
}: {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  onCamera: () => void;
  onGallery: () => void;
  attachment: { uri: string; name: string } | null;
  onRemoveAttachment: () => void;
  uploading: boolean;
  placeholder: string;
}) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [height, setHeight] = useState(36);
  const canSend = (value.trim().length > 0 || Boolean(attachment)) && !uploading;

  const submit = () => {
    if (!canSend) return;
    onSend();
    setEmojiOpen(false);
  };

  return (
    <View style={styles.wrap}>
      {emojiOpen && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" contentContainerStyle={styles.emojis}>
          {EMOJI_LIST.map((emoji) => (
            <Pressable key={emoji} onPress={() => onChange(value + emoji)} style={styles.emojiBtn} accessibilityLabel={`Add ${emoji}`}>
              <AppText style={styles.emoji}>{emoji}</AppText>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {attachment && (
        <View style={styles.attachment}>
          <View>
            <Image source={{ uri: attachment.uri }} contentFit="cover" style={styles.thumb} />
            <Pressable onPress={onRemoveAttachment} style={styles.remove} hitSlop={6} accessibilityLabel="Remove photo">
              <X size={14} color="#fff" />
            </Pressable>
          </View>
          <AppText variant="xs" color={colors.muted} numberOfLines={1} style={styles.flex}>
            {attachment.name}
          </AppText>
        </View>
      )}

      <View style={styles.bar}>
        <RoundPrimary onPress={onCamera} label="Take a photo">
          <Camera size={18} color={colors.btnPrimaryText} strokeWidth={2} />
        </RoundPrimary>

        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          selectionColor={colors.accentBright}
          multiline
          onContentSizeChange={(e) => setHeight(Math.min(MAX_HEIGHT, Math.max(36, e.nativeEvent.contentSize.height)))}
          style={[styles.input, { height }]}
          accessibilityLabel={placeholder}
        />

        {canSend || uploading ? (
          <RoundPrimary onPress={submit} disabled={!canSend} label="Send">
            {uploading ? <ActivityIndicator size="small" color={colors.btnPrimaryText} /> : <SendHorizontal size={16} color={colors.btnPrimaryText} />}
          </RoundPrimary>
        ) : (
          <View style={styles.trailing}>
            <Pressable onPress={() => setEmojiOpen((v) => !v)} style={styles.iconBtn} accessibilityLabel="Emoji" accessibilityState={{ selected: emojiOpen }}>
              <Smile size={22} color={emojiOpen ? "#fff" : colors.subtle} strokeWidth={1.75} />
            </Pressable>
            <Pressable onPress={onGallery} style={styles.iconBtn} accessibilityLabel="Choose a photo">
              <ImageIcon size={22} color={colors.subtle} strokeWidth={1.75} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderTopWidth: 1, borderTopColor: colors.lineSoft, backgroundColor: "rgba(1,2,20,0.7)", paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10 },
  emojis: { gap: 2, paddingBottom: 8 },
  emojiBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 24, lineHeight: 30 },
  attachment: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  thumb: { width: 64, height: 64, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  remove: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  flex: { flex: 1 },
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 6,
  },
  round: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  roundFill: { borderRadius: 18 },
  dim: { opacity: 0.6 },
  input: { flex: 1, color: colors.ink, fontFamily: fonts.regular, fontSize: 16, lineHeight: 22, paddingHorizontal: 6, paddingTop: 7, paddingBottom: 7, textAlignVertical: "center" },
  trailing: { flexDirection: "row", alignItems: "center" },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
});
