"use client";

import { useMutation, useQuery } from "convex/react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AddSlotDialog } from "@/components/time-tracker/AddSlotDialog";
import { CollapsibleSection } from "@/components/time-tracker/CollapsibleSection";
import { WeekCard } from "@/components/time-tracker/WeekCard";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { downloadCsv, slotsToCsv } from "@/lib/csv";
import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  slotDuration,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "@/lib/time";
import { cn } from "@/lib/utils";

type Slot = Doc<"timeSlots">;

function sumDuration(slots: Slot[], now: number): number {
  return slots.reduce((total, slot) => total + slotDuration(slot, now), 0);
}

/** Group slots into Year → Month → Week by the month/year of each week's Monday. */
function buildTree(slots: Slot[]) {
  const years = new Map<number, Map<number, Map<number, Slot[]>>>();

  for (const slot of slots) {
    const weekStart = startOfWeek(slot.start);
    const yearStart = startOfYear(weekStart);
    const monthStart = startOfMonth(weekStart);

    const months = years.get(yearStart) ?? new Map<number, Map<number, Slot[]>>();
    years.set(yearStart, months);
    const weeks = months.get(monthStart) ?? new Map<number, Slot[]>();
    months.set(monthStart, weeks);
    const weekSlots = weeks.get(weekStart) ?? [];
    weekSlots.push(slot);
    weeks.set(weekStart, weekSlots);
  }

  const sortedKeysDesc = <V,>(map: Map<number, V>) =>
    [...map.entries()].sort((a, b) => b[0] - a[0]);

  return sortedKeysDesc(years).map(([yearStart, months]) => ({
    yearStart,
    months: sortedKeysDesc(months).map(([monthStart, weeks]) => ({
      monthStart,
      weeks: sortedKeysDesc(weeks).map(([weekStart, weekSlots]) => ({
        weekStart,
        slots: weekSlots.sort((a, b) => b.start - a.start),
      })),
      slots: [...weeks.values()].flat(),
    })),
    slots: [...months.values()].flatMap((weeks) => [...weeks.values()].flat()),
  }));
}

export default function HistoryPage() {
  const [now, setNow] = useState(() => Date.now());

  // Keep the current week's running slot duration live.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const slots = useQuery(api.timeSlots.listAll, {});
  const update = useMutation(api.timeSlots.update);
  const remove = useMutation(api.timeSlots.remove);

  const tree = useMemo(() => buildTree(slots ?? []), [slots]);

  // Open the year, month, and week containing the current week by default.
  const currentWeekStart = startOfWeek(now);
  const currentMonthStart = startOfMonth(currentWeekStart);
  const currentYearStart = startOfYear(currentWeekStart);

  const exportRange = (from: number, to: number, label: string) => {
    const inRange = (slots ?? []).filter((s) => s.start >= from && s.start < to);
    downloadCsv(`time-${label}.csv`, slotsToCsv(inRange));
  };

  const yearName = (ts: number) => new Date(ts).getFullYear().toString();
  const monthName = (ts: number) =>
    new Date(ts).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const monthLabel = (ts: number) =>
    new Date(ts).toLocaleDateString(undefined, { year: "numeric", month: "2-digit" });
  const weekLabel = (ts: number) =>
    new Date(ts).toLocaleDateString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:py-10">
      <header className="flex items-center">
        <Link
          href="/"
          aria-label="Back to tracker"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-sm" }),
            "text-muted-foreground -ml-2",
          )}
        >
          <ChevronLeft className="size-4" />
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">History</h1>
        <div className="grow mr-2" />
        <AddSlotDialog />
      </header>

      {slots === undefined ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : tree.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No time slots recorded yet.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {tree.map((year) => (
            <CollapsibleSection
              key={year.yearStart}
              label={yearName(year.yearStart)}
              labelClassName="text-lg font-semibold"
              total={sumDuration(year.slots, now)}
              defaultOpen={year.yearStart === currentYearStart}
              onExport={() =>
                exportRange(
                  startOfYear(year.yearStart),
                  endOfYear(year.yearStart),
                  yearName(year.yearStart),
                )
              }
              exportAriaLabel={`Download ${yearName(year.yearStart)} as CSV`}
            >
              <div className="ml-2 flex flex-col gap-4 border-l border-border pl-3">
                {year.months.map((month) => (
                  <CollapsibleSection
                    key={month.monthStart}
                    label={monthName(month.monthStart)}
                    labelClassName="font-medium"
                    total={sumDuration(month.slots, now)}
                    defaultOpen={month.monthStart === currentMonthStart}
                    onExport={() =>
                      exportRange(
                        startOfMonth(month.monthStart),
                        endOfMonth(month.monthStart),
                        monthLabel(month.monthStart),
                      )
                    }
                    exportAriaLabel={`Download ${monthName(month.monthStart)} as CSV`}
                  >
                    <div className="ml-2 flex flex-col gap-3 border-l border-border pl-3">
                      {month.weeks.map((week) => (
                        <WeekCard
                          key={week.weekStart}
                          weekStart={week.weekStart}
                          slots={week.slots}
                          now={now}
                          defaultOpen={week.weekStart === currentWeekStart}
                          onUpdate={(id, patch) => update({ id, ...patch })}
                          onRemove={(id) => remove({ id })}
                          onExport={() =>
                            exportRange(
                              week.weekStart,
                              endOfWeek(week.weekStart),
                              weekLabel(week.weekStart),
                            )
                          }
                        />
                      ))}
                    </div>
                  </CollapsibleSection>
                ))}
              </div>
            </CollapsibleSection>
          ))}
        </div>
      )}
    </div>
  );
}
