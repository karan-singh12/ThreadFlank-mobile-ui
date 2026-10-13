import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius } from "@/theme";
import { AppText } from "./AppText";
import { Button } from "./Button";

/** Centered spinner for loading screens and panels. */
export function Loader({ label, style }: { label?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.center, style]}>
      <ActivityIndicator color={colors.accentBright} />
      {label && (
        <AppText variant="sm" color={colors.muted}>
          {label}
        </AppText>
      )}
    </View>
  );
}

/** Dashed-border empty state with an optional icon and action (web empty panels). */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  style,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.empty, style]}>
      {Icon && (
        <View style={styles.iconWrap}>
          <Icon size={22} color={colors.accentBright} strokeWidth={1.75} />
        </View>
      )}
      <AppText variant="body" weight="medium" align="center">
        {title}
      </AppText>
      {description && (
        <AppText variant="sm" color={colors.muted} align="center">
          {description}
        </AppText>
      )}
      {action}
    </View>
  );
}

/** Error panel with a retry button. */
export function ErrorState({ message, onRetry, style }: { message: string; onRetry?: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.empty, style]}>
      <AppText variant="sm" color="#fecaca" align="center">
        {message}
      </AppText>
      {onRetry && (
        <Button variant="ghost" size="sm" onPress={onRetry}>
          Try again
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 32 },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 32,
    borderRadius: radius.panel,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(102,69,235,0.15)",
    borderWidth: 1,
    borderColor: "rgba(127,98,246,0.3)",
    marginBottom: 4,
  },
});
