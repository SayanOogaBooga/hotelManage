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
import { Loader2 } from "lucide-react";

interface DatePickerProps {
  value?: Date | string;
  onChange?: (formattedValue: string, dateObj?: Date) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  dateFormat?: string;
  displayFormat?: string;
  minDate?: Date | string;
  highlightAvailability?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select Date",
  className,
  disabled,
  dateFormat = "yyyy-MM-dd",
  displayFormat = "dd MMM yyyy",
  minDate,
  highlightAvailability = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [loadingAvailability, setLoadingAvailability] = React.useState(false);
  const [fullyBookedDates, setFullyBookedDates] = React.useState<Date[]>([]);
  const [availableDates, setAvailableDates] = React.useState<Date[]>([]);

  React.useEffect(() => {
    if (open && highlightAvailability) {
      setLoadingAvailability(true);
      Promise.all([
        fetch("/api/rooms").then(r => r.json()),
        fetch("/api/bookings").then(r => r.json())
      ]).then(([rooms, bookings]) => {
        const totalRooms = rooms.length;
        if (totalRooms === 0) return;

        const bookedPerDay = new Map<number, Set<string>>();
        
        const getMidnightTime = (date: string | Date) => {
          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        };

        bookings.forEach((b: any) => {
          if (b.checkIn && b.checkOut && b.roomsBooked) {
            const bStart = getMidnightTime(b.checkIn);
            const bEnd = getMidnightTime(b.checkOut);
            
            for (let t = bStart; t < bEnd; t += 86400000) {
              const tMidnight = getMidnightTime(new Date(t));
              if (!bookedPerDay.has(tMidnight)) {
                bookedPerDay.set(tMidnight, new Set());
              }
              const daySet = bookedPerDay.get(tMidnight)!;
              b.roomsBooked.forEach((r: any) => daySet.add(r._id || r));
            }
          }
        });

        const todayMs = getMidnightTime(new Date());
        const maxMs = todayMs + (90 * 86400000);
        
        const fullyBooked = [];
        const available = [];
        
        for (let t = todayMs; t < maxMs; t += 86400000) {
           const tMidnight = getMidnightTime(new Date(t));
           const set = bookedPerDay.get(tMidnight);
           const bookedCount = set ? set.size : 0;
           
           if (bookedCount >= totalRooms) {
             fullyBooked.push(new Date(tMidnight));
           } else {
             available.push(new Date(tMidnight));
           }
        }
        
        setFullyBookedDates(fullyBooked);
        setAvailableDates(available);
      }).catch(err => {
        console.error("Failed to load availability", err);
      }).finally(() => {
        setLoadingAvailability(false);
      });
    }
  }, [open, highlightAvailability]);

  const parsedMinDate = React.useMemo(() => {
    if (!minDate) return undefined;
    if (minDate instanceof Date) {
      const d = new Date(minDate);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    const d = new Date(minDate);
    if (!isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      return d;
    }
    return undefined;
  }, [minDate]);

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
        {loadingAvailability ? (
          <Loader2 className="h-4 w-4 text-slate-500 shrink-0 ml-2 animate-spin" />
        ) : (
          <CalendarIcon className="h-4 w-4 text-slate-500 shrink-0 ml-2" />
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white border border-slate-200 shadow-xl rounded-xl" align="start">
        <Calendar
          mode="single"
          selected={dateObj}
          onSelect={handleSelect}
          disabled={parsedMinDate ? { before: parsedMinDate } : undefined}
          modifiers={highlightAvailability ? { booked: fullyBookedDates, available: availableDates } : undefined}
          modifiersClassNames={highlightAvailability ? { booked: "is-booked-date", available: "is-available-date" } : undefined}
        />
      </PopoverContent>
    </Popover>
  );
}
