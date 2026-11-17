import { router, useLocalSearchParams } from "expo-router";
import { CircleAlert, CircleCheck } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { authContent } from "@/data/auth-content";
import { authApi } from "@/features/auth/api";
import { AuthScaffold } from "@/features/auth/components/AuthScaffold";
import { colors, radius } from "@/theme";

const copy = authContent.verifyEmail;

type State = "verifying" | "done" | "invalid";

/** Opened from the verification email's deep link: threadflank://verify-email/<token>. Same flow as the web page. */
export default function VerifyEmailScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [state, setState] = useState<State>(token ? "verifying" : "invalid");
  // The token is single-use, so it must be sent only once.
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    authApi.verifyEmail({ token }).then(
      () => setState("done"),
      () => setState("invalid")
    );
  }, [token]);

  const badge = (
    <View style={styles.badge}>
      {state === "verifying" && <ActivityIndicator color={colors.accentBright} />}
      {state === "done" && <CircleCheck size={28} strokeWidth={1.5} color={colors.accentBright} />}
      {state === "invalid" && <CircleAlert size={28} strokeWidth={1.5} color={colors.accentBright} />}
    </View>
  );

  if (state === "verifying") return <AuthScaffold title={copy.verifyingTitle} badge={badge}>{null}</AuthScaffold>;

  const done = state === "done";
  return (
    <AuthScaffold title={done ? copy.successTitle : copy.invalidTitle} description={done ? copy.successDescription : copy.invalidDescription} badge={badge}>
      <Button variant="glass" size="lg" fullWidth onPress={() => router.replace("/login")}>
        {done ? copy.successAction : copy.invalidAction}
      </Button>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 56,
    height: 56,
    borderRadius: radius.card,
    backgroundColor: "rgba(102,69,235,0.15)",
    borderWidth: 1,
    borderColor: "rgba(102,69,235,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
});
