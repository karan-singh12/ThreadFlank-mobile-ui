import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocalSearchParams } from "expo-router";
import { Mail } from "lucide-react-native";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, View, type TextInput } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { PasswordField, TextField } from "@/components/ui/TextField";
import { authContent } from "@/data/auth-content";
import { authApi } from "@/features/auth/api";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError } from "@/lib/api/client";
import { AuthScaffold } from "@/features/auth/components/AuthScaffold";
import { applyServerErrors } from "@/features/auth/errors";
import { loginSchema, type LoginValues } from "@/features/auth/schemas";
import { colors } from "@/theme";

const copy = authContent.login;

export default function LoginScreen() {
  const { login } = useAuth();
  const params = useLocalSearchParams<{ reset?: string }>();
  const justReset = params.reset === "success";
  const [formError, setFormError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setUnverifiedEmail(null);
    setResent(false);
    try {
      await login(values);
      // The protected-route guard switches to the app once the session is set.
    } catch (error) {
      // The backend answers 403 when the password is right but the email isn't verified yet.
      if (error instanceof ApiError && error.status === 403) {
        setUnverifiedEmail(values.email);
        return;
      }
      setFormError(applyServerErrors(error, setError, ["email", "password"], { 401: copy.invalidCredentials }) || null);
    }
  });

  return (
    <AuthScaffold title={copy.title} description={copy.description}>
      <View style={styles.form}>
        {justReset && !formError && <Notice tone="success">{authContent.resetPassword.doneDescription}</Notice>}
        {formError && <Notice tone="error">{formError}</Notice>}
        {unverifiedEmail && (
          <>
            <Notice tone={resent ? "success" : "error"}>{resent ? authContent.checkEmail.resent : authContent.checkEmail.notVerified}</Notice>
            {!resent && (
              <Button
                variant="glass"
                size="lg"
                fullWidth
                onPress={() => authApi.resendVerification({ email: unverifiedEmail }).then(() => setResent(true), () => undefined)}
              >
                {authContent.checkEmail.resend}
              </Button>
            )}
          </>
        )}

        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <TextField
              label={copy.email.label}
              icon={Mail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              autoCorrect={false}
              returnKeyType="next"
              placeholder={copy.email.placeholder}
              error={errors.email?.message}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <PasswordField
              ref={passwordRef}
              label={copy.password.label}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              placeholder={copy.password.placeholder}
              error={errors.password?.message}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              onSubmitEditing={onSubmit}
              labelAction={
                <Link href="/forgot-password">
                  <AppText variant="sm" color={colors.accentBright}>
                    {copy.forgot}
                  </AppText>
                </Link>
              }
            />
          )}
        />

        <Button size="lg" fullWidth loading={isSubmitting} loadingText={copy.submitting} onPress={onSubmit} style={styles.submit}>
          {copy.submit}
        </Button>
      </View>

      <View style={styles.switchRow}>
        <AppText variant="sm" color={colors.muted}>
          {copy.switchPrompt}{" "}
        </AppText>
        <Link href="/signup" replace>
          <AppText variant="sm" weight="medium">
            {copy.switchAction}
          </AppText>
        </Link>
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  form: { gap: 20 },
  submit: { marginTop: 8 },
  switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 32 },
});
