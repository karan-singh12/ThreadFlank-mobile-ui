import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { Camera, Check, Copy, Download, MessageCircle, Share2 } from "lucide-react-native";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ActivityIndicator, Linking, Pressable, Share, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { Sheet } from "@/components/ui/Sheet";
import { shareMedia } from "@/lib/media";
import { colors, gradients, radius } from "@/theme";
import { LinearGradient } from "expo-linear-gradient";
import { SendToChat } from "./SendToChat";

export type ShareChannel = "whatsapp" | "instagram" | "link";
type CardFormat = "whatsapp" | "story";
/** A share link and its branded card. `card(format)` is the card image URL for that format. */
export type PreparedShare = { url: string; card: (format: CardFormat) => string };

const FORMATS: { id: CardFormat; label: string; ratio: number }[] = [
  { id: "whatsapp", label: "Post · 4:5", ratio: 4 / 5 },
  { id: "story", label: "Story · 9:16", ratio: 9 / 16 },
];

/**
 * Branded share cards (web CardShareSheet): a live preview of the card, then WhatsApp, Instagram
 * Story, save, copy link, other apps or send into a chat. `prepare(channel)` creates the link.
 */
export function CardShareSheet({
  open,
  onClose,
  title,
  name,
  image,
  video,
  shareText,
  prepare,
  note,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  name: string;
  image: string;
  video?: string | null;
  shareText: string;
  prepare: (channel: ShareChannel) => Promise<PreparedShare>;
  note?: ReactNode;
}) {
  const [format, setFormat] = useState<CardFormat>("whatsapp");
  const [preview, setPreview] = useState<PreparedShare | null>(null);
  const [loadedCard, setLoadedCard] = useState<string | null>(null);
  const [busy, setBusy] = useState<ShareChannel | "download" | "more" | "video" | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // One share link per channel for the life of the sheet, so retries and double taps reuse it.
  const prepared = useRef(new Map<ShareChannel, Promise<PreparedShare>>());
  const prepareOnce = (channel: ShareChannel) => {
    let pending = prepared.current.get(channel);
    if (!pending) {
      pending = prepare(channel);
      prepared.current.set(channel, pending);
      pending.catch(() => prepared.current.delete(channel));
    }
    return pending;
  };

  useEffect(() => {
    if (!open || preview) return;
    let cancelled = false;
    prepareOnce("link")
      .then((p) => !cancelled && setPreview(p))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
    // prepareOnce caches by channel, so it's safe to leave out of the deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preview]);

  const run = async (kind: NonNullable<typeof busy>, fn: () => Promise<void>) => {
    setBusy(kind);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const whatsapp = () =>
    run("whatsapp", async () => {
      const share = await prepareOnce("whatsapp");
      const text = `${shareText} ${share.url}`;
      const deep = `whatsapp://send?text=${encodeURIComponent(text)}`;
      // The link unfurls into the same branded card inside WhatsApp.
      if (await Linking.canOpenURL(deep).catch(() => false)) await Linking.openURL(deep);
      else await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`);
    });

  // Instagram takes the story-sized card through the system share sheet.
  const instagram = () =>
    run("instagram", async () => {
      const share = await prepareOnce("instagram");
      await shareMedia(share.card("story"), "image/png");
    });

  const saveCard = () =>
    run("download", async () => {
      const share = await prepareOnce("link");
      await shareMedia(share.card(format), "image/png");
    });

  const copyLink = () =>
    run("link", async () => {
      const share = await prepareOnce("link");
      await Clipboard.setStringAsync(share.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });

  const more = () =>
    run("more", async () => {
      const share = await prepareOnce("link");
      await Share.share({ title: name, message: `${shareText} ${share.url}`, url: share.url });
    });

  const cardSrc = preview?.card(format) ?? null;
  const ratio = FORMATS.find((f) => f.id === format)!.ratio;

  return (
    <Sheet open={open} onClose={onClose} title={title} footer={<Button variant="ghost" fullWidth onPress={onClose}>Done</Button>}>
      <View style={styles.previewCol}>
        <View style={[styles.card, { aspectRatio: ratio }]}>
          {cardSrc && (
            <Image
              key={cardSrc}
              source={{ uri: cardSrc }}
              contentFit="cover"
              onLoad={() => setLoadedCard(cardSrc)}
              onError={() => setLoadedCard(cardSrc)}
              style={[StyleSheet.absoluteFill, { opacity: loadedCard === cardSrc ? 1 : 0 }]}
              transition={250}
            />
          )}
          {loadedCard !== cardSrc && (
            <View style={[StyleSheet.absoluteFill, styles.cardLoading]}>
              <ActivityIndicator color={colors.accentBright} />
              <AppText variant="xs" color={colors.muted}>
                {preview ? "Designing your card…" : "Preparing link…"}
              </AppText>
            </View>
          )}
        </View>
        <View style={styles.formats}>
          {FORMATS.map((f) => {
            const on = format === f.id;
            return (
              <Pressable key={f.id} onPress={() => setFormat(f.id)} style={styles.formatBtn} accessibilityRole="radio" accessibilityState={{ selected: on }}>
                {on && <LinearGradient colors={gradients.chipOn} style={[StyleSheet.absoluteFill, styles.formatOn]} />}
                <AppText variant="micro" color={on ? colors.chipOnText : colors.muted}>
                  {f.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.meta}>
        <AppText variant="body" weight="medium" numberOfLines={1}>
          {name}
        </AppText>
        <AppText variant="xs" color={colors.muted}>
          Shared as a branded card with a link back here, so anyone can open it and try it on their own twin.
        </AppText>
        {note ? (
          typeof note === "string" ? (
            <AppText variant="xs" color={colors.muted}>
              {note}
            </AppText>
          ) : (
            note
          )
        ) : null}
      </View>

      <View style={styles.grid}>
        <ShareTile onPress={whatsapp} busy={busy === "whatsapp"} label="WhatsApp" bg="rgba(31,170,83,0.15)" fg="#5ee08e" icon={<MessageCircle size={20} color="#5ee08e" />} />
        <ShareTile onPress={instagram} busy={busy === "instagram"} label="Instagram Story" bg="rgba(193,53,132,0.15)" fg="#f58fd0" icon={<Camera size={20} color="#f58fd0" />} />
        <ShareTile onPress={saveCard} busy={busy === "download"} label="Save card" bg="rgba(196,181,253,0.1)" fg="#ede9fe" icon={<Download size={20} color="#ede9fe" />} />
        <ShareTile
          onPress={copyLink}
          busy={busy === "link"}
          label={copied ? "Copied" : "Copy link"}
          bg="rgba(255,255,255,0.08)"
          fg="#fff"
          icon={copied ? <Check size={20} color="#fff" /> : <Copy size={20} color="#fff" />}
        />
      </View>

      <View style={styles.links}>
        <Pressable onPress={more} disabled={busy === "more"} style={styles.linkRow}>
          <Share2 size={16} color={colors.accentBright} />
          <AppText variant="sm" color={colors.accentBright}>
            More apps…
          </AppText>
        </Pressable>
        {video && (
          <Pressable onPress={() => run("video", () => shareMedia(video, "video/mp4"))} disabled={busy === "video"} style={styles.linkRow}>
            {busy === "video" ? <ActivityIndicator size="small" color={colors.accentBright} /> : <Download size={16} color={colors.accentBright} />}
            <AppText variant="sm" color={colors.accentBright}>
              Share the video for Reels / Stories
            </AppText>
          </Pressable>
        )}
      </View>

      <SendToChat image={image} message={shareText} onError={setError} />

      {error ? <Notice tone="error">{error}</Notice> : null}
    </Sheet>
  );
}

function ShareTile({ onPress, busy, label, bg, fg, icon }: { onPress: () => void; busy: boolean; label: string; bg: string; fg: string; icon: ReactNode }) {
  return (
    <Pressable onPress={onPress} disabled={busy} style={({ pressed }) => [styles.tile, { backgroundColor: bg }, (busy || pressed) && styles.tileBusy]}>
      {busy ? <ActivityIndicator color={fg} /> : icon}
      <AppText variant="xs" weight="medium" color={fg}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  previewCol: { alignItems: "center", gap: 10 },
  card: {
    width: 200,
    borderRadius: radius.card,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.glass,
  },
  cardLoading: { alignItems: "center", justifyContent: "center", gap: 8 },
  formats: { flexDirection: "row", gap: 4, padding: 2, borderRadius: 999, borderWidth: 1, borderColor: colors.line },
  formatBtn: { height: 28, paddingHorizontal: 12, borderRadius: 14, justifyContent: "center", overflow: "hidden" },
  formatOn: { borderRadius: 14 },
  meta: { gap: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tile: { width: "48.5%", height: 72, borderRadius: radius.card, alignItems: "center", justifyContent: "center", gap: 6 },
  tileBusy: { opacity: 0.7 },
  links: { gap: 10 },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start" },
});
