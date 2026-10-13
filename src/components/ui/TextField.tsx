import type { LucideIcon } from "lucide-react-native";
import { Eye, EyeOff, Lock } from "lucide-react-native";
import { forwardRef, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";
import { colors, fonts, radius } from "@/theme";
import { AppText } from "./AppText";

export type TextFieldProps = Omit<TextInputProps, "style"> & {
  label?: string;
  icon?: LucideIcon;
  error?: string;
  hint?: ReactNode;
  /** Right-aligned slot inside the input, e.g. a visibility toggle. */
  trailing?: ReactNode;
  /** Extra content on the label row, e.g. "Forgot password?". */
  labelAction?: ReactNode;
  /** "lg" is the auth form field (52px); "md" the compact in-app field (44px). */
  size?: "md" | "lg";
  /** Uppercase small label, as the web's in-app `Label`. */
  capsLabel?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  multiline?: boolean;
};

/** Labelled text input matching the web's TextField / Field (border glow on focus, red on error). */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, icon: Icon, error, hint, trailing, labelAction, size = "lg", capsLabel, containerStyle, multiline, onFocus, onBlur, ...props },
  ref
) {
  const [focused, setFocused] = useState(false);
  const height = multiline ? undefined : size === "lg" ? 52 : 44;

  return (
    <View style={[styles.wrap, containerStyle]}>
      {(label || labelAction) && (
        <View style={styles.labelRow}>
          {label ? (
            <AppText variant={capsLabel ? "label" : "sm"} weight="medium" color={capsLabel ? colors.muted : colors.subtle}>
              {label}
            </AppText>
          ) : (
            <View />
          )}
          {labelAction}
        </View>
      )}
      <View
        style={[
          styles.box,
          { height, minHeight: multiline ? 88 : undefined },
          focused && styles.focused,
          error ? styles.errored : null,
        ]}
      >
        {Icon && <Icon size={18} strokeWidth={1.75} color={error ? colors.red : focused ? colors.accentBright : colors.muted} style={styles.icon} />}
        <TextInput
          ref={ref}
          placeholderTextColor="rgba(141,144,165,0.7)"
          selectionColor={colors.accentBright}
          cursorColor={colors.accentBright}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            { paddingLeft: Icon ? 44 : 14, paddingRight: trailing ? 48 : 14 },
            multiline && styles.multiline,
          ]}
          {...props}
        />
        {trailing && <View style={styles.trailing}>{trailing}</View>}
      </View>
      {(error || hint) && (
        <AppText variant="xs" color={error ? colors.red : colors.muted} accessibilityRole={error ? "alert" : undefined}>
          {error ?? hint}
        </AppText>
      )}
    </View>
  );
});

/** Password input with a show/hide toggle. */
export const PasswordField = forwardRef<TextInput, Omit<TextFieldProps, "icon" | "trailing" | "secureTextEntry">>(function PasswordField(props, ref) {
  const [visible, setVisible] = useState(false);
  const Toggle = visible ? EyeOff : Eye;
  return (
    <TextField
      ref={ref}
      {...props}
      icon={Lock}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      trailing={
        <Pressable
          onPress={() => setVisible((v) => !v)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={visible ? "Hide password" : "Show password"}
          style={styles.toggle}
        >
          <Toggle size={18} strokeWidth={1.75} color={colors.muted} />
        </Pressable>
      }
    />
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  box: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.glass,
    justifyContent: "center",
  },
  focused: { borderColor: "rgba(127,98,246,0.7)", backgroundColor: colors.glassStrong },
  errored: { borderColor: "rgba(248,113,113,0.6)" },
  icon: { position: "absolute", left: 14 },
  input: { flex: 1, color: colors.ink, fontFamily: fonts.regular, fontSize: 16 },
  multiline: { paddingTop: 12, paddingBottom: 12, minHeight: 88 },
  trailing: { position: "absolute", right: 6 },
  toggle: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
});
