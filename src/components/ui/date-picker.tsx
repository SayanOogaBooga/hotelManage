"use client";

import * as React from "react";
import { format, parse } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value?: Date | string;
  onChange?: (formattedValue: string, dateObj?: Date) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  dateFormat?: string;
  displayFormat?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select Date",
  className,
  disabled,
  dateFormat = "yyyy-MM-dd",
  displayFormat = "dd MMM yyyy",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const dateObj = React.useMemo(() => {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    if (typeof value === "string") {
      // Try YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const parsed = parse(value, "yyyy-MM-dd", new Date());
        if (!isNaN(parsed.getTime())) return parsed;
      }
      // Try readable format e.g. "05 Apr 2026"
      const parsedReadable = new Date(value);
      if (!isNaN(parsedReadable.getTime())) return parsedReadable;
    }
    return undefined;
  }, [value]);

  const handleSelect = (selectedDate?: Date) => {
    if (!selectedDate) {
      onChange?.("");
    } else {
      const formatted = format(selectedDate, dateFormat);
      onChange?.(formatted, selectedDate);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "w-full flex justify-between items-center text-left font-normal h-10 px-3.5 border border-slate-200 rounded-lg text-sm bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm text-slate-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
          !dateObj && "text-slate-400",
          className
        )}
      >
        <span>
          {dateObj ? format(dateObj, displayFormat) : placeholder}
        </span>
        <CalendarIcon className="h-4 w-4 text-slate-500 shrink-0 ml-2" />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white border border-slate-200 shadow-xl rounded-xl" align="start">
        <Calendar
          mode="single"
          selected={dateObj}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
