import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { CalendarClock, Heart, Share2, Shirt, ShoppingBag, Users } from "lucide-react-native";
import { useState, type ReactNode } from "react";
import { Linking, ScrollView, Share, StyleSheet, View } from "react-native";
import { Pressable } from "@/components/ui/Pressable";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Photo";
import { Sheet } from "@/components/ui/Sheet";
import { useAuth } from "@/features/auth/AuthProvider";
import { discoverApi, type ApiShowcaseDrop, type ApiStorePiece } from "@/features/discover/api";
import { API_BASE_URL, WEB_ORIGIN } from "@/lib/api/config";
import { colors, radius } from "@/theme";

// Same helpers as the web store page (User-Panel/src/features/brands/BrandPage.tsx).
export const rupees = (n: number | null | undefined) => (n && n > 0 ? `₹${n.toLocaleString("en-IN")}` : "Price at store");
const dropDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const buyUrl = (p: ApiStorePiece) => `${API_BASE_URL}/brands/products/${p.id}/go`;

export type LikeMap = Record<string, { liked: boolean; count: number }>;
export const likeOf = (likes: LikeMap, p: ApiStorePiece) => likes[p.id] ?? { liked: Boolean(p.likedByMe), count: p.likesCount };

/** Opens Drape with the piece loaded; `piece` credits the brand with the try-on. */
export function drapePiece(p: ApiStorePiece, brand: string) {
  router.push({ pathname: "/drape", params: { image: p.images[0], title: p.title.slice(0, 50), brand, category: p.category || "", piece: p.id } });
}

export function SectionTitle({ icon, title, sub }: { icon?: ReactNode; title: string; sub?: string }) {
  return (
    <View style={styles.sectionTitle}>
      <View style={styles.row}>
        {icon}
        <AppText variant="label" color={colors.subtle}>
          {title.toUpperCase()}
        </AppText>
      </View>
      {sub ? (
        <AppText variant="sm" color={colors.muted}>
          {sub}
        </AppText>
      ) : null}
    </View>
  );
}

/* ── Piece card: shop grid, New in rail and showcase ── */
export function PieceCard({ piece, likes, accent, onLike, onOpen, width }: { piece: ApiStorePiece; likes: LikeMap; accent: string; onLike: (p: ApiStorePiece) => void; onOpen: (p: ApiStorePiece) => void; width?: number }) {
  const like = likeOf(likes, piece);
  return (
    <View style={[styles.card, width ? { width } : styles.cardFlex]}>
      <Pressable onPress={() => onOpen(piece)} accessibilityLabel={`Quick view: ${piece.title}`} style={styles.cardImage}>
        {piece.images[0] ? (
          <Photo src={piece.images[0]} alt={piece.title} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.center]}>
            <Shirt size={28} color={colors.subtle} />
          </View>
        )}
        <View style={styles.badges}>
          {piece.featured && (
            <View style={[styles.badge, { backgroundColor: accent, borderColor: accent }]}>
              <AppText variant="micro" weight="semibold" color="#fff">
                ★ Featured
              </AppText>
            </View>
          )}
          {piece.newDrop && (
            <View style={styles.badge}>
              <AppText variant="micro" color="#fff">
                New
              </AppText>
            </View>
          )}
          {!piece.inStock && (
            <View style={styles.badge}>
              <AppText variant="micro" color="#f6c453">
                Out of stock
              </AppText>
            </View>
          )}
        </View>
        {piece.isDrapeReady && (
          <View style={[styles.badge, styles.drapeReady]}>
            <Shirt size={10} color={colors.accentBright} />
            <AppText variant="micro" color="rgba(255,255,255,0.9)">
              Drape ready
            </AppText>
          </View>
        )}
      </Pressable>
      <Pressable onPress={() => onLike(piece)} accessibilityRole="button" accessibilityState={{ selected: like.liked }} accessibilityLabel={like.liked ? "Unlike" : "Like"} hitSlop={6} style={styles.likeBtn}>
        <Heart size={16} color={like.liked ? "#ff5c8a" : "#fff"} fill={like.liked ? "#ff5c8a" : "transparent"} />
      </Pressable>
      <View style={styles.cardBody}>
        <AppText variant="sm" weight="medium" numberOfLines={2}>
          {piece.title}
        </AppText>
        <View style={styles.priceRow}>
          <AppText variant="sm" weight="semibold">
            {rupees(piece.price)}
          </AppText>
          {piece.originalPrice ? (
            <AppText variant="micro" color={colors.subtle} style={styles.strike}>
              ₹{piece.originalPrice.toLocaleString("en-IN")}
            </AppText>
          ) : null}
        </View>
        <View style={styles.priceRow}>
          <AppText variant="micro" color={colors.subtle} numberOfLines={1} style={styles.flex}>
            {piece.category}
          </AppText>
          {like.count > 0 ? (
            <AppText variant="micro" color={colors.subtle}>
              {like.count.toLocaleString("en-IN")} ♥
            </AppText>
          ) : null}
        </View>
      </View>
    </View>
  );
}

