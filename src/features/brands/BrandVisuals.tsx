import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { assetUrl } from "@/lib/api/config";

/** "Raw Mango Atelier" becomes "RM": what a brand without a (working) logo shows instead. */
export const monogram = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^[a-z0-9]/i.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "•";

/** The brand's own accent colour, or the app's violet when it isn't a valid hex. */
export const brandAccent = (hex?: string | null) => (hex && /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#6645eb");

/** Round brand logo. A missing or broken image falls back to the brand's initials, as on the web. */
export function BrandLogo({ src, name, size = 44, ring, style }: { src?: string | null; name: string; size?: number; ring?: string; style?: StyleProp<ViewStyle> }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const uri = assetUrl(src);
  const show = Boolean(uri) && failedSrc !== uri;
  return (
    <View style={[styles.logo, { width: size, height: size, borderRadius: size / 2 }, ring ? { borderWidth: 2, borderColor: ring } : null, style]}>
      {show ? (
        <Image source={{ uri }} contentFit="contain" style={[StyleSheet.absoluteFill, { margin: size * 0.12 }]} onError={() => setFailedSrc(uri)} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.mono]}>
          <AppText variant="sm" weight="medium" color="#fff" style={{ fontSize: Math.max(11, size * 0.32) }}>
            {monogram(name)}
          </AppText>
        </View>
      )}
    </View>
  );
}

/** Cover image. With no image (or a broken one) the brand colour shows as a soft gradient, as on the web. */
export function BrandBanner({ src, accent, dim = 1 }: { src?: string | null; accent: string; dim?: number }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const uri = assetUrl(src);
  if (!uri || failedSrc === uri) {
    return <LinearGradient colors={[`${accent}8c`, "#0b0c22"]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />;
  }
  return <Image source={{ uri }} contentFit="cover" transition={180} cachePolicy="memory-disk" onError={() => setFailedSrc(uri)} style={[StyleSheet.absoluteFill, { opacity: dim }]} />;
}

const styles = StyleSheet.create({
  logo: { overflow: "hidden", backgroundColor: "#fff" },
  mono: { alignItems: "center", justifyContent: "center", backgroundColor: "#1b1a3a" },
});
