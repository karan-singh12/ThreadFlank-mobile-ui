import { router, useLocalSearchParams } from "expo-router";
import { AlertTriangle, MapPin, Pencil, Radio, Trash2, Wallet } from "lucide-react-native";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Screen } from "@/components/layout/Screen";
import { StackHeader } from "@/components/layout/StackHeader";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { IconButton } from "@/components/ui/IconButton";
import { Notice } from "@/components/ui/Notice";
import { Sheet } from "@/components/ui/Sheet";
import { ErrorState, Loader } from "@/components/ui/States";
import { useAuth } from "@/features/auth/AuthProvider";
import { EventForm } from "@/features/events/components/EventForm";
import { LookPickerSheet, SuggestionsSheet } from "@/features/events/components/EventSheets";
import { GrwmChat } from "@/features/events/components/GrwmChat";
import { PlanCard } from "@/features/events/components/PlanCard";
import { formatEventDate, useEventDetail } from "@/features/events/hooks";
import { socialApi, type PlanRow } from "@/features/social/api";
import { errorMessage } from "@/lib/api/client";
import { colors } from "@/theme";

/** One event: every member's planned look, clash warnings, and the Get Ready With Me session. */
export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const query = useEventDetail(id);
  const event = query.data;
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [picking, setPicking] = useState<PlanRow | null>(null);
  const [suggestFor, setSuggestFor] = useState<PlanRow | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const setPlan = async (plan: PlanRow, body: Parameters<typeof socialApi.setPlan>[3]) => {
    if (!token) return;
    setBusy(plan.id);
    setError("");
    try {
      query.setEvent(await socialApi.setPlan(token, id, plan.id, body));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const toggleGrwm = async () => {
    if (!token || !event) return;
    setBusy("grwm");
    try {
      await socialApi.setGrwm(token, id, !event.grwmLiveAt);
      await query.refetch();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const remove = () =>
    Alert.alert("Delete this event?", "It will be deleted for everyone in the circle.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await socialApi.deleteEvent(token!, id);
            router.replace({ pathname: "/saved", params: { tab: "events" } });
          } catch (e) {
            setError(errorMessage(e));
          }
        },
      },
    ]);

  const header = (
    <StackHeader
      title="Event"
      right={
        event?.canManage ? (
          <View style={styles.headerActions}>
            <IconButton icon={Pencil} label="Edit event" onPress={() => setEditing(true)} size={36} iconSize={16} />
            <IconButton icon={Trash2} label="Delete event" onPress={remove} size={36} iconSize={16} color={colors.red} />
          </View>
        ) : undefined
      }
    />
  );

  if (!event) {
    return (
      <Screen header={header}>
        {query.isError ? <ErrorState message={errorMessage(query.error)} onRetry={() => query.refetch()} /> : <Loader />}
      </Screen>
    );
  }

  const warnedPlans = new Set(event.warnings.flatMap((w) => w.planIds));
  const rows: PlanRow[][] = [];
  for (let i = 0; i < event.plans.length; i += 2) rows.push(event.plans.slice(i, i + 2));

  return (
    <Screen header={header} onRefresh={() => query.refetch()} refreshing={query.isRefetching}>
      <View style={styles.titleBlock}>
        <GradientText variant="h2">{event.title}</GradientText>
        <View style={styles.meta}>
          <AppText variant="sm" color={colors.subtle}>
            {formatEventDate(event.eventDate)}
          </AppText>
          {event.location ? (
            <View style={styles.metaItem}>
              <MapPin size={14} color={colors.subtle} />
              <AppText variant="sm" color={colors.subtle}>
                {event.location}
              </AppText>
            </View>
          ) : null}
          {event.dressCode ? (
            <AppText variant="sm" color={colors.subtle}>
              {event.dressCode}
            </AppText>
          ) : null}
          {event.budget ? (
            <View style={styles.metaItem}>
              <Wallet size={14} color={colors.subtle} />
              <AppText variant="sm" color={colors.subtle}>
                ₹{event.budget.toLocaleString("en-IN")} each
              </AppText>
            </View>
          ) : null}
        </View>
        {event.notes ? (
          <AppText variant="sm" color={colors.muted}>
            {event.notes}
          </AppText>
        ) : null}
      </View>

      {error ? <Notice tone="error">{error}</Notice> : null}
      {event.warnings.map((w) => (
        <View key={w.message} style={styles.warning}>
          <AlertTriangle size={16} color="#fef3c7" />
          <AppText variant="sm" color="#fef3c7" style={styles.flex}>
            {w.message}
          </AppText>
        </View>
      ))}

      <View style={styles.plans}>
        {rows.map((row, i) => (
          <View key={i} style={styles.planRow}>
            {row.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                warned={warnedPlans.has(plan.id)}
                busy={busy === plan.id}
                onPick={() => setPicking(plan)}
                onSuggest={() => setSuggestFor(plan)}
                onColour={(color) => setPlan(plan, { color })}
                onLock={() => setPlan(plan, { status: plan.status === "LOCKED" ? "PLANNING" : "LOCKED" })}
              />
            ))}
            {row.length === 1 && <View style={styles.flex} />}
          </View>
        ))}
      </View>

      <GlassCard>
        <View style={styles.grwmTitle}>
          <Radio size={16} color={event.grwmLiveAt ? "#f87171" : colors.accentBright} />
          <AppText variant="body" weight="medium">
            Get Ready With Me
          </AppText>
        </View>
        <AppText variant="sm" color={colors.muted} style={styles.grwmBody}>
          {event.grwmLiveAt ? "Live now — picks update for everyone as you change them." : "Start a live session so the circle picks outfits together and chats here."}
        </AppText>
        <Button fullWidth variant={event.grwmLiveAt ? "danger" : "primary"} loading={busy === "grwm"} onPress={toggleGrwm}>
          {event.grwmLiveAt ? "End session" : "Start GRWM session"}
        </Button>
      </GlassCard>
      {event.groupId ? <GrwmChat groupId={event.groupId} /> : null}

      <Sheet open={editing} onClose={() => setEditing(false)} title="Edit event">
        {editing && (
          <EventForm
            initial={{ ...event, eventType: event.eventType ?? undefined, dressCode: event.dressCode ?? undefined, location: event.location ?? undefined, notes: event.notes ?? undefined }}
            submitLabel="Save changes"
            onSubmit={async (input) => {
              if (!token) return;
              query.setEvent(await socialApi.updateEvent(token, id, { ...input, circleId: undefined }));
              setEditing(false);
            }}
          />
        )}
      </Sheet>

      <LookPickerSheet
        open={Boolean(picking)}
        title={picking ? `Look for ${picking.person.isMe ? "you" : picking.person.name}` : ""}
        current={picking?.lookId ?? null}
        onClose={() => setPicking(null)}
        onPick={async (lookId) => {
          if (!picking) return;
          await setPlan(picking, { lookId });
          setPicking(null);
        }}
      />
      <SuggestionsSheet open={Boolean(suggestFor)} eventId={id} planId={suggestFor?.id ?? null} onClose={() => setSuggestFor(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerActions: { flexDirection: "row", gap: 6 },
  titleBlock: { gap: 8 },
  meta: { flexDirection: "row", flexWrap: "wrap", columnGap: 16, rowGap: 4 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  warning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.3)",
    backgroundColor: "rgba(252,211,77,0.07)",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  plans: { gap: 12 },
  planRow: { flexDirection: "row", gap: 12 },
  grwmTitle: { flexDirection: "row", alignItems: "center", gap: 8 },
  grwmBody: { marginTop: 6, marginBottom: 12 },
});
