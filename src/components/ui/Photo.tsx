import { Image, type ImageContentFit } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { assetUrl } from "@/lib/api/config";
import { tones } from "@/theme";
import { AppText } from "./AppText";

type Props = {
  src?: string | null;
  alt?: string;
  fit?: ImageContentFit;
  /** Gradient shown while there's no image (or it failed), as the web's `Art` tones. */
  tone?: string;
  style?: StyleProp<ViewStyle>;
  /** Show the alt text's initials on the placeholder. */
  initials?: boolean;
  transition?: number;
};

/** Remote or local image resolved through `assetUrl`, with a tone gradient fallback. */
export function Photo({ src, alt = "", fit = "cover", tone = "violet", style, initials = false, transition = 180 }: Props) {
  const [failed, setFailed] = useState(false);
  const uri = assetUrl(src);
  const show = Boolean(uri) && !failed;
  const stops = tones[tone] ?? tones.violet;

  return (
    <View style={[styles.box, style]}>
      {!show && (
        <LinearGradient colors={stops} start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }} style={[StyleSheet.absoluteFill, styles.center]}>
          {initials && alt ? (
            <AppText variant="micro" weight="bold" color="#fff" style={styles.initials}>
              {alt.slice(0, 2).toUpperCase()}
            </AppText>
          ) : null}
        </LinearGradient>
      )}
      {show && (
        <Image
          source={{ uri }}
          accessibilityLabel={alt || undefined}
          contentFit={fit}
          transition={transition}
          cachePolicy="memory-disk"
          onError={() => setFailed(true)}
          style={StyleSheet.absoluteFill}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: "hidden", backgroundColor: "rgba(255,255,255,0.04)" },
  center: { alignItems: "center", justifyContent: "center" },
  initials: { letterSpacing: 1 },
});
