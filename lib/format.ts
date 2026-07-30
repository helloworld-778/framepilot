/**
 * Timestamp formatting for saved projects.
 *
 * Only ever called from client components — the server snapshot of storage is
 * always empty — so locale-dependent output cannot cause a hydration mismatch.
 */
export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Short relative phrasing for "updated" lines, with an absolute fallback. */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  if (seconds < 45) {
    return "just now";
  }
  if (seconds < 90) {
    return "a minute ago";
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minutes ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return hours === 1 ? "an hour ago" : `${hours} hours ago`;
  }
  const days = Math.round(hours / 24);
  if (days < 7) {
    return days === 1 ? "yesterday" : `${days} days ago`;
  }
  return formatTimestamp(iso);
}
