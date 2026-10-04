/**
 * Format a ms epoch timestamp as a compact relative or absolute string.
 * Returns "" when missing/invalid.
 */
export function formatRelativeTime(ts?: number | null, now = Date.now()): string {
  if (ts == null || !Number.isFinite(ts) || ts <= 0) {
    return "";
  }

  const diffMs = now - ts;
  if (diffMs < 0) {
    return formatAbsoluteShort(ts);
  }

  const sec = Math.floor(diffMs / 1000);
  if (sec < 45) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;

  const dayStart = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const todayStart = dayStart(new Date(now));
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  if (ts >= yesterdayStart && ts < todayStart) {
    return "Yesterday";
  }

  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d ago`;

  return formatAbsoluteShort(ts);
}

function formatAbsoluteShort(ts: number): string {
  const d = new Date(ts);
  const month = d.toLocaleString(undefined, { month: "short" });
  const day = d.getDate();
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${month} ${day}, ${hours}:${minutes}`;
}

/** Compact "Opened · Last used" line for tab rows. */
export function formatTabTimeMeta(
  created?: number | null,
  lastAccessed?: number | null,
  now = Date.now()
): string {
  const opened = formatRelativeTime(created, now);
  const lastUsed = formatRelativeTime(lastAccessed, now);
  if (opened && lastUsed) {
    if (opened === lastUsed) {
      return `Opened ${opened}`;
    }
    return `Opened ${opened} · Last used ${lastUsed}`;
  }
  if (opened) return `Opened ${opened}`;
  if (lastUsed) return `Last used ${lastUsed}`;
  return "";
}
