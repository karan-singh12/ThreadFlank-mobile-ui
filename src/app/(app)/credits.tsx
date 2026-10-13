import { LinearGradient } from "expo-linear-gradient";
import { Check, Coins } from "lucide-react-native";
import { useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Screen } from "@/components/layout/Screen";
import { StackHeader } from "@/components/layout/StackHeader";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { LogoMark } from "@/components/ui/LogoMark";
import { Notice } from "@/components/ui/Notice";
import { useToast } from "@/components/ui/Toast";
import { pricingContent } from "@/data/site-content";
import { useAuth } from "@/features/auth/AuthProvider";
import { displayName } from "@/features/auth/types";
import { billingApi, useCatalogue, useCreditHistory, useSetCreditBalance, useWallet, type CheckoutOrder, type CreditPack } from "@/features/billing/api";
import { RazorpayCheckout, type CheckoutResult } from "@/features/billing/RazorpayCheckout";
import { errorMessage } from "@/lib/api/client";
import { ago } from "@/lib/format";
import { colors, radius } from "@/theme";

const copy = pricingContent.credits;
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const REASONS: Record<string, string> = {
  FREE: "Free credits",
  PURCHASE: "Credit pack",
  DRAPE: "Drape render",
  LOOK_EDIT: "Pose / makeup edit",
  VIDEO: "Motion video",
  REFUND: "Refund (render failed)",
  ADMIN: "Adjustment",
};

