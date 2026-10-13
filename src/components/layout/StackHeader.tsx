import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { IconButton } from "@/components/ui/IconButton";
import { colors, GUTTER } from "@/theme";

/** Header for pushed screens: back button, centred title and an optional trailing action. */
export function StackHeader({ title, subtitle, right, onBack }: { title?: string; subtitle?: string; right?: ReactNode; onBack?: () => void }) {
  const back = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace("/discover")));
  return (
    <View style={styles.bar}>
      <IconButton icon={ChevronLeft} label="Back" onPress={back} iconSize={22} />
      <View style={styles.titleWrap}>
        {title && (
          <AppText variant="body" weight="medium" numberOfLines={1} align="center">
            {title}
          </AppText>
        )}
        {subtitle && (
          <AppText variant="xs" color={colors.muted} numberOfLines={1} align="center">
            {subtitle}
          </AppText>
        )}
      </View>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { height: 56, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: GUTTER },
  titleWrap: { flex: 1, alignItems: "center" },
  right: { minWidth: 40, alignItems: "flex-end" },
});
