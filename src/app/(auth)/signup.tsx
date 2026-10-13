import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import { AtSign, Mail } from "lucide-react-native";
import { useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { StyleSheet, Text, View, type TextInput } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Notice } from "@/components/ui/Notice";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { PasswordField, TextField } from "@/components/ui/TextField";
import { authContent } from "@/data/auth-content";
import { useAuth } from "@/features/auth/AuthProvider";
import { AuthScaffold } from "@/features/auth/components/AuthScaffold";
import { applyServerErrors } from "@/features/auth/errors";
import { signupSchema, type SignupValues } from "@/features/auth/schemas";
import { ApiError } from "@/lib/api/client";
import { colors, fonts } from "@/theme";

const copy = authContent.signup;

export default function SignupScreen() {
  const { signup } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: "onTouched",
    defaultValues: { username: "", email: "", password: "", confirmPassword: "", acceptTerms: false },
  });
  const password = useWatch({ control, name: "password" });

  const onSubmit = handleSubmit(async ({ username, email, password: pw }) => {
    setFormError(null);
    try {
      await signup({ username, email, password: pw });
    } catch (error) {
      // The backend reports a taken email as a plain 400 message; attach it to the field.
      if (error instanceof ApiError && error.status === 400 && /email/i.test(error.message) && /registered|exists/i.test(error.message)) {
        setError("email", { type: "server", message: error.message });
        return;
      }
      setFormError(applyServerErrors(error, setError, ["username", "email", "password"]) || null);
    }
  });

  return (
    <AuthScaffold title={copy.title} description={copy.description}>
      <View style={styles.form}>
        {formError && <Notice tone="error">{formError}</Notice>}

        <Controller
          control={control}
          name="username"
          render={({ field }) => (
            <TextField
              label={copy.username.label}
              icon={AtSign}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              returnKeyType="next"
              placeholder={copy.username.placeholder}
              hint={copy.username.hint}
              error={errors.username?.message}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              onSubmitEditing={() => emailRef.current?.focus()}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <TextField
              ref={emailRef}
              label={copy.email.label}
              icon={Mail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
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
        {errors.email?.type === "server" && (
          <View style={styles.inline}>
            <Link href="/login" replace>
              <AppText variant="xs" color={colors.accentBright}>
                {copy.switchAction}
              </AppText>
            </Link>
            <AppText variant="xs" color={colors.muted}>
              {" "}
              instead?
            </AppText>
          </View>
        )}

        <View style={styles.passwordGroup}>
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <PasswordField
                ref={passwordRef}
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
              returnKeyType="done"
              placeholder={copy.confirmPassword.placeholder}
              error={errors.confirmPassword?.message}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />

        <Controller
          control={control}
          name="acceptTerms"
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              onChange={field.onChange}
              error={errors.acceptTerms?.message}
              label={
                <Text style={styles.terms}>
                  {copy.terms.prefix}{" "}
                  <Text style={styles.link} onPress={() => router.push("/legal/terms")}>
                    {copy.terms.terms}
                  </Text>{" "}
                  {copy.terms.and}{" "}
                  <Text style={styles.link} onPress={() => router.push("/legal/disclaimer")}>
                    {copy.terms.privacy}
                  </Text>
                </Text>
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
        <Link href="/login" replace>
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
  passwordGroup: { gap: 10 },
  inline: { flexDirection: "row", marginTop: -12 },
  terms: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.subtle },
  link: { color: colors.ink, fontFamily: fonts.medium, textDecorationLine: "underline" },
  submit: { marginTop: 8 },
  switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 32 },
});
