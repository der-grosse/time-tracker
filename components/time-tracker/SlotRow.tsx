"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TimePicker } from "@/components/ui/time-picker";
import type { Doc } from "@/convex/_generated/dataModel";
import { formatDuration, minutesOfDay, slotDuration, withMinutesOfDay } from "@/lib/time";

export interface SlotRowProps {
  slot: Doc<"timeSlots">;
  now: number;
  onUpdate: (patch: { name?: string; start?: number; end?: number }) => void;
  onRemove: () => void;
}

export function SlotRow({ slot, now, onUpdate, onRemove }: SlotRowProps) {
  const [name, setName] = useState(slot.name ?? "");
  const running = slot.end === undefined;

  // Keep the local name in sync when the underlying slot changes (e.g. from
  // another device or an optimistic re-render).
  useEffect(() => {
    setName(slot.name ?? "");
  }, [slot._id, slot.name]);

  const commitName = () => {
    if ((slot.name ?? "") !== name) onUpdate({ name });
  };

  return (
    <div className="flex flex-wrap items-center gap-x-2 p-1 bg-card rounded-md">
      <Input
        value={name}
        placeholder="Unnamed"
        onChange={(e) => setName(e.target.value)}
        onBlur={commitName}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="h-9 min-w-0 flex-1 basis-full sm:basis-40 bg-transparent! text-sm"
      />

      <div className="flex items-center gap-1 px-2">
        <TimePicker
          value={minutesOfDay(slot.start)}
          onChange={(minutes) => onUpdate({ start: withMinutesOfDay(slot.start, minutes) })}
          variant="ghost"
          className="px-0 h-6 text-muted-foreground"
        />
        <span className="text-muted-foreground">-</span>
        {running ? (
          <span className="px-0.5 text-sm font-medium text-primary">now</span>
        ) : (
          <TimePicker
            value={minutesOfDay(slot.end!)}
            onChange={(minutes) => onUpdate({ end: withMinutesOfDay(slot.end!, minutes) })}
            variant="ghost"
            className="px-0 h-6 text-muted-foreground"
          />
        )}
      </div>

      <span className="ml-auto w-16 text-right text-sm font-medium tabular-nums">
        {formatDuration(slotDuration(slot, now))}
      </span>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onRemove}
        aria-label="Delete time slot"
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
