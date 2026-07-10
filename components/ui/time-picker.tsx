"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

const timePickerVariants = cva(
  "flex items-center gap-1 h-9 rounded-md px-3 py-1 text-sm transition-[color,box-shadow] outline-none has-[:focus]:ring-ring/50 has-[:focus]:ring-[3px] has-[:focus]:border-ring",
  {
    variants: {
      variant: {
        default: "shadow-xs border-input border bg-background dark:bg-input/30",
        card: "shadow-xs border-border border bg-card dark:bg-input/30",
        ghost: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type TimePickerProps = VariantProps<typeof timePickerVariants> & {
  /** Time value in minutes from midnight (0–1439) */
  value: number;
  onChange: (minutes: number) => void;
  className?: string;
  disabled?: boolean;
  readonly?: boolean;
};

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function padTwo(n: number) {
  return n.toString().padStart(2, "0");
}

function TimePicker({ value, onChange, variant, className, disabled, readonly }: TimePickerProps) {
  const hours = Math.floor(clamp(value, 0, 1439) / 60);
  const minutes = clamp(value, 0, 1439) % 60;

  const hourRef = useRef<HTMLInputElement>(null);
  const minuteRef = useRef<HTMLInputElement>(null);

  const [hourInput, setHourInput] = useState<string | null>(null);
  const [minuteInput, setMinuteInput] = useState<string | null>(null);
  const committedFromChange = useRef(false);

  const focusMinute = () => {
    requestAnimationFrame(() => {
      minuteRef.current?.focus();
      minuteRef.current?.select();
    });
  };

  const focusHour = () => {
    requestAnimationFrame(() => {
      hourRef.current?.focus();
      hourRef.current?.select();
    });
  };

  const commitTime = (h: number, m: number) => {
    onChange(clamp(h, 0, 23) * 60 + clamp(m, 0, 59));
  };

  const handleSegmentKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    segment: "hour" | "minute",
  ) => {
    const h = hours;
    const m = minutes;

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (segment === "hour") commitTime(h === 23 ? 0 : h + 1, m);
      else commitTime(h, m === 59 ? 0 : m + 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (segment === "hour") commitTime(h === 0 ? 23 : h - 1, m);
      else commitTime(h, m === 0 ? 59 : m - 1);
    } else if (e.key === "ArrowRight" && segment === "hour") {
      e.preventDefault();
      focusMinute();
    } else if (e.key === "ArrowLeft" && segment === "minute") {
      e.preventDefault();
      focusHour();
    } else if (e.key === ":" && segment === "hour") {
      e.preventDefault();
      focusMinute();
    }
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw === "") {
      setHourInput("");
      return;
    }
    const num = parseInt(raw, 10);
    if (num > 23) return;

    // Auto-advance to minutes when 2 digits typed or value > 2 (can only be 0-2x)
    if (raw.length >= 2 || num > 2) {
      committedFromChange.current = true;
      commitTime(num, minutes);
      setHourInput(null);
      focusMinute();
    } else {
      setHourInput(raw);
    }
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw === "") {
      setMinuteInput("");
      return;
    }
    const num = parseInt(raw, 10);
    if (num > 59) return;

    if (raw.length >= 2 || num > 5) {
      committedFromChange.current = true;
      commitTime(hours, num);
      setMinuteInput(null);
    } else {
      setMinuteInput(raw);
    }
  };

  const handleHourBlur = () => {
    if (committedFromChange.current) {
      committedFromChange.current = false;
    } else if (hourInput !== null && hourInput !== "") {
      commitTime(clamp(parseInt(hourInput, 10) || 0, 0, 23), minutes);
    }
    setHourInput(null);
  };

  const handleMinuteBlur = () => {
    if (committedFromChange.current) {
      committedFromChange.current = false;
    } else if (minuteInput !== null && minuteInput !== "") {
      commitTime(hours, clamp(parseInt(minuteInput, 10) || 0, 0, 59));
    }
    setMinuteInput(null);
  };

  return (
    <div className={cn(timePickerVariants({ variant }), className)}>
      <input
        ref={hourRef}
        type="text"
        inputMode="numeric"
        disabled={disabled}
        className="w-5 bg-transparent text-center outline-none select-all tabular-nums disabled:cursor-not-allowed disabled:opacity-50 font-mono"
        value={hourInput ?? padTwo(hours)}
        onChange={handleHourChange}
        onFocus={(e) => e.target.select()}
        onBlur={handleHourBlur}
        onKeyDown={(e) => handleSegmentKeyDown(e, "hour")}
        readOnly={readonly}
      />
      <span className="text-muted-foreground select-none">:</span>
      <input
        ref={minuteRef}
        type="text"
        inputMode="numeric"
        disabled={disabled}
        className="w-5 bg-transparent text-center outline-none select-all tabular-nums disabled:cursor-not-allowed disabled:opacity-50 font-mono"
        value={minuteInput ?? padTwo(minutes)}
        onChange={handleMinuteChange}
        onFocus={(e) => e.target.select()}
        onBlur={handleMinuteBlur}
        onKeyDown={(e) => handleSegmentKeyDown(e, "minute")}
        readOnly={readonly}
      />
    </div>
  );
}

export { TimePicker };
