/** Short relative time: "just now", "5m", "3h", "2d", then a date. */
export function ago(iso: string | null | undefined) {
  if (!iso) return "";
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  if (s < 7 * 86400) return `${Math.round(s / 86400)}d`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** "2h ago" style for feeds. */
export function timeAgo(iso: string | null | undefined) {
  const short = ago(iso);
  return !short || short === "just now" || !/\d[mhd]$/.test(short) ? short : `${short} ago`;
}

/** Indian rupees without decimals, e.g. ₹1,299. */
export function rupees(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "";
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function clockTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

/** Day label for chat separators: Today, Yesterday, or a date. */
export function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export function longDate(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}
