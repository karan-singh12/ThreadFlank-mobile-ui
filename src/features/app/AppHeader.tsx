import { router } from "expo-router";
import { Bell, ChevronDown } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/IconButton";
import { LogoMark } from "@/components/ui/LogoMark";
import { brand } from "@/data/app-content";
import { useAuth } from "@/features/auth/AuthProvider";
import { displayName } from "@/features/auth/types";
import { useNotifications } from "@/features/notifications/hooks";
import { colors, GUTTER } from "@/theme";
import { AccountSheet } from "./AccountSheet";

/** Top bar of the signed-in app (web AppShell header): logo, notifications and the account menu. */
export function AppHeader() {
  const { user } = useAuth();
  const { unread } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={styles.bar}>
      <Pressable onPress={() => router.navigate("/discover")} style={styles.brand} accessibilityRole="link" accessibilityLabel={`${brand.name} home`}>
        <LogoMark size={34} />
        <AppText variant="title">{brand.name}</AppText>
      </Pressable>

      <View style={styles.actions}>
        <IconButton
          icon={Bell}
          label={unread ? `Notifications, ${unread} unread` : "Notifications"}
          onPress={() => router.push("/notifications")}
          color={colors.subtle}
          badge={
            unread > 0 ? (
              <View style={styles.badge}>
                <AppText variant="micro" weight="medium" color="#fff" style={styles.badgeText}>
                  {unread > 9 ? "9+" : unread}
                </AppText>
              </View>
            ) : undefined
          }
        />
        <Pressable
          onPress={() => setMenuOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Account menu"
          style={({ pressed }) => [styles.profile, (pressed || menuOpen) && styles.profileActive]}
        >
          <Avatar name={displayName(user)} src={user?.avatar} size={34} />
          <ChevronDown size={16} color={colors.muted} />
        </Pressable>
      </View>

      <AccountSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { height: 60, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: GUTTER },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  profile: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 2,
    paddingRight: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(11,11,30,0.8)",
  },
  profileActive: { borderColor: "rgba(127,98,246,0.6)" },
  badge: {
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.accentBright,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: 10, lineHeight: 12 },
});
