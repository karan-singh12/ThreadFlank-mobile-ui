import { StyleSheet, View, useWindowDimensions } from "react-native";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";
import { colors } from "@/theme";

/**
 * The dark canvas with the web app's still violet and blue glows (AppShell's blurred
 * circles), drawn as SVG radial gradients since React Native views can't blur.
 */
export function AppBackground({ variant = "app" }: { variant?: "app" | "auth" }) {
  const { width, height } = useWindowDimensions();
  const strong = variant === "auth";
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.canvas }]}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id="top" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#6645eb" stopOpacity={strong ? 0.42 : 0.34} />
            <Stop offset="1" stopColor="#6645eb" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="left" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#6645eb" stopOpacity={0.16} />
            <Stop offset="1" stopColor="#6645eb" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="right" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#1f8fff" stopOpacity={0.13} />
            <Stop offset="1" stopColor="#1f8fff" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={width / 2} cy={-30} rx={width * 1.1} ry={230} fill="url(#top)" />
        <Ellipse cx={-width * 0.05} cy={height * 0.42} rx={width * 0.7} ry={height * 0.3} fill="url(#left)" />
        <Ellipse cx={width * 1.05} cy={height * 0.95} rx={width * 0.75} ry={height * 0.32} fill="url(#right)" />
      </Svg>
    </View>
  );
}
