import { Stack } from "expo-router";
import { useChatRealtime } from "@/features/messages/hooks";
import { colors } from "@/theme";

/** Signed-in area: the tab bar screens plus detail screens pushed on top of them. */
export default function AppLayout() {
  // Presence, unread counts and friend events stay live on every signed-in screen.
  useChatRealtime();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas }, animation: "slide_from_right" }}>
      <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
      <Stack.Screen name="notifications" options={{ animation: "slide_from_bottom" }} />
    </Stack>
  );
}
