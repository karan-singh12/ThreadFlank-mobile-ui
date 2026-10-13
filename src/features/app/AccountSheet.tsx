import { router, type Href } from "expo-router";
import { ChevronRight, Coins, LogOut } from "lucide-react-native";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { NAV_ICONS } from "@/components/navigation/navIcons";
import { AppText } from "@/components/ui/AppText";
import { Avatar } from "@/components/ui/Avatar";
import { Sheet } from "@/components/ui/Sheet";
import { appNav, type NavIcon } from "@/data/app-content";
import { useAuth } from "@/features/auth/AuthProvider";
import { displayName } from "@/features/auth/types";
import { useWallet } from "@/features/billing/api";
import { colors, radius } from "@/theme";

function MenuRow({ label, icon, onPress, danger }: { label: string; icon: NavIcon | typeof LogOut; onPress: () => void; danger?: boolean }) {
  const Icon = typeof icon === "string" ? NAV_ICONS[icon] : icon;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <Icon size={18} strokeWidth={1.75} color={danger ? colors.red : colors.subtle} />
      <AppText variant="body" color={danger ? colors.red : colors.inkSoft} style={styles.rowLabel}>
        {label}
      </AppText>
      {!danger && <ChevronRight size={16} color={colors.dim} />}
    </Pressable>
  );
}

/** The web's profile dropdown as a bottom sheet: identity, credits, account pages, more, sign out. */
export function AccountSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout } = useAuth();
  const { data: wallet } = useWallet();
  const name = displayName(user);

  const go = (href: string) => {
    onClose();
    // Let the sheet start closing before the next screen slides in.
    setTimeout(() => router.push(href as Href), 120);
  };

  const signOut = () =>
    Alert.alert("Sign out?", "You'll need to log in again to use Threadflank.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          onClose();
          void logout();
        },
      },
    ]);

  return (
    <Sheet open={open} onClose={onClose} maxHeight={0.88}>
      <View style={styles.identity}>
        <Avatar name={name} src={user?.avatar} size={48} />
        <View style={styles.identityText}>
          <AppText variant="body" weight="medium" numberOfLines={1}>
            {name}
          </AppText>
          <AppText variant="sm" color={colors.muted} numberOfLines={1}>
            {user?.email}
          </AppText>
        </View>
      </View>

      <Pressable onPress={() => go("/credits")} style={({ pressed }) => [styles.credits, pressed && styles.rowPressed]} accessibilityRole="button">
        <View style={styles.creditsLeft}>
          <Coins size={18} color={colors.cyan} strokeWidth={1.75} />
          <AppText variant="sm">{wallet ? `${wallet.balance} credit${wallet.balance === 1 ? "" : "s"}` : "Credits"}</AppText>
        </View>
        <AppText variant="xs" color={colors.accentBright}>
          Get more
        </AppText>
      </Pressable>

      <View style={styles.group}>
        {appNav.account.map((item) => (
          <MenuRow key={item.id} label={item.label} icon={item.icon} onPress={() => go(item.href)} />
        ))}
      </View>

      <View style={[styles.group, styles.divided]}>
        <AppText variant="label" color={colors.dim} style={styles.groupLabel}>
          {appNav.moreLabel}
        </AppText>
        {appNav.more.map((item) => (
          <MenuRow key={item.id} label={item.label} icon={item.icon} onPress={() => go(item.href)} />
        ))}
      </View>

      <View style={[styles.group, styles.divided]}>
        <MenuRow label={appNav.logout} icon={LogOut} onPress={signOut} danger />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: "row", alignItems: "center", gap: 12 },
  identityText: { flex: 1, gap: 2 },
  credits: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.glass,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  creditsLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  group: { gap: 2 },
  divided: { borderTopWidth: 1, borderTopColor: colors.lineSoft, paddingTop: 12 },
  groupLabel: { paddingHorizontal: 12, paddingBottom: 6 },
  row: { height: 48, flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 12, borderRadius: radius.md },
  rowPressed: { backgroundColor: "rgba(255,255,255,0.06)" },
  rowLabel: { flex: 1 },
});
