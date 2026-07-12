/** Time helpers for the tracker. All boundaries are computed in local time. */

/** Start of the local day containing `ts` (defaults to now), as epoch ms. */
export function startOfDay(ts: number = Date.now()): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Start of the local week (Monday 00:00) containing `ts`, as epoch ms. */
export function startOfWeek(ts: number = Date.now()): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const mondayOffset = (d.getDay() + 6) % 7; // Sunday(0) -> 6, Monday(1) -> 0
  d.setDate(d.getDate() - mondayOffset);
  return d.getTime();
}

/** End of the local week (next Monday 00:00, exclusive) containing `ts`, as epoch ms. */
export function endOfWeek(ts: number = Date.now()): number {
  const d = new Date(startOfWeek(ts));
  d.setDate(d.getDate() + 7);
  return d.getTime();
}

/** Start of the local month containing `ts`, as epoch ms. */
export function startOfMonth(ts: number = Date.now()): number {
  const d = new Date(ts);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Start of the next local month after `ts` (exclusive), as epoch ms. */
export function endOfMonth(ts: number = Date.now()): number {
  const d = new Date(startOfMonth(ts));
  d.setMonth(d.getMonth() + 1);
  return d.getTime();
}

/** Start of the local year containing `ts`, as epoch ms. */
export function startOfYear(ts: number = Date.now()): number {
  const d = new Date(ts);
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Start of the next local year after `ts` (exclusive), as epoch ms. */
export function endOfYear(ts: number = Date.now()): number {
  const d = new Date(startOfYear(ts));
  d.setFullYear(d.getFullYear() + 1);
  return d.getTime();
}

/** Format a week's Monday–Sunday range, e.g. "Jul 7 – 13, 2025". */
export function formatWeekRange(weekStart: number): string {
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);

  const sameYear = start.getFullYear() === end.getFullYear();
  const startFmt = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endFmt = end.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const startWithYear = sameYear
    ? startFmt
    : start.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return `${startWithYear} – ${endFmt}`;
}

/** Format a day header, e.g. "Mon, Jul 7". */
export function formatDayLabel(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Minutes since local midnight for `ts` (0–1439). */
export function minutesOfDay(ts: number): number {
  const d = new Date(ts);
  return d.getHours() * 60 + d.getMinutes();
}

/** Return `ts` with its time-of-day replaced by `minutes` from midnight. */
export function withMinutesOfDay(ts: number, minutes: number): number {
  const d = new Date(ts);
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d.getTime();
}

/** Return `ts` shifted by `days` whole days (DST-safe). */
export function addDays(ts: number, days: number): number {
  const d = new Date(ts);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

/** Whole days from the day of `a` to the day of `b` (b later → positive). */
export function daysBetween(a: number, b: number): number {
  return Math.round((startOfDay(b) - startOfDay(a)) / 86_400_000);
}

/** Duration of a slot in ms, measured up to `now` while still running. */
export function slotDuration(
  slot: { start: number; end?: number },
  now: number = Date.now(),
): number {
  return Math.max(0, (slot.end ?? now) - slot.start);
}

/** Format a duration as "1h 23m" (or "12m" / "0m"). */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/** Format a duration as a live "HH:MM:SS" stopwatch. */
export function formatStopwatch(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
