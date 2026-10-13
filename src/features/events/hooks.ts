import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { socialApi, type EventDetail } from "@/features/social/api";
import { queryKeys } from "@/lib/queryKeys";
import { useSocketEvent } from "@/lib/socket";

export const formatEventDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "Date to be decided";

/** Your circle's events, upcoming and past. */
export function useEvents() {
  const { token } = useAuth();
  return useQuery({ queryKey: queryKeys.events(token), queryFn: () => socialApi.events(token!), enabled: Boolean(token) });
}

/** One event, kept live while people pick outfits or start a GRWM session. */
export function useEventDetail(id: string) {
  const { token } = useAuth();
  const client = useQueryClient();
  const key = queryKeys.event(token, id);
  const query = useQuery({ queryKey: key, queryFn: () => socialApi.event(token!, id), enabled: Boolean(token && id) });

  const refresh = () => void client.invalidateQueries({ queryKey: key });
  useSocketEvent<{ eventId: string }>("event:planUpdated", (p) => p.eventId === id && refresh());
  useSocketEvent<{ eventId: string }>("event:grwm", (p) => p.eventId === id && refresh());

  return {
    ...query,
    /** Replace the cached event with a server response (plans and warnings come back with every change). */
    setEvent: (next: EventDetail) => {
      client.setQueryData(key, next);
      void client.invalidateQueries({ queryKey: queryKeys.events(token) });
    },
  };
}

export const EVENT_COLOURS = [
  { name: "Red", hex: "#c62828" },
  { name: "Maroon", hex: "#6d1b2b" },
  { name: "Pink", hex: "#e785a8" },
  { name: "Peach", hex: "#f2b28f" },
  { name: "Orange", hex: "#e8722c" },
  { name: "Mustard", hex: "#d4a017" },
  { name: "Gold", hex: "#c9a14a" },
  { name: "Green", hex: "#2e7d32" },
  { name: "Emerald", hex: "#0f7b5f" },
  { name: "Teal", hex: "#1f7a80" },
  { name: "Blue", hex: "#2a6fd6" },
  { name: "Navy", hex: "#1c2957" },
  { name: "Purple", hex: "#6a3aa7" },
  { name: "Lavender", hex: "#b7a4e0" },
  { name: "White", hex: "#f7f5f0" },
  { name: "Ivory", hex: "#ece3cf" },
  { name: "Beige", hex: "#cdb899" },
  { name: "Grey", hex: "#8a8a8f" },
  { name: "Black", hex: "#141414" },
  { name: "Silver", hex: "#c0c4cc" },
];

export const colourHex = (name: string | null) => EVENT_COLOURS.find((c) => c.name === name)?.hex;
