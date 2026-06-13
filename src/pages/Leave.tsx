import { useState, useMemo, useRef } from "react";
import { mockLeaveBalances, mockLeaveRecords } from "@/data/mockLeaveData";
import type { LeaveType, LeaveStatus } from "@/types/attendance";
import {
  Search, X, CalendarDays, ClipboardList,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  { id: "dept-1", name: "Administration" },
  { id: "dept-2", name: "Allied Health" },
  { id: "dept-3", name: "Auxiliary" },
  { id: "dept-4", name: "Medicine" },
  { id: "dept-5", name: "Nursing & Midwifery" },
  { id: "dept-6", name: "Pharmacy" },
];

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual:        "Annual",
  sick:          "Sick",
  maternity:     "Maternity",
  paternity:     "Paternity",
  study:         "Study",
  compassionate: "Compassionate",
  casual:        "Casual",
};

const LEAVE_TYPE_COLOURS: Record<LeaveType, string> = {
  annual:        "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  sick:          "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  maternity:     "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  paternity:     "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  study:         "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  compassionate: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  casual:        "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
};

const STATUS_COLOURS: Record<LeaveStatus, string> = {
  approved:  "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  pending:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  rejected:  "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, colour = "text-foreground",
}: {
  label: string;
  value: string | number;
  sub?: string;
  colour?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl px-5 py-4">
      <p className={`font-display font-bold text-[28px] leading-none tabular-nums ${colour}`}>{value}</p>
      <p className="text-[12px] font-semibold text-foreground/80 mt-1">{label}</p>
      {sub && <p className="text-[11px] text-foreground/45 mt-0.5">{sub}</p>}
    </div>
  );
}

