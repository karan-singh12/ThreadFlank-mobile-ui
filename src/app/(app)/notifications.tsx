import { Bell, CheckCheck } from "lucide-react-native";
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "@/components/layout/Screen";
import { StackHeader } from "@/components/layout/StackHeader";
import { AppText } from "@/components/ui/AppText";
import { EmptyState, Loader } from "@/components/ui/States";
import { useNotifications } from "@/features/notifications/hooks";
import type { AppNotification } from "@/features/social/api";
import { ago } from "@/lib/format";
import { openAppLink } from "@/lib/links";
import { colors, GUTTER } from "@/theme";

/** In-app notifications: circle invites, borrow requests, events, GRWM and stylist feedback. */
export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { items, unread, loading, refetch, refreshing, markRead, markAll } = useNotifications();

  const open = (n: AppNotification) => {
    if (!n.readAt) markRead(n.id);
    openAppLink(n.link);
  };

  return (
    <Screen
      scroll={false}
      padded={false}
      header={
        <StackHeader
          title="Notifications"
          right={
            unread > 0 ? (
              <Pressable onPress={() => markAll()} hitSlop={8} style={styles.readAll} accessibilityLabel="Mark all read">
                <CheckCheck size={16} color={colors.accentBright} />
              </Pressable>
            ) : undefined
          }
        />
      }
    >
      {loading ? (
        <Loader />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => refetch()} tintColor={colors.accentBright} colors={[colors.accentBright]} progressBackgroundColor={colors.surface} />}
          ListEmptyComponent={<EmptyState icon={Bell} title="You're all caught up." description="Circle invites, event updates and stylist feedback show up here." style={styles.empty} />}
          renderItem={({ item: n }) => (
            <Pressable onPress={() => open(n)} style={({ pressed }) => [styles.item, !n.readAt && styles.unread, pressed && styles.pressed]}>
              <View style={[styles.dot, !n.readAt && styles.dotOn]} />
              <View style={styles.text}>
                <AppText variant="sm">{n.title}</AppText>
                {n.body ? (
                  <AppText variant="xs" color={colors.muted} numberOfLines={2}>
                    {n.body}
                  </AppText>
                ) : null}
              </View>
              <AppText variant="micro" color={colors.muted}>
                {ago(n.createdAt)}
              </AppText>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  readAll: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  list: { paddingTop: 4 },
  empty: { marginHorizontal: GUTTER, marginTop: 24 },
  item: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: GUTTER, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  unread: { backgroundColor: "rgba(102,69,235,0.08)" },
  pressed: { backgroundColor: "rgba(255,255,255,0.04)" },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, backgroundColor: "transparent" },
  dotOn: { backgroundColor: colors.accentBright },
  text: { flex: 1, gap: 2 },
});
