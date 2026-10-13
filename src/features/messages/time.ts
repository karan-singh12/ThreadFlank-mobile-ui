/** "13:45" */
export function formatTime(iso?: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

/** "Today", "Yesterday" or "Oct 3". */
export function formatDateLabel(iso?: string | null) {
  if (!iso) return "Today";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "Today";
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** The conversation list's compact age: "now", "5m", "3h", "2d", "4w". */
export function shortAgo(iso?: string | null) {
  if (!iso) return "";
  const time = new Date(iso).getTime();
  if (isNaN(time)) return "";
  const mins = Math.floor(Math.max(0, Date.now() - time) / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d` : `${Math.floor(days / 7)}w`;
}