function Badge({ text, className }: { text: string; className: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold leading-none ${className}`}>
      {text}
    </span>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

type View = "balances" | "records";

export default function Leave() {
  const [view,       setView]       = useState<View>("balances");
  const [search,     setSearch]     = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [probFilter, setProbFilter] = useState<string>("all");
  const [showAllBalances, setShowAllBalances] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const BALANCES_PREVIEW = 10;

  // Reset expansion when filters change
  const prevFiltersRef = useRef({ search, deptFilter, probFilter });
  if (
    prevFiltersRef.current.search !== search ||
    prevFiltersRef.current.deptFilter !== deptFilter ||
    prevFiltersRef.current.probFilter !== probFilter
  ) {
    prevFiltersRef.current = { search, deptFilter, probFilter };
    if (showAllBalances) setShowAllBalances(false);
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalSickTaken = useMemo(() =>
    mockLeaveBalances.reduce((s, b) => s + b.sick_taken, 0), []);

  const totalWithSickTaken = useMemo(() =>
    mockLeaveBalances.filter(b => b.sick_taken > 0).length, []);

  const pendingCount = useMemo(() =>
    mockLeaveRecords.filter(r => r.status === "pending").length, []);

  // ── Balances filtering ────────────────────────────────────────────────────
  const filteredBalances = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mockLeaveBalances.filter(b => {
      if (deptFilter !== "all" && b.department_id !== deptFilter) return false;
      if (probFilter === "regular"   &&  b.is_probation) return false;
      if (probFilter === "probation" && !b.is_probation) return false;
      if (!q) return true;
      return (
        b.employee_name.toLowerCase().includes(q) ||
        b.emp_code.toLowerCase().includes(q) ||
        b.position.toLowerCase().includes(q)
      );
    });
  }, [search, deptFilter, probFilter]);

  // ── Records filtering ────────────────────────────────────────────────────
  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mockLeaveRecords.filter(r => {
      if (deptFilter !== "all" && r.department_id !== deptFilter) return false;
      if (typeFilter !== "all" && r.leave_type !== typeFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.employee_name.toLowerCase().includes(q) ||
        r.emp_code.toLowerCase().includes(q) ||
        r.department_name.toLowerCase().includes(q)
      );
    });
  }, [search, deptFilter, typeFilter, statusFilter]);

  const clearSearch = () => {
    setSearch("");
    searchRef.current?.focus();
  };

  const totalCarryForward = useMemo(() =>
    mockLeaveBalances.reduce((s, b) => s + b.accumulated_carry_forward, 0), []);

  return (
    <div className="max-w-[1200px] mx-auto px-6 md:px-10 pt-10 md:pt-14 pb-16">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="mb-10 pb-6 border-b border-foreground/10">
        <p className="text-[12px] tracking-[0.14em] uppercase text-foreground/45 font-display font-semibold mb-2">
          HR
        </p>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display font-bold text-[34px] md:text-[40px] tracking-tight leading-tight">
              Leave Management
            </h1>
            <p className="text-[13px] text-foreground/55 mt-1.5">
              {new Date().getFullYear()} ·{" "}
              {mockLeaveBalances.length} employees ·{" "}
              {mockLeaveBalances.filter(b => b.is_probation).length} on probation
            </p>
          </div>
        </div>
      </header>

      {/* ── Stats cards ─────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        <StatCard
          label="Total employees"
          value={mockLeaveBalances.length}
          sub={`${mockLeaveBalances.filter(b => !b.is_probation).length} confirmed staff`}
        />
        <StatCard
          label="Sick days taken YTD"
          value={totalSickTaken}
          sub={`${totalWithSickTaken} employees affected`}
          colour="text-orange-600 dark:text-orange-400"
        />
        <StatCard
          label="Pending approvals"
          value={pendingCount}
          sub="Annual & study leave"
          colour={pendingCount > 0 ? "text-amc-yellow" : "text-foreground"}
        />
        <StatCard
          label="Carry-forward days"
          value={totalCarryForward.toFixed(0)}
          sub="Accumulated from 2025"
        />
      </section>

      {/* ── View toggle ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="inline-flex border border-border rounded p-0.5 bg-card">
          {(["balances", "records"] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-[12px] font-display font-semibold transition-colors capitalize
                ${view === v
                  ? "bg-foreground text-background"
                  : "text-foreground/60 hover:text-foreground"
                }`}
            >
              {v === "balances" ? <ClipboardList className="h-3.5 w-3.5" /> : <CalendarDays className="h-3.5 w-3.5" />}
              {v === "balances" ? "Leave Balances" : "Leave Records"}
            </button>
          ))}
        </div>

        {view === "balances" && (
          <p className="text-[12px] text-foreground/45 ml-1">
            {filteredBalances.length} {filteredBalances.length === 1 ? "employee" : "employees"}
          </p>
        )}
        {view === "records" && (
          <p className="text-[12px] text-foreground/45 ml-1">
            {filteredRecords.length} {filteredRecords.length === 1 ? "record" : "records"}
          </p>
        )}
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2.5 mb-6 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/40 pointer-events-none" />
          <input
            ref={searchRef}
            placeholder="Search name, code or position…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 h-9 rounded-md border border-border bg-card text-[13px] text-foreground placeholder-foreground/40 focus:outline-none focus:border-foreground/30 transition-colors"
          />
          {search && (
            <button
              onClick={clearSearch}
              aria-label="Clear"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-foreground/10 text-foreground/40 hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Department */}
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-[180px] h-9 text-[13px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {DEPARTMENTS.map(d => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Records-only: Leave Type */}
        {view === "records" && (
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px] h-9 text-[13px]">
              <SelectValue placeholder="Leave type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {(Object.keys(LEAVE_TYPE_LABELS) as LeaveType[]).map(t => (
                <SelectItem key={t} value={t}>{LEAVE_TYPE_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Records-only: Status */}
        {view === "records" && (
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9 text-[13px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Balances-only: Employee type */}
        {view === "balances" && (
          <Select value={probFilter} onValueChange={setProbFilter}>
            <SelectTrigger className="w-[160px] h-9 text-[13px]">
              <SelectValue placeholder="Staff status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All staff</SelectItem>
              <SelectItem value="regular">Confirmed staff</SelectItem>
              <SelectItem value="probation">Probation</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* ── Balances view ────────────────────────────────────────────────── */}
      {view === "balances" && (
        <div className="bg-card border border-border rounded-md overflow-hidden">
          {filteredBalances.length === 0 ? (
            <div className="py-16 text-center text-[13px] text-foreground/45">No employees match that filter.</div>
          ) : (
            <div className="overflow-auto max-h-[64vh]">
              <table className="w-full text-[13px]">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-border bg-muted">
                    <TH>#</TH>
                    <TH align="left">Employee</TH>
                    <TH align="left">Department</TH>
                    <TH align="center">Status</TH>
                    <TH align="center">Annual Entitlement</TH>
                    <TH align="center">Carry Forward</TH>
                    <TH align="center">Annual Taken</TH>
                    <TH align="center">Annual Remaining</TH>
                    <TH align="center">Sick Entitlement</TH>
                    <TH align="center">Sick Taken</TH>
                    <TH align="center">Sick Remaining</TH>
                  </tr>
                </thead>
                <tbody>
                  {(showAllBalances ? filteredBalances : filteredBalances.slice(0, BALANCES_PREVIEW)).map((b, i) => {
                    const annualRemaining = b.annual_entitlement + b.accumulated_carry_forward - b.annual_taken;
                    const sickRemaining   = b.sick_entitlement - b.sick_taken;
                    const lowSick         = sickRemaining <= 2 && b.sick_entitlement > 0;
                    return (
                      <tr
                        key={b.employee_id}
                        className={`border-b border-border/60 last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                      >
                        <td className="px-4 py-2.5 text-foreground/40 text-[12px] tabular-nums">{i + 1}</td>
                        <td className="px-4 py-2.5">
                          <p className="font-semibold text-[13px] leading-tight">{b.employee_name}</p>
                          <p className="text-[11px] text-foreground/45 mt-0.5">{b.emp_code}</p>
                          <p className="text-[11px] text-foreground/55 mt-0.5 truncate max-w-[200px]">{b.position}</p>
                        </td>
                        <td className="px-3 py-2.5 text-foreground/60 text-[12px]">{b.department_name}</td>
                        <td className="px-3 py-2.5 text-center">
                          {b.is_probation
                            ? <Badge text="Probation" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" />
                            : <Badge text="Confirmed" className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" />
                          }
                        </td>
                        <td className="px-3 py-2.5 text-center font-semibold tabular-nums">{b.annual_entitlement}</td>
                        <td className="px-3 py-2.5 text-center tabular-nums">
                          {b.accumulated_carry_forward > 0
                            ? <span className="text-blue-600 dark:text-blue-400 font-semibold">{b.accumulated_carry_forward}</span>
                            : <span className="text-foreground/35">—</span>
                          }
                        </td>
                        <td className="px-3 py-2.5 text-center tabular-nums">
                          {b.annual_taken > 0
                            ? <span className="font-semibold text-foreground">{b.annual_taken}</span>
                            : <span className="text-foreground/35">0</span>
                          }
                        </td>
                        <td className="px-3 py-2.5 text-center tabular-nums">
                          <span className={`font-bold ${annualRemaining > 0 ? "text-foreground" : "text-destructive"}`}>
                            {annualRemaining}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center tabular-nums text-foreground/60">
                          {b.sick_entitlement > 0 ? b.sick_entitlement : <span className="text-foreground/30">—</span>}
                        </td>
                        <td className="px-3 py-2.5 text-center tabular-nums">
                          {b.sick_taken > 0
                            ? <span className={`font-semibold ${lowSick ? "text-destructive" : "text-orange-600 dark:text-orange-400"}`}>{b.sick_taken}</span>
                            : <span className="text-foreground/35">0</span>
                          }
                        </td>
                        <td className="px-3 py-2.5 text-center tabular-nums">
                          {b.sick_entitlement > 0
                            ? <span className={`font-bold ${sickRemaining <= 0 ? "text-destructive" : sickRemaining <= 3 ? "text-orange-600" : "text-success"}`}>
                                {sickRemaining}
                              </span>
                            : <span className="text-foreground/30">—</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {filteredBalances.length > BALANCES_PREVIEW && (
            <div className="border-t border-border px-5 py-3 flex items-center justify-between">
              <p className="text-[12px] text-foreground/45">
                {showAllBalances
                  ? `Showing all ${filteredBalances.length} employees`
                  : `Showing ${BALANCES_PREVIEW} of ${filteredBalances.length} employees`}
              </p>
              <button
                onClick={() => setShowAllBalances(v => !v)}
                className="text-[12px] font-semibold text-foreground/70 hover:text-foreground underline underline-offset-2 transition-colors"
              >
                {showAllBalances ? "Show less" : `See all ${filteredBalances.length} employees`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Records view ─────────────────────────────────────────────────── */}
      {view === "records" && (
        <div className="bg-card border border-border rounded-md overflow-hidden">
          {filteredRecords.length === 0 ? (
            <div className="py-16 text-center text-[13px] text-foreground/45">No records match that filter.</div>
          ) : (
            <div className="overflow-auto max-h-[64vh]">
              <table className="w-full text-[13px]">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-border bg-muted">
                    <TH>#</TH>
                    <TH align="left">Employee</TH>
                    <TH align="left">Department</TH>
                    <TH align="center">Leave Type</TH>
                    <TH align="center">Start</TH>
                    <TH align="center">End</TH>
                    <TH align="center">Duration</TH>
                    <TH align="center">Applied</TH>
                    <TH align="center">Status</TH>
                    <TH align="left">Approved By</TH>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords
                    .slice()
                    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
                    .map((r, i) => (
                    <tr
                      key={r.id}
                      className={`border-b border-border/60 last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                    >
                      <td className="px-4 py-2.5 text-foreground/40 text-[12px] tabular-nums">{i + 1}</td>
                      <td className="px-4 py-2.5">
                        <p className="font-semibold leading-tight">{r.employee_name}</p>
                        <p className="text-[11px] text-foreground/45 mt-0.5">{r.emp_code}</p>
                      </td>
                      <td className="px-3 py-2.5 text-foreground/60 text-[12px]">{r.department_name}</td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge
                          text={LEAVE_TYPE_LABELS[r.leave_type]}
                          className={LEAVE_TYPE_COLOURS[r.leave_type]}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-center text-[12px] tabular-nums">{fmtDateShort(r.start_date)}</td>
                      <td className="px-3 py-2.5 text-center text-[12px] tabular-nums">{fmtDateShort(r.end_date)}</td>
                      <td className="px-3 py-2.5 text-center tabular-nums">
                        <span className="font-semibold">{r.duration_days}</span>
                        <span className="text-foreground/45 text-[11px] ml-0.5">d</span>
                      </td>
                      <td className="px-3 py-2.5 text-center text-[12px] text-foreground/55 tabular-nums">
                        {fmtDate(r.applied_date)}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge
                          text={r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                          className={STATUS_COLOURS[r.status]}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-[12px] text-foreground/55">
                        {r.approved_by ?? <span className="text-foreground/30">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Legend ──────────────────────────────────────────────────────── */}
      <div className="mt-8 pt-6 border-t border-border/60">
        <p className="text-[11px] font-display font-semibold tracking-[0.14em] uppercase text-foreground/35 mb-3">Legend</p>
        <div className="flex flex-wrap gap-3">
          {(Object.keys(LEAVE_TYPE_LABELS) as LeaveType[]).map(t => (
            <span key={t} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold ${LEAVE_TYPE_COLOURS[t]}`}>
              {LEAVE_TYPE_LABELS[t]} leave
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-2">
          {(["approved", "pending", "rejected", "cancelled"] as LeaveStatus[]).map(s => (
            <span key={s} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold ${STATUS_COLOURS[s]}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}

// ─── TH helper ───────────────────────────────────────────────────────────────

function TH({ children, align = "center" }: { children?: React.ReactNode; align?: "left" | "center" }) {
  return (
    <th className={`px-3 py-3 font-display font-semibold text-[10px] uppercase tracking-[0.12em] text-foreground/50 ${align === "left" ? "text-left" : "text-center"}`}>
      {children}
    </th>
  );
}
