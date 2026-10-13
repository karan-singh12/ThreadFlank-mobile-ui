// Per-weight imports, so only the four weights the app uses are bundled.
import { FamiljenGrotesk_400Regular } from "@expo-google-fonts/familjen-grotesk/400Regular";
import { FamiljenGrotesk_500Medium } from "@expo-google-fonts/familjen-grotesk/500Medium";
import { FamiljenGrotesk_600SemiBold } from "@expo-google-fonts/familjen-grotesk/600SemiBold";
import { FamiljenGrotesk_700Bold } from "@expo-google-fonts/familjen-grotesk/700Bold";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider, useAuth } from "@/features/auth/AuthProvider";
import { bindAppFocus, queryClient } from "@/lib/queryClient";
import { colors } from "@/theme";

SplashScreen.preventAutoHideAsync().catch(() => undefined);
SplashScreen.setOptions({ duration: 250, fade: true });

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.canvas, card: colors.canvas, primary: colors.accentBright, text: colors.ink, border: colors.lineSoft },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    FamiljenGrotesk_400Regular,
    FamiljenGrotesk_500Medium,
    FamiljenGrotesk_600SemiBold,
    FamiljenGrotesk_700Bold,
  });

  useEffect(bindAppFocus, []);

  return (
    <SafeAreaProvider style={{ backgroundColor: colors.canvas }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider value={theme}>
            <ToastProvider>
              <StatusBar style="light" />
              <RootNavigator ready={fontsLoaded || Boolean(fontError)} />
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

/** Holds the splash screen until fonts and the saved session are loaded, then gates routes on sign-in. */
function RootNavigator({ ready }: { ready: boolean }) {
  const { status } = useAuth();
  const loaded = ready && status !== "loading";

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => undefined);
  }, [loaded]);

  if (!loaded) return null;
  const signedIn = status === "authenticated";

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas }, animation: "fade" }}>
      <Stack.Screen name="index" />
      {/* Public pages, reachable signed in or out. */}
      <Stack.Screen name="legal/[key]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="contact" options={{ animation: "slide_from_right" }} />
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}
