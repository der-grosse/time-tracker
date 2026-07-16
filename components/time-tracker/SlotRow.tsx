"use client";

import { CalendarDays, Play, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimePicker } from "@/components/ui/time-picker";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  addDays,
  daysBetween,
  formatDuration,
  minutesOfDay,
  slotDuration,
  startOfDay,
  withMinutesOfDay,
} from "@/lib/time";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { usePathname, useRouter } from "next/navigation";

export interface SlotRowProps {
  slot: Doc<"timeSlots">;
  now: number;
  onUpdate: (patch: { name?: string; start?: number; end?: number }) => void;
  onRemove: () => void;
}

export function SlotRow({ slot, now, onUpdate, onRemove }: SlotRowProps) {
  const start = useMutation(api.timeSlots.start);
  const stop = useMutation(api.timeSlots.stop);
  const router = useRouter();
  const pathname = usePathname();

  const [name, setName] = useState(slot.name ?? "");
  const [dateOpen, setDateOpen] = useState(false);
  const running = slot.end === undefined;

  // Keep the local name in sync when the underlying slot changes (e.g. from
  // another device or an optimistic re-render).
  useEffect(() => {
    setName(slot.name ?? "");
  }, [slot._id, slot.name]);

  const commitName = () => {
    if ((slot.name ?? "") !== name) onUpdate({ name });
  };

  // Move the slot to another day, keeping its time-of-day and duration.
  const handleDateChange = (dayStart: number) => {
    const delta = daysBetween(slot.start, dayStart);
    if (delta === 0) return;
    onUpdate({
      start: addDays(slot.start, delta),
      ...(slot.end !== undefined ? { end: addDays(slot.end, delta) } : {}),
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-x-2 p-1 bg-card rounded-md">
      <div className="flex items-center gap-x-2 grow">
        <Button
          size="icon-sm"
          variant="ghost"
          className="-mr-2"
          onClick={async () => {
            await stop();
            await start({ name: slot.name ?? "" });
            if (pathname !== "/") {
              router.push("/");
            }
          }}
        >
          <Play className="size-4 text-muted-foreground" />
        </Button>
        <Input
          value={name}
          placeholder="Unnamed"
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="h-9 min-w-0 flex-1 basis-full sm:basis-40 bg-transparent! text-sm -mr-3"
        />
      </div>

      <div className="flex items-center gap-x-2">
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Change date"
                className="size-6 text-muted-foreground mx-1"
              />
            }
          >
            <CalendarDays className="size-4" />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              required
              weekStartsOn={1}
              selected={new Date(slot.start)}
              onSelect={(d) => {
                handleDateChange(startOfDay(d.getTime()));
                setDateOpen(false);
              }}
              disabled={{ after: new Date() }}
            />
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-1 pr-2">
          <TimePicker
            value={minutesOfDay(slot.start)}
            onChange={(minutes) => onUpdate({ start: withMinutesOfDay(slot.start, minutes) })}
            variant="ghost"
            className="px-0 h-6 text-muted-foreground"
          />
          <span className="text-muted-foreground">-</span>
          {running ? (
            <span className="px-0.5 text-sm font-medium text-primary w-13 text-center">now</span>
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
    </div>
  );
}
