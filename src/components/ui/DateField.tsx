import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Calendar, X } from "lucide-react-native";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { colors, radius } from "@/theme";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { Sheet } from "./Sheet";

const toYmd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromYmd = (s: string) => (s ? new Date(`${s}T12:00:00`) : null);

/**
 * A date input (the web's `<input type="date">`): the system dialog on Android, an inline
 * calendar in a sheet on iOS. `value` is "YYYY-MM-DD" or "".
 */
export function DateField({ label, value, onChange, minimumDate }: { label: string; value: string; onChange: (value: string) => void; minimumDate?: Date }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(fromYmd(value) ?? new Date());
  const current = fromYmd(value);

  const show = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({ value: current ?? new Date(), mode: "date", minimumDate, onValueChange: (_e, d) => onChange(toYmd(d)) });
      return;
    }
    setDraft(current ?? new Date());
    setOpen(true);
  };

  return (
    <View style={styles.wrap}>
      <AppText variant="label" color={colors.muted}>
        {label}
      </AppText>
      <Pressable onPress={show} style={({ pressed }) => [styles.box, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={`${label}: ${current ? current.toDateString() : "not set"}`}>
        <Calendar size={16} color={colors.muted} />
        <AppText variant="sm" color={current ? colors.ink : "rgba(141,144,165,0.7)"} style={styles.value} numberOfLines={1}>
          {current ? current.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Pick a date"}
        </AppText>
        {current ? (
          <Pressable onPress={() => onChange("")} hitSlop={8} accessibilityLabel={`Clear ${label}`}>
            <X size={16} color={colors.muted} />
          </Pressable>
        ) : null}
      </Pressable>

      {Platform.OS === "ios" && (
        <Sheet
          open={open}
          onClose={() => setOpen(false)}
          title={label}
          maxHeight={0.7}
          footer={
            <Button
              fullWidth
              onPress={() => {
                onChange(toYmd(draft));
                setOpen(false);
              }}
            >
              Done
            </Button>
          }
        >
          <DateTimePicker value={draft} mode="date" display="inline" themeVariant="dark" accentColor={colors.accentBright} minimumDate={minimumDate} onValueChange={(_e, d) => setDraft(d)} />
        </Sheet>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  box: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.glass,
  },
  pressed: { opacity: 0.75 },
  value: { flex: 1 },
});