/* ── Quick view: look closer without leaving the store ── */
export function QuickViewSheet({ piece, brand, slug, likes, accent, onLike, onClose }: { piece: ApiStorePiece | null; brand: string; slug: string; likes: LikeMap; accent: string; onLike: (p: ApiStorePiece) => void; onClose: () => void }) {
  const [shot, setShot] = useState({ id: "", i: 0 });
  const [copied, setCopied] = useState(false);
  if (!piece) return null;
  const i = shot.id === piece.id ? shot.i : 0;
  const like = likeOf(likes, piece);
  const share = async () => {
    const url = `${WEB_ORIGIN}/brands/${slug}`;
    try {
      await Share.share({ title: piece.title, message: `${piece.title} by ${brand}\n${url}` });
    } catch {
      await Clipboard.setStringAsync(url).catch(() => undefined);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };
  return (
    <Sheet open onClose={onClose} title={piece.title} subtitle={`${brand} · ${piece.category}`} maxHeight={0.94}>
      <View style={styles.qvImage}>
        {piece.images[i] ? <Photo src={piece.images[i]} alt={piece.title} style={StyleSheet.absoluteFill} /> : <Shirt size={36} color={colors.subtle} />}
      </View>
      {piece.images.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
          {piece.images.map((src, n) => (
            <Pressable key={src + n} onPress={() => setShot({ id: piece.id, i: n })} accessibilityLabel={`Photo ${n + 1}`} style={[styles.thumb, n === i ? { borderColor: accent, borderWidth: 2 } : styles.thumbOff]}>
              <Photo src={src} style={StyleSheet.absoluteFill} />
            </Pressable>
          ))}
        </ScrollView>
      )}
      <View style={styles.qvPrice}>
        <AppText variant="h3" weight="semibold">
          {rupees(piece.price)}
        </AppText>
        {piece.originalPrice ? (
          <AppText variant="sm" color={colors.subtle} style={styles.strike}>
            ₹{piece.originalPrice.toLocaleString("en-IN")}
          </AppText>
        ) : null}
      </View>
      <AppText variant="xs" color={piece.inStock ? "#6ee7b7" : "#f6c453"}>
        {piece.inStock ? "In stock" : "Out of stock right now"}
      </AppText>
      {piece.description ? (
        <AppText variant="sm" color={colors.muted}>
          {piece.description}
        </AppText>
      ) : null}
      {piece.occasions.length > 0 && (
        <View style={styles.wrapRow}>
          {piece.occasions.map((o) => (
            <View key={o} style={styles.tag}>
              <AppText variant="micro" color="rgba(255,255,255,0.8)">
                {o}
              </AppText>
            </View>
          ))}
        </View>
      )}
      {piece.sizes.length > 0 && (
        <AppText variant="xs" color={colors.subtle}>
          Sizes: <AppText variant="xs">{piece.sizes.join(" · ")}</AppText>
        </AppText>
      )}
      {piece.colors.length > 0 && (
        <AppText variant="xs" color={colors.subtle}>
          Colours: <AppText variant="xs">{piece.colors.join(" · ")}</AppText>
        </AppText>
      )}
      <View style={styles.qvActions}>
        {piece.isDrapeReady && piece.images[0] ? (
          <Button
            icon={Shirt}
            size="lg"
            fullWidth
            onPress={() => {
              onClose();
              drapePiece(piece, brand);
            }}
          >
            Drape it on me
          </Button>
        ) : null}
        <View style={styles.row}>
          {piece.hasBuyLink ? (
            <Button variant="glass" icon={ShoppingBag} style={styles.flex} fullWidth onPress={() => void Linking.openURL(buyUrl(piece))}>
              {`Buy at ${brand}`}
            </Button>
          ) : (
            <View style={[styles.flex, styles.buySoon]}>
              <AppText variant="sm" color={colors.subtle}>
                Buy link coming soon
              </AppText>
            </View>
          )}
          <Pressable onPress={() => onLike(piece)} accessibilityLabel={like.liked ? "Unlike" : "Like"} style={styles.roundBtn}>
            <Heart size={16} color={like.liked ? "#ff5c8a" : "#fff"} fill={like.liked ? "#ff5c8a" : "transparent"} />
          </Pressable>
          <Pressable onPress={share} accessibilityLabel="Share" style={styles.roundBtn}>
            <Share2 size={16} color="#fff" />
          </Pressable>
        </View>
        {copied ? (
          <AppText variant="xs" color="#6ee7b7" align="center">
            Link copied
          </AppText>
        ) : null}
      </View>
    </Sheet>
  );
}

