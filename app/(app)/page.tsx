"use client";

import { useMutation, useQuery } from "convex/react";
import { LogOut, Pause, Play } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/components/context/UserContext";
import { SlotRow } from "@/components/time-tracker/SlotRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TimePicker } from "@/components/ui/time-picker";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { logout } from "@/server/auth";
import {
  formatDuration,
  formatStopwatch,
  minutesOfDay,
  startOfDay,
  startOfWeek,
  withMinutesOfDay,
} from "@/lib/time";

/** Duration of a slot within [from, now], clamped so it never counts outside it. */
function clampedDuration(slot: Doc<"timeSlots">, from: number, now: number): number {
  const start = Math.max(slot.start, from);
  const end = slot.end ?? now;
  return Math.max(0, end - start);
}

export default function Home() {
  const { user } = useUser();
  const [now, setNow] = useState(() => Date.now());

  // Tick every second so the running timer and totals stay live.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const weekStart = startOfWeek(now);
  const dayStart = startOfDay(now);

  const slots = useQuery(api.timeSlots.list, { since: weekStart });
  const start = useMutation(api.timeSlots.start);
  const stop = useMutation(api.timeSlots.stop);
  const update = useMutation(api.timeSlots.update);
  const remove = useMutation(api.timeSlots.remove);

  const running = useMemo(() => slots?.find((s) => s.end === undefined) ?? null, [slots]);

  // Slots that started today and have already ended (running one lives in the hero).
  const todaysCompleted = useMemo(
    () => (slots ?? []).filter((s) => s.end !== undefined && s.start >= dayStart),
    [slots, dayStart],
  );

  const weekTotal = (slots ?? []).reduce((sum, s) => sum + clampedDuration(s, weekStart, now), 0);
  const todayTotal = (slots ?? []).reduce((sum, s) => sum + clampedDuration(s, dayStart, now), 0);

  // Name input for the hero — the pending name when idle, the running slot's name when tracking.
  const [nameInput, setNameInput] = useState("");
  useEffect(() => {
    setNameInput(running?.name ?? "");
  }, [running?._id]);

  const handleStart = async () => {
    const name = nameInput;
    setNameInput("");
    await start({ name: name.trim() ? name.trim() : undefined });
  };

  const commitRunningName = () => {
    if (running && (running.name ?? "") !== nameInput) {
      update({ id: running._id, name: nameInput });
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight font-mono">time-tracker</h1>
          {user?.name && <p className="text-sm text-muted-foreground">{user.name}</p>}
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Log out"
          onClick={() => logout()}
          className="text-muted-foreground"
        >
          <LogOut className="size-4" />
        </Button>
      </header>

      {/* Hero: current slot */}
      <div className="rounded-xl bg-card p-6 text-card-foreground shadow-xs ring-1 ring-foreground/10 relative space-y-2">
        <div
          className="font-mono text-lg text-center font-medium tabular-nums text-muted-foreground"
          data-running={!!running}
        >
          {running ? formatStopwatch(Math.max(0, now - running.start)) : "00:00:00"}
        </div>

        <Input
          value={nameInput}
          placeholder="What are you working on?"
          onChange={(e) => setNameInput(e.target.value)}
          onBlur={running ? commitRunningName : undefined}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            if (running) e.currentTarget.blur();
            else handleStart();
          }}
          className="h-11 flex-1 sm:text-left text-center"
        />
        <div className="flex flex-col sm:gap-3 gap-2 sm:flex-row sm:items-center">
          {running && (
            <div className="flex sm:flex-1 justify-center items-center gap-2 dark:bg-input/30 rounded-md bg-background">
              <span className="text-sm font-medium text-muted-foreground">
                Start Time:
              </span>
              <TimePicker
                variant="ghost"
                value={minutesOfDay(running.start)}
                onChange={(minutes) =>
                  update({ id: running._id, start: withMinutesOfDay(running.start, minutes) })
                }
                className="h-11"
              />
            </div>
          )}
          {running ? (
            <Button
              size="lg"
              variant="destructive"
              className="h-11 sm:flex-1"
              onClick={() => stop({})}
            >
              <Pause className="size-4" />
              Stop
            </Button>
          ) : (
            <Button size="lg" className="h-11 w-full" onClick={handleStart}>
              <Play className="size-4" />
              Start
            </Button>
          )}
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-card p-4 text-card-foreground shadow-xs ring-1 ring-foreground/10">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Today</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums font-mono">{formatDuration(todayTotal)}</p>
        </div>
        <div className="rounded-xl bg-card p-4 text-card-foreground shadow-xs ring-1 ring-foreground/10">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            This week
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums font-mono">{formatDuration(weekTotal)}</p>
        </div>
      </div>

      {/* Today's slots */}
      <section>
        <h2 className="mb-1 text-sm font-medium text-muted-foreground">Today</h2>
        {slots === undefined ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : todaysCompleted.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No finished time slots yet today.
          </p>
        ) : (
          <div className="space-y-2">
            {todaysCompleted.map((slot) => (
              <SlotRow
                key={slot._id}
                slot={slot}
                now={now}
                onUpdate={(patch) => update({ id: slot._id, ...patch })}
                onRemove={() => remove({ id: slot._id })}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
