import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AttendanceFilter } from "@/types/attendance";
import { useEmployees } from "@/hooks/useEmployees";
import { useAttendance } from "@/hooks/useAttendance";
import StatsCards from "@/components/StatsCards";
import AttendanceFilters from "@/components/AttendanceFilters";
import EmployeeList from "@/components/EmployeeList";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Users, Flame, AlertCircle } from "lucide-react";

// Maps URL slug → department name as stored in Supabase
const slugToName: Record<string, string | null> = {
  all:                  null,
  administration:       "Administration",
  "allied-health":      "Allied Health",
  auxiliary:            "Auxiliary",
  medicine:             "Medicine",
  "nursing-midwifery":  "Nursing & Midwifery",
  pharmacy:             "Pharmacy",
};

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function EmployeeListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-card rounded-xl border px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-2.5 w-24" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-5 w-16 hidden sm:block" />
            <Skeleton className="h-5 w-14 hidden md:block" />
            <Skeleton className="h-5 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ query, filter }: { query: string; filter: AttendanceFilter }) {
  const isFiltered = filter !== "all" || query.length > 0;
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
        <Users className="h-7 w-7 text-muted-foreground/40" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">
          {isFiltered ? "No employees match your search" : "No employees in this department"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {query
            ? `No results for "${query}"`
            : filter !== "all"
            ? "Try changing the filter above"
            : "This department has no staff records yet"}
        </p>
      </div>
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────
function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="h-7 w-7 text-destructive/60" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">Failed to load data</p>
        <p className="text-xs text-muted-foreground mt-1">{message}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const Index = () => {
  const { slug }    = useParams<{ slug: string }>();
  const navigate    = useNavigate();
  const [search, setSearch]     = useState("");
  const [pageReady, setPageReady] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const departmentName   = slug ? (slugToName[slug] ?? null) : null;

  // ── Load all employees + departments from Supabase ─────────────────────────
  const {
    employees,
    departments,
    loading: empsLoading,
    error:   empsError,
  } = useEmployees();

  // ── Resolve active department ID ──────────────────────────────────────────
  const activeDepartment = useMemo(() => {
    if (!departmentName) return null;
    return departments.find(d => d.name === departmentName)?.id ?? null;
  }, [departmentName, departments]);

  // ── Load attendance + credits for this department ─────────────────────────
  const {
    attendance,
    credits,
    loading: attLoading,
    error:   attError,
  } = useAttendance({ departmentId: activeDepartment });

  const isLoading = empsLoading || attLoading;
  const error     = empsError || attError;

  const [attendanceFilter, setAttendanceFilter] = useState<AttendanceFilter>("all");
  const [visibleCount, setVisibleCount]         = useState(10);

  // Reset on dept change
  useEffect(() => {
    setSearch("");
    setVisibleCount(10);
    setPageReady(false);
    const t = setTimeout(() => setPageReady(true), 350);
    return () => clearTimeout(t);
  }, [slug]);

  // Also set ready once loading finishes
  useEffect(() => {
    if (!isLoading) setPageReady(true);
  }, [isLoading]);

  const handleFilterChange = (filter: AttendanceFilter) => {
    setAttendanceFilter(filter);
    setVisibleCount(10);
  };

  // ── Filter employees to current department ─────────────────────────────────
  const deptEmployees = useMemo(() => {
    if (!activeDepartment) return employees;
    return employees.filter(e => e.department_id === activeDepartment);
  }, [employees, activeDepartment]);

  // ── Filter by attendance type ──────────────────────────────────────────────
  const filteredByAttendance = useMemo(() => {
    if (attendanceFilter === "all") return deptEmployees;
    return deptEmployees.filter(emp => {
      const empAtt = attendance.filter(a => a.employee_id === emp.id);
      switch (attendanceFilter) {
        case "missed_clock_in":  return empAtt.some(a => a.missed_clock_in  && !a.missed_clock_out);
        case "missed_clock_out": return empAtt.some(a => a.missed_clock_out && !a.missed_clock_in);
        case "missed_both":      return empAtt.some(a => a.missed_clock_in  && a.missed_clock_out);
        case "overtime":         return empAtt.some(a => a.is_overtime);
        default: return true;
      }
    });
  }, [deptEmployees, attendanceFilter, attendance]);

  // ── Search filter ──────────────────────────────────────────────────────────
  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return filteredByAttendance;
    return filteredByAttendance.filter(emp =>
      `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(q) ||
      emp.emp_code.toLowerCase().includes(q) ||
      (emp.position ?? "").toLowerCase().includes(q) ||
      emp.department_name.toLowerCase().includes(q)
    );
  }, [filteredByAttendance, search]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const relevantAtt = attendance.filter(a =>
      deptEmployees.some(e => e.id === a.employee_id)
    );
    const totalHours = relevantAtt.reduce((s, a) => s + a.hours_worked, 0);
    return {
      totalEmployees:  deptEmployees.length,
      missedClockIns:  relevantAtt.filter(a => a.missed_clock_in).length,
      missedClockOuts: relevantAtt.filter(a => a.missed_clock_out).length,
      avgHoursWorked:  deptEmployees.length > 0 ? totalHours / deptEmployees.length : 0,
    };
  }, [deptEmployees, attendance]);

  const pageTitle = departmentName ?? "All Departments";

  const showSkeleton = isLoading || !pageReady;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            {!showSkeleton && ` · ${deptEmployees.length} staff`}
          </p>
        </div>
        <Select
          value={slug ?? "all"}
          onValueChange={val => navigate(`/department/${val}`)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {/* Prefer dynamic list from Supabase, fall back to static slugs */}
            {departments.length > 0
              ? departments.map(d => {
                  const s = Object.entries(slugToName).find(([, n]) => n === d.name)?.[0];
                  return s ? (
                    <SelectItem key={s} value={s}>{d.name}</SelectItem>
                  ) : null;
                })
              : Object.entries(slugToName)
                  .filter(([k]) => k !== "all")
                  .map(([s, name]) => (
                    <SelectItem key={s} value={s}>{name}</SelectItem>
                  ))
            }
          </SelectContent>
        </Select>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      {showSkeleton ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-card flex items-center gap-4">
              <Skeleton className="h-11 w-11 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <StatsCards {...stats} />
      )}

      {/* ── Employee list card ───────────────────────────────────────────── */}
      <div className="bg-card rounded-xl border p-5 space-y-4">

        {/* Search + filter row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">Employees</h2>
            {!showSkeleton && (
              <span className="text-sm text-muted-foreground">
                ({filteredEmployees.length}
                {filteredEmployees.length !== deptEmployees.length
                  && ` of ${deptEmployees.length}`})
              </span>
            )}
          </div>
          <AttendanceFilters
            activeFilter={attendanceFilter}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={searchRef}
            placeholder="Search by name, code, position or department..."
            value={search}
            onChange={e => { setSearch(e.target.value); setVisibleCount(10); }}
            className="pl-9 h-9"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); searchRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Overtime context banner */}
        {attendanceFilter === "overtime" && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/20">
            <Flame className="h-4 w-4 text-primary shrink-0" />
            <p className="text-xs text-primary font-medium">
              Showing{" "}
              <span className="font-bold">
                {filteredEmployees.length} employee
                {filteredEmployees.length !== 1 ? "s" : ""}
              </span>{" "}
              who worked overtime. Each row shows the exact date, scheduled hours (9h),
              actual hours worked, and extra time.
            </p>
          </div>
        )}

        {/* List / skeleton / error / empty */}
        {showSkeleton ? (
          <EmployeeListSkeleton />
        ) : error ? (
          <ErrorState message={error} />
        ) : filteredEmployees.length === 0 ? (
          <EmptyState query={search} filter={attendanceFilter} />
        ) : (
          <EmployeeList
            employees={filteredEmployees}
            attendance={attendance}
            credits={credits}
            visibleCount={visibleCount}
            onSeeMore={() => setVisibleCount(filteredEmployees.length)}
            activeFilter={attendanceFilter}
          />
        )}
      </div>
    </div>
  );
};

export default Index;