/* ── Drops with a real waitlist ── */
export function DropsStrip({ drops, collections, accent, onShop }: { drops: ApiShowcaseDrop[]; collections: string[]; accent: string; onShop: (name: string) => void }) {
  const { token } = useAuth();
  const [state, setState] = useState<Record<string, { joined: boolean; count: number }>>(() => Object.fromEntries(drops.map((d) => [d.id, { joined: d.joined, count: d.waitlistCount }])));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const toggle = async (drop: ApiShowcaseDrop) => {
    if (!token || busy) return;
    setBusy(drop.id);
    setError("");
    try {
      const res = state[drop.id].joined ? await discoverApi.leaveWaitlist(token, drop.id) : await discoverApi.joinWaitlist(token, drop.id);
      setState((m) => ({ ...m, [drop.id]: { joined: res.joined, count: res.waitlistCount } }));
    } catch {
      setError("We couldn't update your waitlist spot. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <View>
      <SectionTitle icon={<CalendarClock size={13} color={colors.subtle} />} title="Drops" sub="Be first in line when a collection lands." />
      {error ? (
        <AppText variant="xs" color="#fca5a5" style={styles.dropError}>
          {error}
        </AppText>
      ) : null}
      <View style={styles.dropList}>
        {drops.map((d) => {
          const s = state[d.id];
          const live = d.status === "live";
          const match = collections.find((c) => c.toLowerCase() === d.collectionName.trim().toLowerCase());
          return (
            <View key={d.id} style={styles.drop}>
              <View style={styles.dropArt}>{d.bannerUrl ? <Photo src={d.bannerUrl} style={StyleSheet.absoluteFill} /> : <CalendarClock size={18} color={colors.subtle} />}</View>
              <View style={styles.flex}>
                <AppText variant="sm" weight="medium" numberOfLines={1}>
                  {d.title}
                </AppText>
                <AppText variant="xs" color={colors.subtle} numberOfLines={1}>
                  {d.collectionName} · {live ? "Live now" : dropDate(d.launchDate)}
                </AppText>
                <View style={styles.row}>
                  <Users size={11} color={colors.subtle} />
                  <AppText variant="micro" color={colors.subtle}>
                    {s.count.toLocaleString("en-IN")} on the waitlist
                  </AppText>
                </View>
                {match ? (
                  <Pressable onPress={() => onShop(match)} hitSlop={6}>
                    <AppText variant="micro" color={accent}>
                      Shop this collection
                    </AppText>
                  </Pressable>
                ) : null}
              </View>
              {live ? null : token ? (
                <Button size="sm" variant={s.joined ? "glass" : "primary"} loading={busy === d.id} onPress={() => toggle(d)}>
                  {s.joined ? "Leave" : "Notify me"}
                </Button>
              ) : (
                <Button size="sm" variant="glass" onPress={() => router.push("/login")}>
                  Sign in
                </Button>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  center: { alignItems: "center", justifyContent: "center" },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  sectionTitle: { gap: 4, marginBottom: 12 },
  card: { borderRadius: radius.card, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", backgroundColor: "#0b0d22", overflow: "hidden" },
  cardFlex: { flex: 1 },
  cardImage: { aspectRatio: 3 / 4, backgroundColor: "rgba(0,0,0,0.6)" },
  badges: { position: "absolute", left: 8, top: 8, right: 48, flexDirection: "row", flexWrap: "wrap", gap: 4 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(0,0,0,0.75)", paddingHorizontal: 6, paddingVertical: 2 },
  drapeReady: { position: "absolute", left: 8, bottom: 8 },
  likeBtn: { position: "absolute", right: 8, top: 8, width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.55)" },
  cardBody: { padding: 10, gap: 3 },
  priceRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 6 },
  strike: { textDecorationLine: "line-through" },
  qvImage: { aspectRatio: 3 / 4, borderRadius: radius.card, overflow: "hidden", backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  thumbRow: { gap: 8 },
  thumb: { width: 60, height: 60, borderRadius: radius.sm, overflow: "hidden" },
  thumbOff: { borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", opacity: 0.7 },
  qvPrice: { flexDirection: "row", alignItems: "baseline", gap: 10 },
  tag: { borderRadius: radius.pill, backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 10, paddingVertical: 4 },
  qvActions: { gap: 10, marginTop: 4 },
  buySoon: { height: 44, borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  roundBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  dropError: { marginBottom: 8 },
  dropList: { gap: 10 },
  drop: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: radius.card, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)", padding: 10 },
  dropArt: { width: 56, height: 56, borderRadius: radius.md, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },
});
