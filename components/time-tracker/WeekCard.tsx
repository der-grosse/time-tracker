"use client";

import { ChevronDown, Download } from "lucide-react";
import { useMemo, useState } from "react";
import { SlotRow } from "@/components/time-tracker/SlotRow";
import { Button } from "@/components/ui/button";
import type { Doc } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import {
  formatDayLabel,
  formatDuration,
  formatWeekRange,
  slotDuration,
  startOfDay,
} from "@/lib/time";

export interface WeekCardProps {
  weekStart: number;
  slots: Doc<"timeSlots">[];
  now: number;
  defaultOpen?: boolean;
  onUpdate: (
    id: Doc<"timeSlots">["_id"],
    patch: { name?: string; start?: number; end?: number },
  ) => void;
  onRemove: (id: Doc<"timeSlots">["_id"]) => void;
  onExport: () => void;
}

export function WeekCard({
  weekStart,
  slots,
  now,
  defaultOpen = false,
  onUpdate,
  onRemove,
  onExport,
}: WeekCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  const total = slots.reduce((sum, s) => sum + slotDuration(s, now), 0);

  // Group the week's slots by day, newest day first.
  const days = useMemo(() => {
    const map = new Map<number, Doc<"timeSlots">[]>();
    for (const slot of slots) {
      const key = startOfDay(slot.start);
      const list = map.get(key) ?? [];
      list.push(slot);
      map.set(key, list);
    }
    return [...map.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([dayStart, daySlots]) => ({
        dayStart,
        slots: daySlots.sort((a, b) => a.start - b.start),
        total: daySlots.reduce((sum, s) => sum + slotDuration(s, now), 0),
      }));
  }, [slots, now]);

  return (
    <div className="overflow-hidden rounded-xl bg-card text-card-foreground shadow-xs ring-1 ring-foreground/10">
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex flex-1 items-center gap-3 text-left cursor-pointer"
        >
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
          <span className="flex-1 font-medium">{formatWeekRange(weekStart)}</span>
          <span className="text-sm font-semibold tabular-nums text-muted-foreground">
            {formatDuration(total)}
          </span>
        </button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Download week as CSV"
          onClick={onExport}
          className="text-muted-foreground"
        >
          <Download className="size-4" />
        </Button>
      </div>

      {open && (
        <div className="flex flex-col gap-4 border-t border-border px-4 py-4">
          {days.map((day) => (
            <div key={day.dayStart}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {formatDayLabel(day.dayStart)}
                </span>
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                  {formatDuration(day.total)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {day.slots.map((slot) => (
                  <SlotRow
                    key={slot._id}
                    slot={slot}
                    now={now}
                    onUpdate={(patch) => onUpdate(slot._id, patch)}
                    onRemove={() => onRemove(slot._id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
