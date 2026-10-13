import { useLocalSearchParams } from "expo-router";
import { CheckCircle2, Handshake, Mail, Send, ShieldCheck, type LucideIcon } from "lucide-react-native";
import { useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { Screen } from "@/components/layout/Screen";
import { StackHeader } from "@/components/layout/StackHeader";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { Notice } from "@/components/ui/Notice";
import { Select } from "@/components/ui/Select";
import { Keycap } from "@/components/ui/Step";
import { TextField } from "@/components/ui/TextField";
import { contactContent as copy, SUPPORT_EMAIL } from "@/data/site-content";
import { useAuth } from "@/features/auth/AuthProvider";
import { sendContact } from "@/features/site/api";
import { errorMessage } from "@/lib/api/client";
import { colors } from "@/theme";

const CHANNEL_ICONS: Record<string, LucideIcon> = { email: Mail, brands: Handshake, privacy: ShieldCheck };

/** Questions, feedback or a brand partnership (works signed in or out). */
export default function ContactScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ topic?: string }>();
  const [name, setName] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [topic, setTopic] = useState(copy.topics.some((t) => t.value === params.topic) ? params.topic! : copy.topics[0].value);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = name.trim() && /\S+@\S+\.\S+/.test(email.trim()) && message.trim().length >= 10;

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await sendContact({ name: name.trim(), email: email.trim().toLowerCase(), topic, message: message.trim(), userId: user?.id });
      setSubmitted(true);
      setMessage("");
    } catch (e) {
      setError(errorMessage(e, "Could not submit your message right now. You can also email us directly."));
    } finally {
      setSubmitting(false);
    }
  };

  const openMail = () => {
    const topicLabel = copy.topics.find((t) => t.value === topic)?.label ?? topic;
    const body = `${message}\n\n— ${name} (${email})`;
    void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(topicLabel)}&body=${encodeURIComponent(body)}`).catch(() => undefined);
  };

  return (
    <Screen header={<StackHeader title="Contact" />} keyboard>
      <View style={styles.head}>
        <GradientText variant="h2">{copy.title}</GradientText>
        <AppText variant="body" color={colors.subtle}>
          {copy.description}
        </AppText>
      </View>

      {submitted ? (
        <GlassCard padding={24}>
          <View style={styles.row}>
            <CheckCircle2 size={28} color={colors.accentBright} />
            <AppText variant="title">Message received!</AppText>
          </View>
          <AppText variant="body" color={colors.subtle} style={styles.gap}>
            Thank you for reaching out. Your message has been routed to our team and we will respond to <AppText variant="body">{email}</AppText> within one working day.
          </AppText>
          <View style={[styles.row, styles.gap]}>
            <Button variant="ghost" onPress={() => setSubmitted(false)}>
              Send another message
            </Button>
          </View>
        </GlassCard>
      ) : (
        <GlassCard>
          <View style={styles.form}>
            <TextField size="md" capsLabel label={copy.name} value={name} onChangeText={setName} autoComplete="name" textContentType="name" />
            <TextField size="md" capsLabel label={copy.email} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
            <Select label={copy.topic} value={topic} onChange={setTopic} options={copy.topics} />
            <TextField size="md" capsLabel multiline label={copy.message} value={message} onChangeText={setMessage} placeholder={copy.messagePlaceholder} hint="At least 10 characters" />
            {error ? (
              <Notice tone="error">
                <View style={styles.errorBody}>
                  <AppText variant="sm" color="#fecaca">
                    {error}
                  </AppText>
                  <Pressable onPress={openMail}>
                    <AppText variant="sm" style={styles.underline}>
                      Email directly instead
                    </AppText>
                  </Pressable>
                </View>
              </Notice>
            ) : null}
            <Button fullWidth size="lg" icon={Send} loading={submitting} disabled={!valid} onPress={submit}>
              {copy.submit}
            </Button>
            <Pressable onPress={openMail} style={styles.center}>
              <AppText variant="xs" color={colors.muted} style={styles.underline}>
                Or compose in your email app
              </AppText>
            </Pressable>
          </View>
        </GlassCard>
      )}

      {copy.channels.map((c) => {
        const Icon = CHANNEL_ICONS[c.id] ?? Mail;
        return (
          <GlassCard key={c.id} padding={18}>
            <View style={styles.channel}>
              <Keycap icon={Icon} size={40} iconSize={18} />
              <View style={styles.flex}>
                <AppText variant="body" weight="medium">
                  {c.title}
                </AppText>
                <AppText variant="sm" color={colors.muted}>
                  {c.body}
                </AppText>
                <AppText variant="sm" color={colors.subtle} numberOfLines={1}>
                  {c.value}
                </AppText>
              </View>
            </View>
          </GlassCard>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  gap: { marginTop: 12 },
  form: { gap: 14 },
  errorBody: { gap: 6 },
  underline: { textDecorationLine: "underline" },
  center: { alignSelf: "center" },
  channel: { flexDirection: "row", gap: 14 },
});
