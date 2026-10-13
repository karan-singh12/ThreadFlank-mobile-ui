import { router } from "expo-router";
import { CalendarHeart, CheckCircle2, MapPin, Plus, Radio, Users } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Notice } from "@/components/ui/Notice";
import { Loader } from "@/components/ui/States";
import type { EventSummary } from "@/features/social/api";
import { useCircle } from "@/features/workspace/hooks";
import { errorMessage } from "@/lib/api/client";
import { colors } from "@/theme";
import { formatEventDate, useEvents } from "../hooks";

/** Real events for your Twin Circle: everyone's planned look in one place. A tab of the Saved screen. */
export function EventsPanel({ onCreate }: { onCreate: () => void }) {
  const circle = useCircle();
  const query = useEvents();
  const events = query.data;
  const upcoming = (events ?? []).filter((e) => !e.isPast);
  const past = (events ?? []).filter((e) => e.isPast);

  return (
    <View style={styles.wrap}>
      <AppText variant="sm" color={colors.muted}>
        Plan what everyone in your circle wears for a wedding, sangeet or party — and get ready together.
      </AppText>

      {circle.members.length === 0 && !circle.loading && (
        <Notice>
          <View style={styles.noticeBody}>
            <AppText variant="sm" color={colors.subtle}>
              Events are shared with your Twin Circle.
            </AppText>
            <Pressable onPress={() => router.push({ pathname: "/profile", params: { tab: "circle" } })}>
              <AppText variant="sm" color={colors.accentBright}>
                Add people to your circle to plan together.
              </AppText>
            </Pressable>
          </View>
        </Notice>
      )}
      {query.isError ? <Notice tone="error">{errorMessage(query.error)}</Notice> : null}

      {query.isLoading ? (
        <Loader />
      ) : events && events.length === 0 ? (
        <GlassCard padding={28}>
          <View style={styles.empty}>
            <CalendarHeart size={40} color={colors.muted} strokeWidth={1.5} />
            <AppText variant="title" align="center">
              No events yet
            </AppText>
            <AppText variant="sm" color={colors.muted} align="center">
              Create one — e.g. “Sharma cousin&apos;s sangeet, Dec 12” — and everyone in your circle picks their look.
            </AppText>
            <Button icon={Plus} onPress={onCreate} style={styles.center}>
              New event
            </Button>
          </View>
        </GlassCard>
      ) : (
        <>
          <EventList title="Upcoming" events={upcoming} />
          {past.length > 0 && <EventList title="Past" events={past} muted />}
        </>
      )}
    </View>
  );
}

function EventList({ title, events, muted = false }: { title: string; events: EventSummary[]; muted?: boolean }) {
  if (!events.length) return null;
  return (
    <View style={styles.section}>
      <AppText variant="label" color={colors.muted}>
        {title}
      </AppText>
      {events.map((e) => (
        <Pressable key={e.id} onPress={() => router.push({ pathname: "/events/[id]", params: { id: e.id } })} style={muted ? styles.muted : undefined}>
          <GlassCard>
            <View style={styles.cardHead}>
              <View style={styles.flex}>
                <AppText variant="body" weight="medium" numberOfLines={1}>
                  {e.title}
                </AppText>
                <AppText variant="xs" color={colors.muted}>
                  {formatEventDate(e.eventDate)}
                </AppText>
              </View>
              {e.grwmLiveAt && (
                <View style={styles.live}>
                  <Radio size={12} color="#fff" />
                  <AppText variant="micro" weight="semibold" color="#fff" style={styles.caps}>
                    GRWM live
                  </AppText>
                </View>
              )}
            </View>
            <View style={styles.meta}>
              {e.location ? (
                <View style={styles.metaItem}>
                  <MapPin size={12} color={colors.subtle} />
                  <AppText variant="xs" color={colors.subtle}>
                    {e.location}
                  </AppText>
                </View>
              ) : null}
              {e.dressCode ? (
                <AppText variant="xs" color={colors.subtle}>
                  {e.dressCode}
                </AppText>
              ) : null}
              <View style={styles.metaItem}>
                <Users size={12} color={colors.subtle} />
                <AppText variant="xs" color={colors.subtle}>
                  {e.participants}
                </AppText>
              </View>
            </View>
            <View style={styles.progressRow}>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${e.participants ? (e.locked / e.participants) * 100 : 0}%` }]} />
              </View>
              <AppText variant="micro" color={colors.muted}>
                {e.locked}/{e.participants} locked in
              </AppText>
            </View>
            {e.myPlanDone && (
              <View style={styles.metaItem}>
                <CheckCircle2 size={14} color={colors.green} />
                <AppText variant="xs" color={colors.green}>
                  Your look is locked in
                </AppText>
              </View>
            )}
          </GlassCard>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  flex: { flex: 1 },
  center: { alignSelf: "center" },
  noticeBody: { gap: 4 },
  empty: { alignItems: "center", gap: 10 },
  section: { gap: 12 },
  muted: { opacity: 0.7 },
  cardHead: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  live: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, backgroundColor: "#dc2626", paddingHorizontal: 8, paddingVertical: 2 },
  caps: { textTransform: "uppercase", fontSize: 10 },
  meta: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, marginBottom: 4 },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3, backgroundColor: colors.accentBright },
});
