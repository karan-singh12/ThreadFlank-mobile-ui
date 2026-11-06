import { AppText, type AppTextProps } from "@/components/ui/AppText";
import { colors } from "@/theme";

/** "ThreadFlank" as in the logo artwork: "Thread" in the text colour, "Flank" in violet. */
export function Wordmark({ variant = "title", ...props }: Omit<AppTextProps, "children">) {
  return (
    <AppText variant={variant} {...props}>
      Thread<AppText variant={variant} color={colors.accentBright} style={props.style}>Flank</AppText>
    </AppText>
  );
}
