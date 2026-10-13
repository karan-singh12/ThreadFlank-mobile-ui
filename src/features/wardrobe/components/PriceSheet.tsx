import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AppText } from "@/components/ui/AppText";
import { Notice } from "@/components/ui/Notice";
import { Sheet } from "@/components/ui/Sheet";
import { TextField } from "@/components/ui/TextField";
import { useAuth } from "@/features/auth/AuthProvider";
import { workspaceApi, type WardrobeItem } from "@/features/workspace/api";
import { errorMessage } from "@/lib/api/client";
import { colors } from "@/theme";

/** "Price paid" for an item — powers its cost per wear. */
export function PriceSheet({ item, onClose, onSaved }: { item: WardrobeItem | null; onClose: () => void; onSaved: (next: WardrobeItem) => void }) {
  const { token } = useAuth();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!item) return;
    setValue(item.costPaid != null ? String(item.costPaid) : "");
    setError("");
    setSaving(false);
  }, [item]);

  const save = async () => {
    if (!token || !item) return;
    setSaving(true);
    setError("");
    try {
      onSaved(await workspaceApi.updateWardrobeItem(token, item.id, { costPaid: value.trim() ? Math.round(Number(value)) : null }));
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
    }
  };

  return (
    <Sheet open={Boolean(item)} onClose={onClose} title="Price paid" maxHeight={0.6} footer={<Button fullWidth loading={saving} onPress={save}>Save</Button>}>
      <AppText variant="sm" color={colors.muted}>
        What did you pay for {item?.name}? It&apos;s used to work out cost per wear.
      </AppText>
      <TextField size="md" capsLabel label="Price (₹)" keyboardType="number-pad" autoFocus value={value} onChangeText={(v) => setValue(v.replace(/[^\d]/g, ""))} onSubmitEditing={save} />
      {error ? <Notice tone="error">{error}</Notice> : null}
    </Sheet>
  );
}
