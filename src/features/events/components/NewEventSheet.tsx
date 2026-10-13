import { router } from "expo-router";
import { Sheet } from "@/components/ui/Sheet";
import { useAuth } from "@/features/auth/AuthProvider";
import { socialApi } from "@/features/social/api";
import { useCircle } from "@/features/workspace/hooks";
import { EventForm } from "./EventForm";

/** Create-event sheet; opens the new event's screen once it's saved. */
export function NewEventSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { token } = useAuth();
  const circle = useCircle();
  const circles = [
    { value: circle.state?.circle.id ?? "", label: "My circle" },
    ...circle.memberships
      .filter((m) => m.status === "ACTIVE")
      .map((m) => ({ value: m.circleId, label: `${m.owner?.username || m.owner?.email.split("@")[0] || "Friend"}'s circle` })),
  ].filter((c) => c.value);

  return (
    <Sheet open={open} onClose={onClose} title="New event">
      {open && (
        <EventForm
          circles={circles}
          submitLabel="Create event"
          onSubmit={async (input) => {
            if (!token) return;
            const created = await socialApi.createEvent(token, input);
            onClose();
            router.push({ pathname: "/events/[id]", params: { id: created.id } });
          }}
        />
      )}
    </Sheet>
  );
}
