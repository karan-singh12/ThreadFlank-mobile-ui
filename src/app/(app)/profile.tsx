import { useLocalSearchParams } from "expo-router";
import { Calendar, MapPin, Pencil, Phone, Scissors, Sparkles, Users } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Screen } from "@/components/layout/Screen";
import { StackHeader } from "@/components/layout/StackHeader";
import { AppText } from "@/components/ui/AppText";
import { Avatar } from "@/components/ui/Avatar";
import { GradientText } from "@/components/ui/GradientText";
import { profileContent as copy } from "@/data/studio-content";
import { useAuth } from "@/features/auth/AuthProvider";
import { displayName } from "@/features/auth/types";
import { AccountTab } from "@/features/profile/AccountTab";
import { CircleTab } from "@/features/profile/CircleTab";
import { StylistTab } from "@/features/profile/StylistTab";
import { TwinTab } from "@/features/profile/TwinTab";
import { useCircle } from "@/features/workspace/hooks";
import { colors } from "@/theme";

const TABS = ["twin", "circle", "stylist", "account"] as const;
type Tab = (typeof TABS)[number];

/** Your profile: twin (selfie + body), Twin Circle, stylist application and account. */
export default function ProfileScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const initial = (TABS as readonly string[]).includes(params.tab ?? "") ? (params.tab as Tab) : "twin";
  const [tab, setTab] = useState<Tab>(initial);
  const { user } = useAuth();
  const { members, limit } = useCircle();
  const name = displayName(user);

  useEffect(() => {
    if (params.tab && (TABS as readonly string[]).includes(params.tab)) setTab(params.tab as Tab);
  }, [params.tab]);

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "twin", label: copy.tabs.twin, icon: Sparkles },
    { id: "circle", label: `${copy.tabs.circle} · ${members.length}/${limit}`, icon: Users },
    { id: "stylist", label: "Stylist", icon: Scissors },
    { id: "account", label: copy.tabs.account, icon: Pencil },
  ];

  return (
    <Screen header={<StackHeader title="Profile" />} keyboard>
      <View style={styles.identity}>
        <Avatar name={name} src={user?.avatar} size={64} />
        <View style={styles.flex}>
          <GradientText variant="h3" numberOfLines={1}>
            {name}
          </GradientText>
          <AppText variant="sm" color={colors.muted} numberOfLines={1}>
            {user?.email}
          </AppText>
          {user?.bio ? (
            <AppText variant="xs" color="rgba(255,255,255,0.7)" numberOfLines={1}>
              {user.bio}
            </AppText>
          ) : null}
        </View>
      </View>
      {(user?.location || user?.phone || user?.createdAt) && (
        <View style={styles.pills}>
          {user?.location ? <InfoPill icon={MapPin} text={user.location} /> : null}
          {user?.phone ? <InfoPill icon={Phone} text={user.phone} /> : null}
          {user?.createdAt ? <InfoPill icon={Calendar} text={`Joined ${new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`} muted /> : null}
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs} style={styles.tabsBar}>
        {tabs.map((t) => {
          const on = tab === t.id;
          return (
            <Pressable key={t.id} onPress={() => setTab(t.id)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={[styles.tab, on && styles.tabOn]}>
              <t.icon size={16} strokeWidth={1.75} color={on ? colors.ink : colors.muted} />
              <AppText variant="sm" color={on ? colors.ink : colors.muted}>
                {t.label}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      {tab === "twin" && <TwinTab />}
      {tab === "circle" && <CircleTab />}
      {tab === "stylist" && <StylistTab />}
      {tab === "account" && <AccountTab key={user?.id} />}
    </Screen>
  );
}

function InfoPill({ icon: Icon, text, muted }: { icon: typeof MapPin; text: string; muted?: boolean }) {
  return (
    <View style={styles.pill}>
      <Icon size={12} color={muted ? colors.muted : colors.accentBright} />
      <AppText variant="xs" color={colors.muted}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  identity: { flexDirection: "row", alignItems: "center", gap: 16 },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.glass, paddingHorizontal: 10, paddingVertical: 4 },
  tabsBar: { borderBottomWidth: 1, borderBottomColor: colors.lineSoft, marginHorizontal: -16 },
  tabs: { gap: 8, paddingHorizontal: 16 },
  tab: { height: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabOn: { borderBottomColor: colors.accentBright },
});
