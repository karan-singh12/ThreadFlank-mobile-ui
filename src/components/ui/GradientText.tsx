import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import { gradients } from "@/theme";
import { AppText, type AppTextProps } from "./AppText";

type Tone = "chrome" | "chromeSoft" | "chromeDim";

/** Heading with the web's `.chrome` fill: white at the cap line fading to grey at the baseline. */
export function GradientText({ tone = "chrome", style, ...props }: AppTextProps & { tone?: Tone }) {
  const stops = gradients[tone];
  return (
    <MaskedView maskElement={<AppText {...props} style={style} />}>
      <View>
        {/* Invisible copy sizes the gradient to the text. */}
        <AppText {...props} style={[style, styles.hidden]} />
        <LinearGradient colors={stops} locations={stops.length === 3 ? [0, 0.25, 1] : undefined} style={StyleSheet.absoluteFill} />
      </View>
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  hidden: { opacity: 0 },
});
