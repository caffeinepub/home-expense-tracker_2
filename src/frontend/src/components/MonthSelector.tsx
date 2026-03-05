import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = [
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
];

interface MonthSelectorProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

export default function MonthSelector({
  month,
  year,
  onChange,
}: MonthSelectorProps) {
  const prev = () => {
    if (month === 1) onChange(12, year - 1);
    else onChange(month - 1, year);
  };

  const next = () => {
    const now = new Date();
    const isCurrentOrFuture =
      year > now.getFullYear() ||
      (year === now.getFullYear() && month >= now.getMonth() + 1);
    if (isCurrentOrFuture) return;
    if (month === 12) onChange(1, year + 1);
    else onChange(month + 1, year);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const isMaxMonth =
    year > currentYear ||
    (year === currentYear && month >= new Date().getMonth() + 1);

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground hidden sm:block" />
      <Button
        variant="ghost"
        size="icon"
        onClick={prev}
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Select
        value={String(month)}
        onValueChange={(v) => onChange(Number(v), year)}
      >
        <SelectTrigger className="h-8 w-[120px] bg-secondary/40 border-border text-sm font-medium focus:ring-primary">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="glass border-border/50">
          {MONTHS.map((name, i) => (
            <SelectItem key={name} value={String(i + 1)} className="text-sm">
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={String(year)}
        onValueChange={(v) => onChange(month, Number(v))}
      >
        <SelectTrigger className="h-8 w-[80px] bg-secondary/40 border-border text-sm font-medium focus:ring-primary">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="glass border-border/50">
          {years.map((y) => (
            <SelectItem key={y} value={String(y)} className="text-sm">
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        size="icon"
        onClick={next}
        disabled={isMaxMonth}
        className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
