import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Screen } from "@/components/layout/Screen";
import { StackHeader } from "@/components/layout/StackHeader";
import { AppText } from "@/components/ui/AppText";
import { GradientText } from "@/components/ui/GradientText";
import { brand } from "@/data/app-content";
import { LEGAL_UPDATED, disclaimerContent, privacyContent, termsContent } from "@/data/site-content";
import { fetchCmsBlock, parseLegalBody } from "@/features/site/api";
import { queryKeys } from "@/lib/queryKeys";
import { colors } from "@/theme";

const PAGES = { terms: termsContent, privacy: privacyContent, disclaimer: disclaimerContent } as const;
type Key = keyof typeof PAGES;

/** Terms, privacy and disclaimer: the published CMS block when there is one, else the built-in copy. */
export default function LegalScreen() {
  const params = useLocalSearchParams<{ key: string }>();
  const key: Key = params.key in PAGES ? (params.key as Key) : "terms";
  const fallback = PAGES[key](brand.name);
  const cms = useQuery({ queryKey: queryKeys.cms(key), queryFn: () => fetchCmsBlock(key), staleTime: 10 * 60_000 });
  const parsed = cms.data ? parseLegalBody(cms.data) : null;

  const title = parsed?.title ?? fallback.title;
  const intro = parsed?.intro ?? fallback.intro;
  const sections = parsed?.sections?.length ? parsed.sections : fallback.sections;
  const updated = parsed?.lastUpdated ?? LEGAL_UPDATED;

  return (
    <Screen header={<StackHeader title={fallback.title} />}>
      <View style={styles.head}>
        <View style={styles.row}>
          <AppText variant="label" color={colors.muted}>
            Last updated {updated}
          </AppText>
          {parsed && (
            <View style={styles.live}>
              <AppText variant="micro" weight="medium" color={colors.accentBright}>
                Live
              </AppText>
            </View>
          )}
        </View>
        <GradientText variant="h2">{title}</GradientText>
        <AppText variant="bodyLg" color={colors.subtle}>
          {intro}
        </AppText>
      </View>

      {sections.map((s, i) => (
        <View key={`${s.heading}-${i}`} style={styles.section}>
          <AppText variant="title">{s.heading}</AppText>
          {s.body.map((p, j) => (
            <AppText key={`${i}-${j}`} variant="body" color={colors.subtle}>
              {p}
            </AppText>
          ))}
        </View>
      ))}

      <View style={styles.footer}>
        <AppText variant="sm" color={colors.muted}>
          Questions about this page?{" "}
        </AppText>
        <Pressable onPress={() => router.push({ pathname: "/contact", params: { topic: "privacy" } })}>
          <AppText variant="sm" color={colors.accentBright}>
            Contact us
          </AppText>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  live: { borderRadius: 999, borderWidth: 1, borderColor: "rgba(127,98,246,0.2)", backgroundColor: "rgba(127,98,246,0.1)", paddingHorizontal: 8, paddingVertical: 1 },
  section: { gap: 10 },
  footer: { flexDirection: "row", flexWrap: "wrap", paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.lineSoft },
});
