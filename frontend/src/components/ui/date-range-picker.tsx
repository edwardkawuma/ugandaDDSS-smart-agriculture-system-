import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

interface DateRangePickerProps {
  selected: DateRange;
  onSelect: (range: DateRange) => void;
  onApply?: () => void;
  onClear?: () => void;
  placeholder?: string;
  numberOfMonths?: number;
  className?: string;
  align?: "start" | "center" | "end";
  disabled?: boolean;
}

function DateRangePicker({
  selected,
  onSelect,
  onApply,
  onClear,
  placeholder = "Select date range",
  numberOfMonths = 2,
  className,
  align = "end",
  disabled,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (range: DateRange | undefined) => {
    if (range?.from) {
      onSelect({ from: range.from, to: range.to || undefined });
    }
  };

  const handleApply = () => {
    setOpen(false);
    onApply?.();
  };

  const handleClear = () => {
    onSelect({ from: undefined, to: undefined });
    setOpen(false);
    onClear?.();
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "";
    return format(date, "yyyy-MM-dd");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !selected.from && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected.from ? (
            selected.to ? (
              <>
                {formatDate(selected.from)} - {formatDate(selected.to)}
              </>
            ) : (
              formatDate(selected.from)
            )
          ) : (
            placeholder
          )}
          <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <div className="p-3 border-b border-border">
          <Calendar
            mode="range"
            selected={selected}
            onSelect={handleSelect}
            numberOfMonths={numberOfMonths}
          />
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="ghost" size="sm" onClick={handleClear}>
              Clear
            </Button>
            <Button size="sm" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

DateRangePicker.displayName = "DateRangePicker";

export { DateRangePicker };
export type { DateRange };
