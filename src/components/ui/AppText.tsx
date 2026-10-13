import { Text, type TextProps, type TextStyle } from "react-native";
import { colors, fonts, type, type TypeVariant } from "@/theme";

type Weight = "regular" | "medium" | "semibold" | "bold";

export type AppTextProps = TextProps & {
  variant?: TypeVariant;
  color?: string;
  weight?: Weight;
  align?: TextStyle["textAlign"];
};

/** Text in the app's font and type scale. Defaults to body copy in white. */
export function AppText({ variant = "body", color = colors.ink, weight, align, style, ...props }: AppTextProps) {
  return (
    <Text
      {...props}
      style={[type[variant], { color }, weight && { fontFamily: fonts[weight] }, align && { textAlign: align }, style]}
    />
  );
}