/** Your credit balance, the packs on sale (paid in Razorpay Checkout) and recent credit history. */
export default function CreditsScreen() {
  const { token, user } = useAuth();
  const toast = useToast();
  const { data: wallet, refetch: refetchWallet } = useWallet();
  const catalogueQuery = useCatalogue();
  const catalogue = catalogueQuery.data ?? copy.fallback;
  const history = useCreditHistory();
  const setCredits = useSetCreditBalance();
  const [busy, setBusy] = useState<string | null>(null);
  const [order, setOrder] = useState<CheckoutOrder | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const buy = async (pack: CreditPack) => {
    if (!token) return;
    setBusy(pack.id);
    setNotice(null);
    try {
      setOrder(await billingApi.createOrder(token, pack.id));
    } catch (e) {
      setNotice({ tone: "error", text: errorMessage(e) });
      setBusy(null);
    }
  };

  const paid = async (result: CheckoutResult) => {
    setOrder(null);
    if (!token) return;
    try {
      const res = await billingApi.verify(token, result);
      setCredits(res.balance);
      void history.refetch();
      setNotice({ tone: "success", text: copy.paid(res.credits, res.balance) });
      toast.show(`${res.credits} credits added`);
    } catch (e) {
      // The webhook still credits a captured payment; refresh to pick it up.
      setNotice({ tone: "error", text: errorMessage(e) });
      void refetchWallet();
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen header={<StackHeader title="Credits" />} onRefresh={() => Promise.all([refetchWallet(), catalogueQuery.refetch(), history.refetch()])} refreshing={history.isRefetching}>
      <View style={styles.titleBlock}>
        <GradientText variant="h2">Credits & pricing</GradientText>
        <AppText variant="sm" color={colors.muted}>
          {pricingContent.description}
        </AppText>
      </View>

      <GlassCard strong padding={18}>
        <View style={styles.balanceRow}>
          <Coins size={22} color={colors.cyan} />
          <View style={styles.flex}>
            <AppText variant="xs" color={colors.muted}>
              Your balance
            </AppText>
            <AppText variant="h3">{wallet ? `${wallet.balance} credit${wallet.balance === 1 ? "" : "s"}` : "—"}</AppText>
          </View>
        </View>
        <AppText variant="xs" color={colors.muted} style={styles.gap}>
          1 credit = 1 AI image · a motion video costs {catalogue.videoCost} credits · failed renders are refunded
        </AppText>
      </GlassCard>

      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      <OfferCard
        name={copy.free.name}
        price={0}
        note="Free, no card needed"
        blurb={copy.free.blurb(catalogue.freeCredits)}
        features={copy.free.features(catalogue.freeCredits)}
        action={
          <View style={styles.static}>
            <AppText variant="sm" color={colors.muted}>
              {copy.free.signedIn}
            </AppText>
          </View>
        }
      />
      {catalogue.packs.map((pack) => (
        <OfferCard
          key={pack.id}
          name={pack.name}
          price={pack.price}
          featured={pack.featured}
          note={`${copy.perLook(pack.price / pack.credits)} · ${copy.oneTime}`}
          blurb={pack.description || `${pack.credits} ${copy.looks}`}
          features={copy.packFeatures(pack.credits, catalogue.videoCost)}
          action={
            !catalogue.paymentsEnabled ? (
              <View style={styles.static}>
                <AppText variant="sm" color={colors.muted}>
                  {copy.comingSoon}
                </AppText>
              </View>
            ) : (
              <Button size="lg" fullWidth variant={pack.featured ? "primary" : "light"} loading={busy === pack.id} loadingText={copy.paying} disabled={Boolean(busy)} onPress={() => buy(pack)}>
                {copy.buy(pack.name)}
              </Button>
            )
          }
        />
      ))}

      <View style={styles.history}>
        <AppText variant="label" color={colors.muted}>
          Recent activity
        </AppText>
        {(history.data ?? []).length === 0 ? (
          <AppText variant="sm" color={colors.muted}>
            No credit activity yet.
          </AppText>
        ) : (
          history.data!.map((t) => (
            <View key={t.id} style={styles.txn}>
              <View style={styles.flex}>
                <AppText variant="sm">{REASONS[t.reason] ?? t.reason}</AppText>
                <AppText variant="xs" color={colors.muted}>
                  {ago(t.createdAt)}
                  {t.note ? ` · ${t.note}` : ""}
                </AppText>
              </View>
              <View style={styles.txnRight}>
                <AppText variant="sm" weight="medium" color={t.delta > 0 ? colors.green : colors.subtle}>
                  {t.delta > 0 ? `+${t.delta}` : t.delta}
                </AppText>
                <AppText variant="micro" color={colors.muted}>
                  Balance {t.balanceAfter}
                </AppText>
              </View>
            </View>
          ))
        )}
      </View>

      <RazorpayCheckout
        order={order}
        prefill={{ email: user?.email, name: displayName(user) }}
        onSuccess={paid}
        onDismiss={() => {
          setOrder(null);
          setBusy(null);
        }}
        onError={(message) => {
          setOrder(null);
          setBusy(null);
          setNotice({ tone: "error", text: message });
        }}
      />
    </Screen>
  );
}

function OfferCard({ name, price, note, blurb, features, featured = false, action }: { name: string; price: number; note: string; blurb: string; features: string[]; featured?: boolean; action: ReactNode }) {
  return (
    <View style={[styles.offer, featured ? styles.offerFeatured : styles.offerPlain]}>
      <LinearGradient colors={featured ? ["rgba(102,69,235,0.24)", colors.canvas] : ["rgba(34,32,39,0.5)", colors.canvas]} style={[StyleSheet.absoluteFill, styles.offerRadius]} />
      {featured && <LogoMark halo size={56} style={styles.offerLogo} />}
      <View style={styles.offerHead}>
        <AppText variant="body" color={colors.cyan} style={styles.upper}>
          {name}
        </AppText>
        {featured && (
          <View style={styles.best}>
            <AppText variant="micro" weight="medium" color="#c9bcff" style={styles.upper}>
              {copy.best}
            </AppText>
          </View>
        )}
      </View>
      <View style={styles.priceRow}>
        <GradientText tone={featured ? "chromeSoft" : "chrome"} style={styles.price} weight="medium">
          {inr(price)}
        </GradientText>
        {price > 0 && (
          <AppText variant="sm" color={colors.dim} style={styles.once}>
            ONE-TIME
          </AppText>
        )}
      </View>
      <AppText variant="sm" color={colors.muted} align="center">
        {note}
      </AppText>
      <AppText variant="bodyLg" color={colors.inkSoft} align="center" style={styles.blurb}>
        {blurb}
      </AppText>
      <View style={styles.features}>
        {features.map((f) => (
          <View key={f} style={styles.feature}>
            <View style={styles.tick}>
              <Check size={12} strokeWidth={2.5} color="#fff" />
            </View>
            <AppText variant="sm" color={colors.inkSoft} style={styles.flex}>
              {f}
            </AppText>
          </View>
        ))}
      </View>
      <View style={styles.offerAction}>{action}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { marginTop: 10 },
  titleBlock: { gap: 6 },
  balanceRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  static: { height: 48, borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  offer: { borderRadius: 24, paddingHorizontal: 24, paddingBottom: 24, overflow: "visible" },
  offerRadius: { borderRadius: 24 },
  offerFeatured: { paddingTop: 44, borderWidth: 1, borderColor: "rgba(124,92,255,0.4)", marginTop: 24 },
  offerPlain: { paddingTop: 32, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  offerLogo: { position: "absolute", top: -28, alignSelf: "center" },
  offerHead: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  upper: { textTransform: "uppercase", letterSpacing: 0.6 },
  best: { borderRadius: 999, backgroundColor: "rgba(102,69,235,0.25)", borderWidth: 1, borderColor: "rgba(127,98,246,0.4)", paddingHorizontal: 10, paddingVertical: 2 },
  priceRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 8, marginTop: 14, marginBottom: 8 },
  price: { fontSize: 52, lineHeight: 58, letterSpacing: -2 },
  once: { paddingBottom: 8 },
  blurb: { marginTop: 16 },
  features: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.lineSoft, gap: 12 },
  feature: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  tick: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.25)", backgroundColor: "rgba(255,255,255,0.04)", alignItems: "center", justifyContent: "center", marginTop: 1 },
  offerAction: { marginTop: 28 },
  history: { gap: 10, marginTop: 8 },
  txn: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.lineSoft, backgroundColor: "rgba(255,255,255,0.02)", paddingHorizontal: 14, paddingVertical: 10 },
  txnRight: { alignItems: "flex-end" },
});
