import { Check, ChevronDown, LayoutGrid, Rows3, Search, SlidersHorizontal, X } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Sheet } from "@/components/ui/Sheet";
import { colors, fonts, radius } from "@/theme";

/** Rounded search field (web Discover search). */
export function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.search, focused && styles.searchFocused]}>
      <Search size={18} color={focused ? colors.accentBright : colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="rgba(141,144,165,0.7)"
        selectionColor={colors.accentBright}
        returnKeyType="search"
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={placeholder}
        style={styles.searchInput}
      />
      {value ? (
        <Pressable onPress={() => onChange("")} hitSlop={8} accessibilityLabel="Clear search">
          <X size={16} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Compact category picker beside the search bar. The first option means "no filter". */
export function CategoryFilter({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const filtered = value !== options[0];
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityLabel={filtered ? `Category: ${value}` : "Filter categories"}
        style={[styles.filter, filtered && styles.filterOn, open && styles.filterOpen]}
      >
        <SlidersHorizontal size={16} color={filtered ? "#fff" : colors.subtle} />
        {filtered && <View style={styles.dot} />}
        <ChevronDown size={14} color={colors.muted} />
      </Pressable>
      <Sheet open={open} onClose={() => setOpen(false)} title="Category" maxHeight={0.7}>
        <View style={styles.list}>
          {options.map((o) => {
            const on = value === o;
            return (
              <Pressable
                key={o}
                onPress={() => {
                  onChange(o);
                  setOpen(false);
                }}
                style={({ pressed }) => [styles.option, on && styles.optionOn, pressed && styles.pressed]}
              >
                <AppText variant="body" color={on ? "#fff" : colors.subtle}>
                  {o === options[0] ? "All categories" : o}
                </AppText>
                {on && <Check size={18} color={colors.accentBright} />}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </>
  );
}

/** Feed / grid switch. */
export function ViewToggle({ value, onChange }: { value: "feed" | "grid"; onChange: (v: "feed" | "grid") => void }) {
  return (
    <View style={styles.toggle}>
      {(["feed", "grid"] as const).map((mode) => {
        const on = value === mode;
        const Icon = mode === "feed" ? Rows3 : LayoutGrid;
        return (
          <Pressable key={mode} onPress={() => onChange(mode)} style={[styles.toggleBtn, on && styles.toggleOn]} accessibilityLabel={mode === "feed" ? "Feed view" : "Grid view"} accessibilityState={{ selected: on }}>
            <Icon size={16} color={on ? "#fff" : colors.muted} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    flex: 1,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.glass,
  },
  searchFocused: { borderColor: "rgba(127,98,246,0.7)" },
  searchInput: { flex: 1, color: colors.ink, fontFamily: fonts.regular, fontSize: 15, paddingVertical: 0 },
  filter: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.glass,
  },
  filterOn: { borderColor: "rgba(127,98,246,0.6)", backgroundColor: "rgba(102,69,235,0.15)" },
  filterOpen: { borderColor: "rgba(127,98,246,0.7)" },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accentBright },
  list: { gap: 4 },
  option: { height: 48, borderRadius: radius.md, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  optionOn: { backgroundColor: "rgba(102,69,235,0.2)" },
  pressed: { opacity: 0.75 },
  toggle: { flexDirection: "row", padding: 4, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.glass },
  toggleBtn: { width: 36, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  toggleOn: { backgroundColor: "rgba(255,255,255,0.15)" },
});
