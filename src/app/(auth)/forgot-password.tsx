import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { ArrowLeft, Mail, MailCheck } from "lucide-react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { TextField } from "@/components/ui/TextField";
import { authContent } from "@/data/auth-content";
import { authApi } from "@/features/auth/api";
import { AuthScaffold } from "@/features/auth/components/AuthScaffold";
import { applyServerErrors } from "@/features/auth/errors";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/features/auth/schemas";
import { colors, fonts, radius } from "@/theme";

const copy = authContent.forgotPassword;

function BackToLogin() {
  return (
    <Link href="/login" replace style={styles.back}>
      <View style={styles.backRow}>
        <ArrowLeft size={16} color={colors.muted} />
        <AppText variant="sm" color={colors.muted}>
          {copy.back}
        </AppText>
      </View>
    </Link>
  );
}

export default function ForgotPasswordScreen() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });

  const onSubmit = handleSubmit(async ({ email }) => {
    setFormError(null);
    try {
      await authApi.forgotPassword({ email });
      setSentTo(email);
    } catch (error) {
      setFormError(applyServerErrors(error, setError, ["email"]) || null);
    }
  });

  if (sentTo) {
    const [before, after] = copy.sentDescription.split("{email}");
    return (
      <AuthScaffold
        title={copy.sentTitle}
        description={
          <Text style={styles.description}>
            {before}
            <Text style={styles.email}>{sentTo}</Text>
            {after}
          </Text>
        }
        badge={
          <View style={styles.badge}>
            <MailCheck size={28} strokeWidth={1.5} color={colors.accentBright} />
          </View>
        }
      >
        <Button
          variant="glass"
          size="lg"
          fullWidth
          onPress={() => {
            reset();
            setSentTo(null);
          }}
        >
          {copy.resend}
        </Button>
        <BackToLogin />
      </AuthScaffold>
    );
  }

  return (
    <AuthScaffold title={copy.title} description={copy.description}>
      <View style={styles.form}>
        {formError && <Notice tone="error">{formError}</Notice>}
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <TextField
              label={copy.email.label}
              icon={Mail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType="send"
              placeholder={copy.email.placeholder}
              error={errors.email?.message}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              onSubmitEditing={onSubmit}
            />
          )}
        />
        <Button size="lg" fullWidth loading={isSubmitting} loadingText={copy.submitting} onPress={onSubmit} style={styles.submit}>
          {copy.submit}
        </Button>
      </View>
      <BackToLogin />
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  form: { gap: 20 },
  submit: { marginTop: 8 },
  back: { alignSelf: "center", marginTop: 32 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  description: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 25, color: colors.muted },
  email: { color: colors.ink },
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
