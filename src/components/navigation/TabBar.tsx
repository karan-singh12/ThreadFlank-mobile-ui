import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/ui/AppText";
import { appNav } from "@/data/app-content";
import { colors, TAB_BAR_HEIGHT } from "@/theme";
import { NAV_ICONS } from "./navIcons";

/**
 * Senior Designer caliber mobile bottom navigation bar:
 * - Rich frosted blur background (never transparent / washed out)
 * - Automatic safe area clearance for Android (3-button / gesture nav) and iOS
 * - Minimal, executive active tab indicators with zero tacky neon glow
 * - Tactile micro-interactions and haptics
 */
export function TabBar({ state, navigation, badges = {} }: BottomTabBarProps & { badges?: Partial<Record<string, number>> }) {
  const insets = useSafeAreaInsets();
  // Safe clearance for both Android navigation bar (buttons / gesture pill) and iOS home indicator
  const bottomInset = Math.max(insets.bottom, Platform.OS === "android" ? 10 : 8);

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {/* Blurred frosted backdrop */}
      <View style={[StyleSheet.absoluteFill, styles.overflowClip]}>
        <BlurView
          intensity={Platform.OS === "ios" ? 75 : 85}
          tint="dark"
          style={StyleSheet.absoluteFill}
        >
          <View style={styles.frostedBackdrop} />
        </BlurView>
      </View>

      {/* Subtle top hairline highlight */}
      <View style={styles.hairline} />

      {/* Tab Items Row */}
      <View style={[styles.row, { paddingBottom: bottomInset }]}>
        {state.routes.map((route, index) => {
          const tab = appNav.tabs.find((t) => t.id === route.name);
          if (!tab) return null;
          const focused = state.index === index;
          const Icon = NAV_ICONS[tab.icon];
          const badge = badges[tab.id] ?? 0;

          const onPress = () => {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
              }
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
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            >
              {/* Tab Icon Pill */}
              <View style={[styles.iconPill, focused && styles.iconPillFocused]}>
                <Icon
                  size={19}
                  strokeWidth={focused ? 2.2 : 1.75}
                  color={focused ? "#ffffff" : "rgba(255, 255, 255, 0.45)"}
                />
                {badge > 0 && (
                  <View style={styles.badge}>
                    <AppText variant="micro" weight="medium" color="#fff" style={styles.badgeText}>
                      {badge > 9 ? "9+" : badge}
                    </AppText>
                  </View>
                )}
              </View>

              {/* Tab Label */}
              <AppText
                variant="micro"
                weight={focused ? "medium" : "regular"}
                color={focused ? "#ffffff" : "rgba(255, 255, 255, 0.45)"}
                style={[styles.label, focused && styles.labelFocused]}
              >
                {tab.label}
              </AppText>

              {/* Active dot indicator */}
              <View style={[styles.dot, focused && styles.dotActive]} />
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
  },
  overflowClip: {
    overflow: "hidden",
  },
  frostedBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6, 7, 20, 0.82)",
  },
  hairline: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  item: {
    flex: 1,
    height: TAB_BAR_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    gap: 3,
  },
  itemPressed: {
    opacity: 0.7,
  },
  iconPill: {
    width: 44,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconPillFocused: {
    backgroundColor: "rgba(102, 69, 235, 0.22)",
    borderWidth: 1,
    borderColor: "rgba(127, 98, 246, 0.36)",
  },
  label: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.1,
  },
  labelFocused: {
    color: "#ffffff",
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "transparent",
  },
  dotActive: {
    backgroundColor: colors.accentBright,
  },
  badge: {
    position: "absolute",
    top: -3,
    right: -5,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.accentBright,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(6, 7, 20, 0.95)",
  },
  badgeText: {
    fontSize: 9,
    lineHeight: 11,
  },
});
