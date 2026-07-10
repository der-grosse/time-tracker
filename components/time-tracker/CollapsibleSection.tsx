"use client";

import { ChevronDown, Download } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/time";
import { cn } from "@/lib/utils";

export interface CollapsibleSectionProps {
  label: ReactNode;
  /** Total duration in ms, shown on the right of the header. */
  total: number;
  defaultOpen?: boolean;
  onExport: () => void;
  exportAriaLabel: string;
  labelClassName?: string;
  children: ReactNode;
}

export function CollapsibleSection({
  label,
  total,
  defaultOpen = false,
  onExport,
  exportAriaLabel,
  labelClassName,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <div className="flex items-center gap-2 mr-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex flex-1 items-center gap-2 text-left cursor-pointer"
        >
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
          <span className={cn("flex-1", labelClassName)}>{label}</span>
          <span className="text-sm font-medium tabular-nums text-muted-foreground">
            {formatDuration(total)}
          </span>
        </button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={exportAriaLabel}
          onClick={onExport}
          className="text-muted-foreground"
        >
          <Download className="size-4" />
        </Button>
      </div>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}
