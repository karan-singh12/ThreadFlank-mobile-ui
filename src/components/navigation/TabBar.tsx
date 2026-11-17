import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/ui/AppText";
import { appNav } from "@/data/app-content";
import { colors, gradients, TAB_BAR_HEIGHT } from "@/theme";
import { NAV_ICONS } from "./navIcons";

/** Background of the tab bar and the system navigation area under it, so the two read as one bar. */
export const TAB_BAR_BG = "#03041a";

/**
 * The web's phone tab bar (User-Panel AppShell `data-tabbar`): a solid canvas bar with a hairline
 * top border; the active tab's icon sits in the white `.chip-on` circle with a dark icon.
 * The bar runs to the bottom edge, under the system navigation buttons, in one colour.
 */
export function TabBar({ state, emitter, navigateToTab, badges = {} }: BottomTabBarProps & { badges?: Partial<Record<string, number>> }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom }]}>
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const tab = appNav.tabs.find((t) => t.id === route.name);
          if (!tab) return null;
          const focused = state.index === index;
          const Icon = NAV_ICONS[tab.icon];
          const badge = badges[tab.id] ?? 0;

          const onPress = () => {
            const event = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
              navigateToTab(route.key);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={() => emitter.emit({ type: "tabLongPress", target: route.key })}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={badge ? `${tab.label}, ${badge} unread` : tab.label}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            >
              <View style={styles.icon}>
                {focused && <LinearGradient colors={gradients.chipOn} style={[StyleSheet.absoluteFill, styles.round]} />}
                <Icon size={18} strokeWidth={focused ? 2.25 : 1.75} color={focused ? colors.chipOnText : colors.muted} />
                {badge > 0 && (
                  <View style={styles.badge}>
                    <AppText variant="micro" weight="medium" color="#fff" style={styles.badgeText}>
                      {badge > 9 ? "9+" : badge}
                    </AppText>
                  </View>
                )}
              </View>
              <AppText variant="micro" weight={focused ? "medium" : "regular"} color={focused ? colors.ink : colors.subtle} style={styles.label}>
                {tab.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    backgroundColor: TAB_BAR_BG,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  row: { height: TAB_BAR_HEIGHT, flexDirection: "row", alignItems: "center", paddingHorizontal: 8 },
  item: { flex: 1, height: TAB_BAR_HEIGHT, alignItems: "center", justifyContent: "center", gap: 4 },
  pressed: { opacity: 0.7 },
  icon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  round: { borderRadius: 16 },
  label: { fontSize: 11, lineHeight: 12, letterSpacing: -0.1 },
  badge: {
    position: "absolute",
    top: -3,
    right: -6,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.accentBright,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: TAB_BAR_BG,
  },
  badgeText: { fontSize: 9, lineHeight: 11 },
});
