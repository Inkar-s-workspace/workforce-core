import { AttendanceFilter } from "@/types/attendance";
import { Filter } from "lucide-react";

interface AttendanceFiltersProps {
  activeFilter: AttendanceFilter;
  onFilterChange: (filter: AttendanceFilter) => void;
}

const filters: { value: AttendanceFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "missed_clock_in", label: "Missed Clock-In" },
  { value: "missed_clock_out", label: "Missed Clock-Out" },
  { value: "missed_both", label: "Missed Both" },
  { value: "overtime", label: "Overtime" },
];

const AttendanceFilters = ({ activeFilter, onFilterChange }: AttendanceFiltersProps) => {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span className="text-sm font-medium">Filter:</span>
      </div>
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => onFilterChange(f.value)}
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
            activeFilter === f.value
              ? f.value === "missed_clock_in" || f.value === "missed_clock_out"
                ? "bg-warning/15 text-warning border border-warning/30"
                : f.value === "missed_both"
                ? "bg-destructive/15 text-destructive border border-destructive/30"
                : f.value === "overtime"
                ? "bg-primary/15 text-primary border border-primary/30"
                : "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
};

export default AttendanceFilters;
