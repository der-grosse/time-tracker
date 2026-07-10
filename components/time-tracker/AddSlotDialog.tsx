"use client";

import { useMutation } from "convex/react";
import { CalendarDays, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimePicker } from "@/components/ui/time-picker";
import { api } from "@/convex/_generated/api";
import { startOfDay, withMinutesOfDay } from "@/lib/time";

export function AddSlotDialog() {
  const create = useMutation(api.timeSlots.create);
  const [open, setOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const [date, setDate] = useState(() => startOfDay());
  const [startMin, setStartMin] = useState(9 * 60); // 09:00
  const [endMin, setEndMin] = useState(10 * 60); // 10:00
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setDate(startOfDay());
    setStartMin(9 * 60);
    setEndMin(10 * 60);
    setName("");
  };

  const handleSave = async () => {
    if (endMin <= startMin) {
      toast.error("End time must be after start time");
      return;
    }
    setSaving(true);
    try {
      await create({
        name: name.trim() ? name.trim() : undefined,
        start: withMinutesOfDay(date, startMin),
        end: withMinutesOfDay(date, endMin),
      });
      reset();
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add time slot");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Plus className="size-4" />
            Add entry
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add time slot</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Name</span>
            <Input
              value={name}
              placeholder="What did you work on?"
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Date</span>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger
                render={<Button variant="outline" className="justify-start font-normal" />}
              >
                <CalendarDays className="size-4 text-muted-foreground" />
                {new Date(date).toLocaleDateString(undefined, {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  weekStartsOn={1}
                  required
                  selected={new Date(date)}
                  onSelect={(d) => {
                    setDate(startOfDay(d.getTime()));
                    setDateOpen(false);
                  }}
                  disabled={{ after: new Date() }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-4">
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-sm font-medium">Start</span>
              <TimePicker value={startMin} onChange={setStartMin} />
            </label>
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-sm font-medium">End</span>
              <TimePicker value={endMin} onChange={setEndMin} />
            </label>
          </div>
        </div>

        <DialogFooter showCloseButton>
          <Button onClick={handleSave} disabled={saving}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
