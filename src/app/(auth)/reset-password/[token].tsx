import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { StyleSheet, View, type TextInput } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { PasswordField } from "@/components/ui/TextField";
import { authContent } from "@/data/auth-content";
import { authApi } from "@/features/auth/api";
import { AuthScaffold } from "@/features/auth/components/AuthScaffold";
import { applyServerErrors } from "@/features/auth/errors";
import { resetPasswordSchema, type ResetPasswordValues } from "@/features/auth/schemas";
import { ApiError } from "@/lib/api/client";
import { colors } from "@/theme";

const copy = authContent.resetPassword;

/** Opened from the reset email's deep link: threadflank://reset-password/<token>. */
export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [formError, setFormError] = useState<string | null>(null);
  const [linkInvalid, setLinkInvalid] = useState(!token);
  const confirmRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    defaultValues: { password: "", confirmPassword: "" },
  });
  const password = useWatch({ control, name: "password" });

  const onSubmit = handleSubmit(async ({ password: pw }) => {
    setFormError(null);
    try {
      await authApi.resetPassword({ token: String(token), newPassword: pw });
      router.replace({ pathname: "/login", params: { reset: "success" } });
    } catch (error) {
      if (error instanceof ApiError && error.status === 400 && !error.fieldErrors.length) {
        setLinkInvalid(true);
        return;
      }
      setFormError(applyServerErrors(error, setError, ["password"]) || null);
    }
  });

  return (
    <AuthScaffold title={copy.title} description={copy.description}>
      <View style={styles.form}>
        {linkInvalid && (
          <Notice tone="error">
            <View style={styles.invalid}>
              <AppText variant="sm" color="#fecaca">
                {copy.invalidLink}
              </AppText>
              <Link href="/forgot-password" replace>
                <AppText variant="sm" weight="medium" style={styles.underline}>
                  {copy.requestNew}
                </AppText>
              </Link>
            </View>
          </Notice>
        )}
        {formError && <Notice tone="error">{formError}</Notice>}

        <View style={styles.passwordGroup}>
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <PasswordField
                label={copy.password.label}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="next"
                placeholder={copy.password.placeholder}
                hint={copy.password.hint}
                error={errors.password?.message}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                onSubmitEditing={() => confirmRef.current?.focus()}
              />
            )}
          />
          <PasswordStrength value={password} />
        </View>

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field }) => (
            <PasswordField
              ref={confirmRef}
              label={copy.confirmPassword.label}
              autoComplete="new-password"
              textContentType="newPassword"
              placeholder={copy.confirmPassword.placeholder}
              error={errors.confirmPassword?.message}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              onSubmitEditing={onSubmit}
            />
          )}
        />

        <Button size="lg" fullWidth loading={isSubmitting} loadingText={copy.submitting} disabled={linkInvalid} onPress={onSubmit} style={styles.submit}>
          {copy.submit}
        </Button>
      </View>

      <Link href="/login" replace style={styles.back}>
        <View style={styles.backRow}>
          <ArrowLeft size={16} color={colors.muted} />
          <AppText variant="sm" color={colors.muted}>
            {copy.back}
          </AppText>
        </View>
      </Link>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  form: { gap: 20 },
  passwordGroup: { gap: 10 },
  invalid: { gap: 6 },
  underline: { textDecorationLine: "underline" },
  submit: { marginTop: 8 },
  back: { alignSelf: "center", marginTop: 32 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 8 },
});
