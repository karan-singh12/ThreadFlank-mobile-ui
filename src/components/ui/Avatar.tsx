import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors } from "@/theme";
import { AppText } from "./AppText";
import { Photo } from "./Photo";

type Props = {
  name?: string | null;
  src?: string | null;
  size?: number;
  online?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Round avatar: the photo, or the first letter on the accent violet. */
export function Avatar({ name, src, size = 40, online, style }: Props) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <View style={[{ width: size, height: size }, style]}>
      <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
        {src ? (
          <Photo src={src} alt={name ?? ""} style={StyleSheet.absoluteFill} />
        ) : (
          <AppText weight="medium" color="#fff" style={{ fontSize: size * 0.4, lineHeight: size * 0.5 }}>
            {initial}
          </AppText>
        )}
      </View>
      {online != null && (
        <View
          style={[
            styles.dot,
            {
              width: Math.max(10, size * 0.26),
              height: Math.max(10, size * 0.26),
              borderRadius: size,
              backgroundColor: online ? colors.green : colors.dim,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  dot: { position: "absolute", right: 0, bottom: 0, borderWidth: 2, borderColor: colors.canvas },
});
