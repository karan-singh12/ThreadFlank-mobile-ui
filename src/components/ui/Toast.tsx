import { CircleAlert, CircleCheck } from "lucide-react-native";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius } from "@/theme";
import { AppText } from "./AppText";

type ToastTone = "success" | "error" | "info";
type ToastState = { id: number; message: string; tone: ToastTone; action?: { label: string; onPress: () => void } };

type ToastApi = { show: (message: string, opts?: { tone?: ToastTone; action?: ToastState["action"] }) => void };

const ToastContext = createContext<ToastApi | null>(null);

/** Small floating status pill (e.g. "Saved to your looks"), shown at the top for a few seconds. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setToast(null));
  }, [anim]);

  const show = useCallback<ToastApi["show"]>(
    (message, opts = {}) => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ id: Date.now(), message, tone: opts.tone ?? "success", action: opts.action });
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 220 }).start();
      timer.current = setTimeout(hide, opts.action ? 4500 : 2600);
    },
    [anim, hide]
  );

  const api = useMemo(() => ({ show }), [show]);
  const Icon = toast?.tone === "error" ? CircleAlert : CircleCheck;

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.wrap,
            { top: insets.top + 8, opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] },
          ]}
        >
          <Pressable onPress={hide} style={styles.toast} accessibilityLiveRegion="polite">
            <Icon size={16} color={toast.tone === "error" ? colors.red : colors.green} />
            <AppText variant="sm" style={styles.text} numberOfLines={2}>
              {toast.message}
            </AppText>
            {toast.action && (
              <Pressable
                onPress={() => {
                  toast.action?.onPress();
                  hide();
                }}
                hitSlop={8}
              >
                <AppText variant="sm" weight="medium" color={colors.accentBright}>
                  {toast.action.label}
                </AppText>
              </Pressable>
            )}
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 16, right: 16, alignItems: "center", zIndex: 1000 },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    maxWidth: 460,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: "rgba(11,11,30,0.96)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  text: { flexShrink: 1 },
});
