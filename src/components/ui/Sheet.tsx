import { X } from "lucide-react-native";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, GUTTER, radius } from "@/theme";
import { AppText } from "./AppText";
import { IconButton } from "./IconButton";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  /** Sticky footer (e.g. the primary action). */
  footer?: ReactNode;
  /** Max height as a fraction of the screen. */
  maxHeight?: number;
  /** Fill to max height even with short content (lists, chat). */
  full?: boolean;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Bottom sheet modal — the mobile counterpart of the web's dialogs and popovers.
 * Slides up over a dimmed backdrop; tap the backdrop or the X to close.
 */
export function Sheet({ open, onClose, title, subtitle, children, footer, maxHeight = 0.9, full = false, scroll = true, contentStyle }: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(open);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      setMounted(true);
      Animated.timing(progress, { toValue: 1, duration: 280, easing: Easing.bezier(0.16, 1, 0.3, 1), useNativeDriver: true }).start();
    } else if (mounted) {
      Animated.timing(progress, { toValue: 0, duration: 200, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => setMounted(false));
    }
  }, [open, mounted, progress]);

  if (!mounted) return null;

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [height * 0.6, 0] });
  const Body = scroll ? ScrollView : View;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <KeyboardAvoidingView behavior="padding" style={styles.fill}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: progress }]}>
          <Pressable style={styles.fill} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            { maxHeight: height * maxHeight, paddingBottom: footer ? 0 : Math.max(insets.bottom, 16), transform: [{ translateY }] },
            full && { height: height * maxHeight },
          ]}
        >
          <View style={styles.handle} />
          {(title || subtitle) && (
            <View style={styles.header}>
              <View style={styles.headerText}>
                {title && (
                  <AppText variant="title" numberOfLines={1}>
                    {title}
                  </AppText>
                )}
                {subtitle && (
                  <AppText variant="sm" color={colors.muted}>
                    {subtitle}
                  </AppText>
                )}
              </View>
              <IconButton icon={X} label="Close" onPress={onClose} size={36} iconSize={18} />
            </View>
          )}
          <Body
            style={full ? styles.fill : undefined}
            {...(scroll ? { keyboardShouldPersistTaps: "handled" as const, showsVerticalScrollIndicator: false, contentContainerStyle: [styles.content, contentStyle] } : {})}
          >
            {scroll ? children : <View style={[styles.content, styles.fill, contentStyle]}>{children}</View>}
          </Body>
          {footer && <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>{footer}</View>}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  backdrop: { backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.frame,
    borderTopRightRadius: radius.frame,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.18)", marginTop: 8, marginBottom: 4 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: GUTTER + 4, paddingTop: 8, paddingBottom: 8 },
  headerText: { flex: 1, gap: 2 },
  content: { paddingHorizontal: GUTTER + 4, paddingTop: 8, paddingBottom: 12, gap: 16 },
  footer: { paddingHorizontal: GUTTER + 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.lineSoft, gap: 10 },
});
