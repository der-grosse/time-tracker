import type { Doc } from "@/convex/_generated/dataModel";
import { formatDuration, slotDuration } from "./time";

function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Build a CSV (oldest first) from a set of slots. Running slots are skipped. */
export function slotsToCsv(slots: Doc<"timeSlots">[]): string {
  const header = ["Date", "Name", "Start", "End", "Duration (min)", "Duration"];
  const rows = slots
    .filter((s) => s.end !== undefined)
    .sort((a, b) => a.start - b.start)
    .map((s) => {
      const ms = slotDuration(s);
      return [
        toDate(s.start),
        s.name ?? "",
        toTime(s.start),
        toTime(s.end!),
        Math.round(ms / 60000).toString(),
        formatDuration(ms),
      ];
    });

  return [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
}

/** Trigger a browser download of `csv` as `filename`. */
export function downloadCsv(filename: string, csv: string): void {
  // Prepend a BOM so Excel reads UTF-8 correctly.
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
