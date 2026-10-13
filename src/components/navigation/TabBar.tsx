import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/ui/AppText";
import { appNav } from "@/data/app-content";
import { colors, gradients, shadows, TAB_BAR_HEIGHT } from "@/theme";
import { NAV_ICONS } from "./navIcons";

/**
 * The web app's mobile bottom navbar: frosted bar, the active tab's icon on an
 * off-white `.chip-on` circle, labels underneath. Optional count badges (e.g. unread chats).
 */
export function TabBar({ state, navigation, badges = {} }: BottomTabBarProps & { badges?: Partial<Record<string, number>> }) {
  const insets = useSafeAreaInsets();

  const bar = (
    <View style={[styles.row, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const tab = appNav.tabs.find((t) => t.id === route.name);
        if (!tab) return null;
        const focused = state.index === index;
        const Icon = NAV_ICONS[tab.icon];
        const badge = badges[tab.id] ?? 0;

        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => undefined);
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={badge ? `${tab.label}, ${badge} unread` : tab.label}
            style={styles.item}
          >
            <View style={[styles.iconWrap, focused && shadows.chipOn]}>
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
  );

  return (
    <View style={styles.wrap}>
      {Platform.OS === "ios" ? (
        <BlurView intensity={40} tint="dark" style={styles.blur}>
          <View style={styles.tint}>{bar}</View>
        </BlurView>
      ) : (
        <View style={styles.solid}>{bar}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, bottom: 0, borderTopWidth: 1, borderTopColor: colors.lineSoft },
  blur: { overflow: "hidden" },
  tint: { backgroundColor: "rgba(1,2,20,0.6)" },
  solid: { backgroundColor: "rgba(1,2,20,0.94)" },
  row: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 8 },
  item: { flex: 1, height: TAB_BAR_HEIGHT, alignItems: "center", justifyContent: "center", gap: 4 },
  iconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  round: { borderRadius: 16 },
  label: { letterSpacing: -0.2 },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.accentBright,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.canvas,
  },
  badgeText: { fontSize: 10, lineHeight: 12 },
});
