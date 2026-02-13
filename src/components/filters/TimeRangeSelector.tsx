import { Calendar, X } from 'lucide-react';

export type TimeRange = 'today' | 'week' | 'month' | 'custom';

const TIME_RANGE_OPTIONS: Array<{ value: TimeRange; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'custom', label: 'Custom' },
];

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

interface CustomDateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onApply?: () => void;
  onReset?: () => void;
  applyDisabled?: boolean;
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-border/40 bg-white p-1">
      {TIME_RANGE_OPTIONS.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
            value === range.value
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}

export function CustomDateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
  onReset,
  applyDisabled,
}: CustomDateRangePickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border/40 bg-white p-4">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-muted-foreground">
          From:
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="rounded-md border border-border/40 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-muted-foreground">To:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="rounded-md border border-border/40 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      {onApply && (
        <button
          onClick={onApply}
          disabled={applyDisabled}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50"
        >
          Apply
        </button>
      )}
      {onReset && (
        <button
          onClick={onReset}
          className="rounded-md border border-border/40 bg-white p-1.5 text-muted-foreground hover:bg-muted/50"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
