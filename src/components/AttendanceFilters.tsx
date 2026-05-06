import { AttendanceFilter } from "@/types/attendance";

interface AttendanceFiltersProps {
  activeFilter: AttendanceFilter;
  onFilterChange: (filter: AttendanceFilter) => void;
}

const filters: { value: AttendanceFilter; label: string }[] = [
  { value: "all",              label: "All" },
  { value: "missed_clock_in",  label: "Missed in" },
  { value: "missed_clock_out", label: "Missed out" },
  { value: "missed_both",      label: "Missed both" },
  { value: "overtime",         label: "Overtime" },
];

const AttendanceFilters = ({ activeFilter, onFilterChange }: AttendanceFiltersProps) => {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {filters.map((f) => {
        const isActive = activeFilter === f.value;
        return (
          <button
            key={f.value}
            onClick={() => onFilterChange(f.value)}
            className={`text-[12px] px-2.5 py-1.5 rounded-md font-medium transition-colors
              ${isActive
                ? "bg-foreground text-background"
                : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
              }`}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
};

export default AttendanceFilters;