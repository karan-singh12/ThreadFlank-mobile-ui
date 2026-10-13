import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { DateField } from "@/components/ui/DateField";
import { Notice } from "@/components/ui/Notice";
import { Select } from "@/components/ui/Select";
import { TextField } from "@/components/ui/TextField";
import type { EventInput } from "@/features/social/api";
import { errorMessage } from "@/lib/api/client";

const EVENT_TYPES = ["Wedding", "Sangeet", "Mehendi", "Haldi", "Reception", "Engagement", "Festival / puja", "Party", "Birthday", "Work event", "Trip", "Other"];
const DRESS_CODES = ["", "Traditional / ethnic", "Indo-western", "Cocktail", "Formal", "Smart casual", "Casual", "Colour theme"];
const TYPE_OPTIONS = EVENT_TYPES.map((t) => ({ value: t, label: t }));
const DRESS_OPTIONS = DRESS_CODES.map((d) => ({ value: d, label: d || "None" }));

/** Create or edit a circle event (same fields and rules as the web form). */
export function EventForm({
  initial,
  circles,
  submitLabel,
  onSubmit,
}: {
  initial?: EventInput;
  circles?: { value: string; label: string }[];
  submitLabel: string;
  onSubmit: (input: EventInput) => Promise<void>;
}) {
  const [circleId, setCircleId] = useState(initial?.circleId ?? circles?.[0]?.value ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [eventType, setEventType] = useState(initial?.eventType ?? EVENT_TYPES[0]);
  const [dressCode, setDressCode] = useState(initial?.dressCode ?? "");
  const [eventDate, setEventDate] = useState(initial?.eventDate ? initial.eventDate.slice(0, 10) : "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [budget, setBudget] = useState(initial?.budget ? String(initial.budget) : "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        circleId: circleId || undefined,
        title: title.trim(),
        eventType,
        dressCode: dressCode || undefined,
        eventDate: eventDate ? new Date(`${eventDate}T12:00:00`).toISOString() : null,
        location: location.trim() || undefined,
        budget: budget ? Math.round(Number(budget)) : null,
        notes: notes.trim() || undefined,
      });
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
    }
  };

  return (
    <View style={styles.form}>
      {circles && circles.length > 1 && <Select label="Circle" value={circleId} onChange={setCircleId} options={circles} />}
      <TextField size="md" capsLabel label="Event name" maxLength={120} value={title} onChangeText={setTitle} placeholder="Sharma cousin's sangeet" />
      <View style={styles.twoCol}>
        <Select label="Type" value={eventType} onChange={setEventType} options={TYPE_OPTIONS} style={styles.flex} />
        <Select label="Dress code" value={dressCode} onChange={setDressCode} options={DRESS_OPTIONS} style={styles.flex} />
      </View>
      <View style={styles.twoCol}>
        <View style={styles.flex}>
          <DateField label="Date" value={eventDate} onChange={setEventDate} />
        </View>
        <TextField size="md" capsLabel label="Budget each (₹)" keyboardType="number-pad" value={budget} onChangeText={(v) => setBudget(v.replace(/[^\d]/g, ""))} containerStyle={styles.flex} />
      </View>
      <TextField size="md" capsLabel label="Location" maxLength={120} value={location} onChangeText={setLocation} />
      <TextField size="md" capsLabel multiline label="Notes" maxLength={1000} value={notes} onChangeText={setNotes} placeholder="Colour theme, venue details, who's coordinating…" />
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Button fullWidth size="lg" loading={saving} disabled={!title.trim()} onPress={submit}>
        {submitLabel}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
  twoCol: { flexDirection: "row", gap: 12 },
  flex: { flex: 1 },
});
