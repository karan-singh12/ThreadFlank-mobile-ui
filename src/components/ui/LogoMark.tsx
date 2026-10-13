import { Image } from "expo-image";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

const SOURCE = require("../../../assets/logo-mark.png");

/** Threadflank emblem in a rounded-square badge (web `LogoMark`); `halo` gives the round glowing badge. */
export function LogoMark({ size = 36, halo = false, style }: { size?: number; halo?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      {halo && <View style={[StyleSheet.absoluteFill, styles.halo, { borderRadius: size / 2 }]} />}
      <Image
        source={SOURCE}
        contentFit="cover"
        style={[
          halo ? { position: "absolute", top: size * 0.06, left: size * 0.06, right: size * 0.06, bottom: size * 0.06, borderRadius: size } : StyleSheet.absoluteFill,
          !halo && { borderRadius: size * 0.28 },
          styles.ring,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  halo: { backgroundColor: "rgba(102,69,235,0.25)", shadowColor: "#6645eb", shadowOpacity: 0.8, shadowRadius: 24, shadowOffset: { width: 0, height: 0 } },
  ring: { borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.15)" },
});
