import { useMemo } from "react";
import { ActivityIndicator, Linking, Modal, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { AppText } from "@/components/ui/AppText";
import { colors } from "@/theme";
import type { CheckoutOrder } from "./api";

export type CheckoutResult = { orderId: string; paymentId: string; signature: string };

/**
 * Razorpay Standard Checkout inside a WebView (the native SDK isn't available in Expo Go).
 * The page opens Checkout for a server-created order and posts the signed result back; the
 * caller sends it to the server to verify. UPI app links are handed to the phone.
 */
export function RazorpayCheckout({
  order,
  prefill,
  onSuccess,
  onDismiss,
  onError,
}: {
  order: CheckoutOrder | null;
  prefill: { email?: string; name?: string };
  onSuccess: (result: CheckoutResult) => void;
  onDismiss: () => void;
  onError: (message: string) => void;
}) {
  const insets = useSafeAreaInsets();

  const html = useMemo(() => {
    if (!order) return "";
    const options = {
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: "Threadflank",
      description: `${order.pack.credits} AI looks · ${order.pack.name}`,
      prefill,
      theme: { color: "#6645eb" },
    };
    return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>html,body{margin:0;background:#010214;}</style>
<script src="https://checkout.razorpay.com/v1/checkout.js"></script></head><body><script>
  var send = function (m) { window.ReactNativeWebView.postMessage(JSON.stringify(m)); };
  try {
    var options = ${JSON.stringify(options)};
    options.handler = function (r) { send({ type: "success", orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }); };
    options.modal = { ondismiss: function () { send({ type: "dismiss" }); } };
    new Razorpay(options).open();
  } catch (e) { send({ type: "error", message: "Couldn't open the payment window. Check your connection and try again." }); }
</script></body></html>`;
  }, [order, prefill]);

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data) as { type: string; orderId?: string; paymentId?: string; signature?: string; message?: string };
      if (msg.type === "success" && msg.orderId && msg.paymentId && msg.signature) onSuccess({ orderId: msg.orderId, paymentId: msg.paymentId, signature: msg.signature });
      else if (msg.type === "dismiss") onDismiss();
      else if (msg.type === "error") onError(msg.message ?? "Payment failed.");
    } catch {
      // Ignore anything that isn't our message.
    }
  };

  return (
    <Modal visible={Boolean(order)} animationType="slide" onRequestClose={onDismiss} statusBarTranslucent>
      <View style={[styles.fill, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {order && (
          <WebView
            source={{ html, baseUrl: "https://checkout.razorpay.com" }}
            originWhitelist={["*"]}
            javaScriptEnabled
            onMessage={onMessage}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.accentBright} />
                <AppText variant="sm" color={colors.muted}>
                  Opening payment…
                </AppText>
              </View>
            )}
            // UPI apps (upi://, intent://, tez://…) open outside the WebView.
            onShouldStartLoadWithRequest={(req) => {
              if (/^https?:|^about:|^data:/i.test(req.url)) return true;
              Linking.openURL(req.url).catch(() => onError("No app on this phone can open that payment method."));
              return false;
            }}
            style={styles.fill}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.canvas },
  loading: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: colors.canvas },
});
