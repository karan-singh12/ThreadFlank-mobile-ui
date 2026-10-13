import { LinearGradient } from "expo-linear-gradient";
import { Users } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Photo } from "@/components/ui/Photo";
import { colors } from "@/theme";

/** A person's photo or initial, or the group mark; `online` adds the presence dot. */
export function ChatAvatar({ name, avatar, group = false, online, size = 44 }: { name: string; avatar?: string | null; group?: boolean; online?: boolean; size?: number }) {
  return (
    <View style={{ width: size, height: size }}>
      {group ? (
        <LinearGradient colors={["#2a2168", "#0c0a26"]} style={[styles.fill, styles.group, { borderRadius: size / 2 }]}>
          <Users size={size * 0.45} color="#fff" strokeWidth={1.75} />
        </LinearGradient>
      ) : avatar ? (
        <View style={[styles.fill, styles.ring, { borderRadius: size / 2 }]}>
          <Photo src={avatar} alt={name} style={StyleSheet.absoluteFill} />
        </View>
      ) : (
        <LinearGradient colors={["#3b2a8f", "#16103f"]} style={[styles.fill, styles.ring, styles.center, { borderRadius: size / 2 }]}>
          <AppText weight="medium" color="#fff" style={{ fontSize: size * 0.36, lineHeight: size * 0.46 }}>
            {(name || "U").charAt(0).toUpperCase()}
          </AppText>
        </LinearGradient>
      )}
      {online && (
        <View
          accessibilityLabel="Online"
          style={[styles.dot, { width: Math.max(10, size * 0.28), height: Math.max(10, size * 0.28), borderRadius: size }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { width: "100%", height: "100%", overflow: "hidden" },
  group: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(107,85,216,0.4)" },
  ring: { borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  center: { alignItems: "center", justifyContent: "center" },
  dot: { position: "absolute", right: 0, bottom: 0, backgroundColor: colors.green, borderWidth: 2, borderColor: colors.canvas },
});
