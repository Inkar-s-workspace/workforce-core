import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AttendanceFilter } from "@/types/attendance";
import {
  mockEmployees, mockAttendance, mockCredits, mockDepartments,
} from "@/data/mockData";
import StatsCards from "@/components/StatsCards";
import AttendanceFilters from "@/components/AttendanceFilters";
import EmployeeList from "@/components/EmployeeList";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, X, ChevronDown } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const slugToName: Record<string, string | null> = {
  all:                 null,
  administration:      "Administration",
  "allied-health":     "Allied Health",
  auxiliary:           "Auxiliary",
  medicine:            "Medicine",
  "nursing-midwifery": "Nursing & Midwifery",
  pharmacy:            "Pharmacy",
};

// ─── Skeletons / empty state ──────────────────────────────────────────────────

function EmployeeListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-2.5 w-24" />
            </div>
          </div>
          <Skeleton className="h-5 w-12" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ query, filter }: { query: string; filter: AttendanceFilter }) {
  const isFiltered = filter !== "all" || query.length > 0;
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center">
        <Users className="h-5 w-5 text-foreground/30" />
      </div>
      <div>
        <p className="font-display text-[14px] font-semibold">
          {isFiltered ? "No one matches that" : "No employees in this department"}
        </p>
        <p className="text-[12px] text-foreground/55 mt-1">
          {query
            ? `Nothing for "${query}"`
            : filter !== "all"
            ? "Try changing the filter above"
            : "Records will appear once BioTime syncs"}
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const Index = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [search,    setSearch]    = useState("");
  const [pageReady, setPageReady] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const departmentName = slug ? (slugToName[slug] ?? null) : null;

  const employees   = mockEmployees;
  const attendance  = mockAttendance;
  const credits     = mockCredits;
  const departments = mockDepartments;

  const [deptFilter,        setDeptFilter]        = useState<string | null>(null);
  const [attendanceFilter,  setAttendanceFilter]  = useState<AttendanceFilter>("all");
  const [visibleCount,      setVisibleCount]      = useState(10);

  const activeDepartment = useMemo(() => {
    if (departmentName) return departments.find(d => d.name === departmentName)?.id ?? null;
    return deptFilter;
  }, [departmentName, departments, deptFilter]);

  useEffect(() => {
    setSearch("");
    setVisibleCount(10);
    setDeptFilter(null);
    setPageReady(false);
    const t = setTimeout(() => setPageReady(true), 200);
    return () => clearTimeout(t);
  }, [slug]);

  const handleFilterChange = (filter: AttendanceFilter) => {
    setAttendanceFilter(filter);
    setVisibleCount(10);
  };

  const deptEmployees = useMemo(() => {
    if (!activeDepartment) return employees;
    return employees.filter(e => e.department_id === activeDepartment);
  }, [employees, activeDepartment]);

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

  const currentDeptName = useMemo(() => {
    if (departmentName) return departmentName;
    if (deptFilter) return departments.find(d => d.id === deptFilter)?.name ?? null;
    return null;
  }, [departmentName, deptFilter, departments]);

  const pageTitle    = currentDeptName ?? "All departments";
  const showSkeleton = !pageReady;

  return (
    <div className="max-w-[1100px] mx-auto px-6 md:px-10 pt-10 md:pt-14 pb-16">

      {/* ── Page header — uniform pattern with Welcome ───────────────── */}
      <header className="mb-10 pb-6 border-b border-foreground/10">
        <p className="text-[12px] tracking-[0.14em] uppercase text-foreground/45 font-display font-semibold mb-2">
          Attendance
        </p>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display font-bold text-[34px] md:text-[40px] tracking-tight leading-tight">
              {pageTitle}
            </h1>
            <p className="text-[13px] text-foreground/55 mt-1.5">
              {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
              {!showSkeleton && (
                <>
                  <span className="text-foreground/25 mx-2">·</span>
                  {deptEmployees.length} {deptEmployees.length === 1 ? "person" : "people"}
                </>
              )}
            </p>
          </div>

          {/* Department selector — quiet */}
          <Select value={slug ?? "all"} onValueChange={val => navigate(`/department/${val}`)}>
            <SelectTrigger className="w-[200px] h-9 text-[13px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map(d => {
                const s = Object.entries(slugToName).find(([, n]) => n === d.name)?.[0];
                return s ? <SelectItem key={s} value={s}>{d.name}</SelectItem> : null;
              })}
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <section className="mb-10">
        {showSkeleton ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4">
                <Skeleton className="h-3.5 w-3.5 mb-3" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        ) : (
          <StatsCards {...stats} />
        )}
      </section>

      {/* ── Employees section ───────────────────────────────────────── */}
      <section>
        <div className="flex items-baseline justify-between mb-4 pb-3 border-b border-foreground/10">
          <h2 className="font-display text-[11px] tracking-[0.14em] uppercase text-foreground/55 font-semibold">
            Employees
          </h2>
          {!showSkeleton && (
            <span className="text-[11px] text-foreground/40 tabular-nums">
              {filteredEmployees.length}
              {filteredEmployees.length !== deptEmployees.length && ` of ${deptEmployees.length}`}
            </span>
          )}
        </div>

        {/* Department chips (only on All Departments view) */}
        {!departmentName && (
          <div className="flex flex-wrap gap-1 mb-4">
            <DeptChip
              active={deptFilter === null}
              count={employees.length}
              label="All"
              onClick={() => setDeptFilter(null)}
            />
            {departments.map(d => {
              const count = employees.filter(e => e.department_id === d.id).length;
              return (
                <DeptChip
                  key={d.id}
                  active={deptFilter === d.id}
                  count={count}
                  label={d.name}
                  onClick={() => setDeptFilter(d.id)}
                />
              );
            })}
          </div>
        )}

        {/* Search + filter row */}
        <div className="flex items-center gap-3 flex-wrap mb-4">
          {/* Search input */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/40 pointer-events-none" />
            <input
              ref={searchRef}
              placeholder="Search by name, code or position…"
              value={search}
              onChange={e => { setSearch(e.target.value); setVisibleCount(10); }}
              className="w-full pl-9 pr-9 h-9 rounded-md border border-border bg-card text-[13px] text-foreground placeholder-foreground/40 focus:outline-none focus:border-foreground/30 transition-colors"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); searchRef.current?.focus(); }}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-foreground/10 text-foreground/40 hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="ml-auto">
            <AttendanceFilters activeFilter={attendanceFilter} onFilterChange={handleFilterChange} />
          </div>
        </div>

        {/* Active filter banner */}
        {attendanceFilter === "overtime" && (
          <div className="flex items-center gap-2 px-3 py-2 mb-4 rounded-md bg-amc-yellow/10 border border-amc-yellow/30">
            <p className="text-[12px] text-foreground/80">
              Showing <span className="font-semibold">{filteredEmployees.length}</span> {filteredEmployees.length === 1 ? "person" : "people"} with overtime this period
            </p>
          </div>
        )}

        {/* List */}
        {showSkeleton ? (
          <EmployeeListSkeleton />
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
      </section>

    </div>
  );
};

// ─── Department chip (used on All Departments view) ──────────────────────────

function DeptChip({
  active, count, label, onClick,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors
        ${active
          ? "bg-foreground text-background"
          : "text-foreground/65 hover:text-foreground hover:bg-foreground/5"
        }`}
    >
      <span>{label}</span>
      <span className={`text-[11px] tabular-nums ${active ? "text-background/60" : "text-foreground/40"}`}>
        {count}
      </span>
    </button>
  );
}

export default Index;