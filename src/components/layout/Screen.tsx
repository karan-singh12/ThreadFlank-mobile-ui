import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppBackground } from "@/components/ui/AppBackground";
import { colors, GUTTER, TAB_BAR_HEIGHT } from "@/theme";

type Props = {
  children: ReactNode;
  /** Fixed bar at the top (AppHeader / StackHeader). Rendered below the status bar inset. */
  header?: ReactNode;
  /** Wrap content in a ScrollView (default). Use `false` for screens with their own FlatList. */
  scroll?: boolean;
  /** Pull-to-refresh for scrolling screens. */
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Leave room for the floating bottom tab bar. */
  tabBar?: boolean;
  /** Add the side gutter and vertical spacing to the content. */
  padded?: boolean;
  /** Avoid the keyboard (forms, chat). */
  keyboard?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** Fixed content pinned above the bottom inset (e.g. a composer or action bar). */
  footer?: ReactNode;
  background?: "app" | "auth";
};

/** Every screen's frame: dark canvas with glows, safe areas, optional scroll and keyboard handling. */
export function Screen({
  children,
  header,
  scroll = true,
  onRefresh,
  refreshing = false,
  tabBar = false,
  padded = true,
  keyboard = false,
  contentStyle,
  footer,
  background = "app",
}: Props) {
  const insets = useSafeAreaInsets();
  const bottomInset = tabBar ? TAB_BAR_HEIGHT + insets.bottom + 16 : footer ? 0 : insets.bottom + 24;
  const padding = padded ? styles.padded : null;

  const body = scroll ? (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={[padding, { paddingBottom: bottomInset }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentBright} colors={[colors.accentBright]} progressBackgroundColor={colors.surface} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, padding, contentStyle]}>{children}</View>
  );

  const content = (
    <>
      {body}
      {footer && <View style={{ paddingBottom: tabBar ? 0 : insets.bottom }}>{footer}</View>}
    </>
  );

  return (
    <View style={styles.fill}>
      <AppBackground variant={background} />
      <View style={{ paddingTop: insets.top }}>{header}</View>
      {keyboard ? (
        <KeyboardAvoidingView style={styles.fill} behavior="padding">
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  padded: { paddingHorizontal: GUTTER, paddingTop: 8, gap: 20 },
});
