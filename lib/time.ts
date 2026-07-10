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
