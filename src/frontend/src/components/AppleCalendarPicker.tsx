import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Expense } from "../backend.d";

interface AppleCalendarPickerProps {
  value: Date;
  onChange: (date: Date) => void;
  expenses: Expense[];
}

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

// Stable column positions 0–6 (used as values, not array indices)
const COLS = [0, 1, 2, 3, 4, 5, 6] as const;
// Stable row start offsets (multiples of 7)
const ROW_STARTS = [0, 7, 14, 21, 28, 35] as const;

function formatTriggerDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Build a flat array of 42 cells (6 rows × 7 cols).
 * Week starts Monday (ISO).
 */
function buildCalendarCells(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();

  // Convert JS Sunday=0 getDay to Monday=0 offset
  const rawDow = firstDay.getDay();
  const startOffset = rawDow === 0 ? 6 : rawDow - 1;

  const cells: (Date | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= lastDate; d++) {
    cells.push(new Date(year, month, d));
  }
  while (cells.length < 42) cells.push(null);
  return cells;
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export default function AppleCalendarPicker({
  value,
  onChange,
  expenses,
}: AppleCalendarPickerProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => value.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => value.getMonth());
  const [slideDir, setSlideDir] = useState<1 | -1>(1);

  // Sync the calendar view whenever the value changes (e.g., modal opens
  // with a different month selected from the MonthSelector)
  useEffect(() => {
    setViewYear(value.getFullYear());
    setViewMonth(value.getMonth());
  }, [value]);

  const today = new Date();
  const cells = buildCalendarCells(viewYear, viewMonth);
  const monthKey = `${viewYear}-${viewMonth}`;

  // O(1) lookup for expense dots
  const expenseDaySet = new Set<string>(
    expenses
      .filter((e) => e.createdAt > BigInt(0))
      .map((e) => {
        const d = new Date(Number(e.createdAt / BigInt(1_000_000)));
        return dayKey(d);
      }),
  );

  const navigate = (dir: 1 | -1) => {
    setSlideDir(dir);
    if (dir === 1) {
      if (viewMonth === 11) {
        setViewMonth(0);
        setViewYear((y) => y + 1);
      } else {
        setViewMonth((m) => m + 1);
      }
    } else {
      if (viewMonth === 0) {
        setViewMonth(11);
        setViewYear((y) => y - 1);
      } else {
        setViewMonth((m) => m - 1);
      }
    }
  };

  const isToday = (d: Date) =>
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();

  const isSelected = (d: Date) =>
    d.getFullYear() === value.getFullYear() &&
    d.getMonth() === value.getMonth() &&
    d.getDate() === value.getDate();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-ocid="expense.date.button"
          className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-md bg-input border border-border text-sm text-foreground hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-left"
        >
          <CalendarIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span>{formatTriggerDate(value)}</span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="p-0 border-0 bg-transparent shadow-none w-80"
        align="start"
        sideOffset={4}
      >
        <div
          className="rounded-2xl overflow-hidden shadow-2xl border border-border/50"
          style={{
            background: "oklch(var(--background) / 0.97)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* ── Gradient header ── */}
          <div
            className="px-4 pt-4 pb-3"
            style={{
              background:
                "linear-gradient(135deg, oklch(var(--primary) / 0.85), oklch(var(--accent) / 0.65))",
            }}
          >
            <div className="flex items-end justify-between">
              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "oklch(var(--primary-foreground) / 0.65)" }}
                >
                  {viewYear}
                </p>
                <p className="text-xl font-bold leading-tight text-primary-foreground">
                  {MONTH_NAMES[viewMonth]}
                </p>
              </div>

              <div className="flex items-center gap-0.5 pb-0.5">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  data-ocid="calendar.pagination_prev"
                  className="w-8 h-8 flex items-center justify-center rounded-full text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/20 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate(1)}
                  data-ocid="calendar.pagination_next"
                  className="w-8 h-8 flex items-center justify-center rounded-full text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/20 transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Calendar body ── */}
          <div className="px-3 pt-2 pb-3">
            {/* Weekday labels — stable WEEKDAYS array */}
            <div className="grid grid-cols-7 mb-0.5">
              {WEEKDAYS.map((wd) => (
                <div
                  key={wd}
                  className="text-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground py-1.5"
                >
                  {wd}
                </div>
              ))}
            </div>

            {/* Day grid — month transitions slide in/out */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={monthKey}
                initial={{ opacity: 0, x: slideDir * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: slideDir * -24 }}
                transition={{ duration: 0.18, ease: "easeInOut" }}
              >
                {/* Use ROW_STARTS values as stable keys (not map index) */}
                {ROW_STARTS.map((rowStart) => (
                  <div key={`r${rowStart}`} className="grid grid-cols-7">
                    {/* Use COLS values as stable keys (not map index) */}
                    {COLS.map((col) => {
                      const date = cells[rowStart + col];

                      if (!date) {
                        return (
                          <div key={`e${rowStart}c${col}`} className="h-9" />
                        );
                      }

                      const sel = isSelected(date);
                      const tod = isToday(date);
                      const hasDot = expenseDaySet.has(dayKey(date));

                      return (
                        <button
                          key={dayKey(date)}
                          type="button"
                          onClick={() => {
                            onChange(date);
                            setOpen(false);
                          }}
                          className={cn(
                            "relative flex flex-col items-center justify-center h-9 rounded-full transition-all text-sm font-medium",
                            sel
                              ? "bg-primary text-primary-foreground shadow-glow-cyan"
                              : tod
                                ? "text-primary font-semibold ring-1 ring-primary/60 ring-inset"
                                : "text-foreground hover:bg-muted/40",
                          )}
                        >
                          <span className="leading-none">{date.getDate()}</span>
                          {hasDot && (
                            <span
                              className={cn(
                                "absolute bottom-[3px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full",
                                sel ? "bg-primary-foreground/80" : "bg-primary",
                              )}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
