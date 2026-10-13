import { Link } from "expo-router";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Screen } from "@/components/layout/Screen";
import { AppText } from "@/components/ui/AppText";
import { GradientText } from "@/components/ui/GradientText";
import { LogoMark } from "@/components/ui/LogoMark";
import { brand } from "@/data/app-content";
import { authContent } from "@/data/auth-content";
import { colors, GUTTER } from "@/theme";

type Props = { title: string; description?: ReactNode; children: ReactNode; header?: ReactNode; badge?: ReactNode };

/** The web's auth layout on a phone: logo row, chrome heading, the form, and a legal footer. */
export function AuthScaffold({ title, description, children, header, badge }: Props) {
  return (
    <Screen background="auth" keyboard padded={false} contentStyle={styles.content}>
      <View style={styles.brandRow}>
        <LogoMark size={36} />
        <AppText variant="title">{brand.name}</AppText>
      </View>

      <View style={styles.main}>
        <View style={styles.header}>
          {badge && <View style={styles.badge}>{badge}</View>}
          <GradientText variant="h1" style={styles.title}>
            {title}
          </GradientText>
          {description ? (
            typeof description === "string" ? (
              <AppText variant="body" color={colors.muted}>
                {description}
              </AppText>
            ) : (
              description
            )
          ) : null}
          {header}
        </View>
        {children}
      </View>

      <View style={styles.footer}>
        <AppText variant="xs" color={colors.muted}>
          {brand.copyright}
        </AppText>
        <View style={styles.legal}>
          <Link href="/legal/disclaimer">
            <AppText variant="xs" color={colors.muted}>
              {authContent.legal.privacy}
            </AppText>
          </Link>
          <Link href="/legal/terms">
            <AppText variant="xs" color={colors.muted}>
              {authContent.legal.terms}
            </AppText>
          </Link>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: GUTTER + 4, paddingTop: 12 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  main: { flex: 1, justifyContent: "center", paddingVertical: 40, gap: 0, width: "100%", maxWidth: 420, alignSelf: "center" },
  header: { marginBottom: 32, gap: 12 },
  badge: { marginBottom: 12 },
  title: { fontSize: 36, lineHeight: 42, letterSpacing: -1.1 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 8 },
  legal: { flexDirection: "row", gap: 20 },
});
