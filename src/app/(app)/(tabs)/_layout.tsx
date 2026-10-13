import { Tabs } from "expo-router/js-tabs";
import { TabBar } from "@/components/navigation/TabBar";
import { useUnreadChats } from "@/features/messages/hooks";
import { colors } from "@/theme";

export default function TabsLayout() {
  const unread = useUnreadChats();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} badges={{ messages: unread }} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.canvas }, animation: "fade", lazy: true }}
    >
      <Tabs.Screen name="discover" />
      <Tabs.Screen name="drape" />
      <Tabs.Screen name="wardrobe" />
      <Tabs.Screen name="saved" />
      <Tabs.Screen name="messages" />
    </Tabs>
  );
}
