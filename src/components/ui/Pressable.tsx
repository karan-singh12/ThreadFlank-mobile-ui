import { forwardRef, type ComponentRef } from "react";
import { Pressable as RNPressable, type PressableProps } from "react-native";

const PRESSED = { opacity: 0.72 } as const;

/**
 * React Native's Pressable with a press state everywhere: anything tappable dims a little while
 * pressed, so every tap gets visible feedback. A style function (which already handles `pressed`)
 * is passed through unchanged, so nothing dims twice.
 */
export const Pressable = forwardRef<ComponentRef<typeof RNPressable>, PressableProps>(function Pressable({ style, ...props }, ref) {
  if (typeof style === "function") return <RNPressable ref={ref} style={style} {...props} />;
  return <RNPressable ref={ref} {...props} style={({ pressed }) => [style, pressed && !props.disabled && PRESSED]} />;
});
