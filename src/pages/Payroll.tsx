import { useMemo, useState } from "react";
import { useEmployees } from "@/hooks/useEmployees";
import { useAttendance } from "@/hooks/useAttendance";
import { Download, AlertTriangle, Users, Banknote, TrendingDown } from "lucide-react";

// ─── Policy constants ─────────────────────────────────────────────────────────

const BASE_SALARY     = 1500;   // GHS placeholder
const WORKING_DAYS_MO = 21;
const PER_DAY_RATE    = BASE_SALARY / WORKING_DAYS_MO;
const GRACE_MIN       = 15;     // 15-min grace on both clock-in and clock-out

// Shift boundaries (minutes from midnight)
const SHIFT_BOUNDS: Record<string, { startMin: number; endMin: number }> = {
  day:      { startMin: 7 * 60,       endMin: 16 * 60      }, // 07:00 – 16:00
  long_day: { startMin: 7 * 60,       endMin: 19 * 60      }, // 07:00 – 19:00
  morning:  { startMin: 9 * 60,       endMin: 19 * 60      }, // 09:00 – 19:00
  night:    { startMin: 19 * 60,      endMin: 7 * 60 + 1440 }, // 19:00 – 07:00 (+24h)
};

function isLate(clockIn: string, shift: string): boolean {
  const t   = new Date(clockIn);
  const min = t.getHours() * 60 + t.getMinutes();
  // Night shift: clock-in near midnight wraps — normalise to minutes-since-19:00
  const bounds = SHIFT_BOUNDS[shift] ?? SHIFT_BOUNDS.day;
  const cutoff = bounds.startMin + GRACE_MIN;
  if (shift === "night") {
    const adjusted = min < 7 * 60 ? min + 1440 : min; // past-midnight clock-in
    return adjusted > cutoff;
  }
  return min > cutoff;
}

function isEarlyDeparture(clockOut: string, shift: string): boolean {
  const t   = new Date(clockOut);
  const min = t.getHours() * 60 + t.getMinutes();
  // Grace is only on the late side (up to 15 min after shift end = fine).
  // Clocking out before shift end = early departure.
  if (shift === "night") {
    return min < 7 * 60; // before 07:00 next morning
  }
  const bounds = SHIFT_BOUNDS[shift] ?? SHIFT_BOUNDS.day;
  return min < bounds.endMin;
}

function targetHoursForDept(dept_id: string): number {
  if (dept_id === "dept-5") return 180;   // Nursing & Midwifery
  if (dept_id === "dept-4") return 192;   // Medicine
  if (dept_id === "dept-2" || dept_id === "dept-6") return 150; // Allied Health / Pharmacy
  return 168;                             // Administration, Auxiliary (21 days × 8h)
}

// ─── Types ────────────────────────────────────────────────────────────────────

type PTier = "compliant" | "warning" | "minor" | "major";

function pTier(rate: number): PTier {
  if (rate >= 95) return "compliant";
  if (rate >= 85) return "warning";
  if (rate >= 75) return "minor";
  return "major";
}

interface Row {
  id: string;
  name: string;
  emp_code: string;
  dept_name: string;
  dept_id: string;
  position: string;
  scheduled: number;
  fullyAbsent: number;
  lateArrivals: number;
  earlyDepartures: number;
  punctualityRate: number;
  tier: PTier;
  hoursWorked: number;
  hoursTarget: number;
  absenteeismRate: number;
  unapprovedOT: boolean;
  approvedOTh: number;
  flags: string[];
  base: number;
  absentDed: number;
  punctDed: number;
  totalDed: number;
  otBonus: number;
  netPay: number;
}

// ─── Payroll computation ──────────────────────────────────────────────────────

function buildRows(employees: any[], attendance: any[]): Row[] {
  const sampleDays = new Set(attendance.map((a: any) => a.date as string)).size || 7;

  return employees.map(emp => {
    const atts = attendance.filter((a: any) => a.employee_id === emp.id);
    const scheduled    = atts.length;
    const fullyAbsent  = atts.filter((a: any) => a.missed_clock_in && a.missed_clock_out).length;
    const attended     = scheduled - fullyAbsent;

    // Late: clocked in after shift start + 15-min grace (shift-aware)
    const lateArrivals = atts.filter((a: any) =>
      a.clock_in && !a.missed_clock_in && isLate(a.clock_in, a.shift_type)
    ).length;

    // Early departure: clocked out before shift end − 15-min grace (shift-aware)
    const earlyDepartures = atts.filter((a: any) =>
      a.clock_out && !a.missed_clock_out && isEarlyDeparture(a.clock_out, a.shift_type)
    ).length;

    const punctualityRate = attended > 0 ? Math.round(((attended - lateArrivals) / attended) * 100) : 100;
    const tier            = pTier(punctualityRate);
    const hoursWorked     = Number(atts.reduce((s: number, a: any) => s + a.hours_worked, 0).toFixed(1));

    // Scale weekly sample to monthly target proportion
    const fullTarget  = targetHoursForDept(emp.department_id);
    const hoursTarget = Number((fullTarget * (sampleDays / WORKING_DAYS_MO)).toFixed(1));

    const absenteeismRate = scheduled > 0 ? Math.round((fullyAbsent / scheduled) * 100) : 0;

    const unapprovedOT = atts.some((a: any) => a.is_overtime && !a.overtime_approved);
    const approvedOTh  = Number(
      atts
        .filter((a: any) => a.is_overtime && a.overtime_approved)
        .reduce((s: number, a: any) => s + Math.max(0, a.hours_worked - 8), 0)
        .toFixed(1)
    );

    const flags: string[] = [];
    if (lateArrivals >= 3)    flags.push("3+ Late");
    if (earlyDepartures >= 3) flags.push("Early Departure");
    if (fullyAbsent > 0)      flags.push("Absent");
    if (unapprovedOT)         flags.push("Unapproved OT");

    const absentDed = Number((fullyAbsent * PER_DAY_RATE).toFixed(2));
    const punctDed  = tier === "major" ? BASE_SALARY * 0.10 : tier === "minor" ? BASE_SALARY * 0.05 : 0;
    const otBonus   = Number((approvedOTh * (PER_DAY_RATE / 8) * 1.5).toFixed(2));
    const totalDed  = Number((absentDed + punctDed).toFixed(2));
    const netPay    = Number((BASE_SALARY - totalDed + otBonus).toFixed(2));

    return {
      id: emp.id,
      name: `${emp.first_name} ${emp.last_name}`,
      emp_code: emp.emp_code,
      dept_name: emp.department_name,
      dept_id: emp.department_id,
      position: emp.position,
      scheduled,
      fullyAbsent,
      lateArrivals,
      earlyDepartures,
      punctualityRate,
      tier,
      hoursWorked,
      hoursTarget,
      absenteeismRate,
      unapprovedOT,
      approvedOTh,
      flags,
      base: BASE_SALARY,
      absentDed,
      punctDed,
      totalDed,
      otBonus,
      netPay,
    };
  });
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const TIER_CLASS: Record<PTier, string> = {
  compliant: "bg-success/10 text-success border border-success/20",
  warning:   "bg-amc-yellow/15 text-amc-yellow border border-amc-yellow/30",
  minor:     "bg-orange-500/10 text-orange-500 border border-orange-500/20",
  major:     "bg-destructive/10 text-destructive border border-destructive/25",
};

const FLAG_CLASS: Record<string, string> = {
  "3+ Late":         "bg-amc-yellow/15 text-amc-yellow",
  "Early Departure": "bg-amc-yellow/15 text-amc-yellow",
  "Absent":          "bg-destructive/10 text-destructive",
  "Unapproved OT":   "bg-orange-500/10 text-orange-500",
};

function toTitleCase(s: string) {
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Payroll() {
  const { employees } = useEmployees();
  const { attendance } = useAttendance();
  const rows = useMemo(() => buildRows(employees, attendance), [employees, attendance]);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [sort, setSort] = useState<"name" | "net" | "flags">("name");

  const depts = useMemo(() => {
    const d = [...new Set(rows.map(r => r.dept_name))].sort();
    return ["all", ...d];
  }, [rows]);

  const filtered = useMemo(() => {
    return rows
      .filter(r =>
        (deptFilter === "all" || r.dept_name === deptFilter) &&
        (search === "" ||
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.emp_code.toLowerCase().includes(search.toLowerCase()))
      )
      .sort((a, b) => {
        if (sort === "net")   return b.netPay - a.netPay;
        if (sort === "flags") return b.flags.length - a.flags.length;
        return a.name.localeCompare(b.name);
      });
  }, [rows, search, deptFilter, sort]);

  // KPIs
  const totalPayroll    = filtered.reduce((s, r) => s + r.netPay, 0);
  const totalDeductions = filtered.reduce((s, r) => s + r.totalDed, 0);
  const hrFlagged       = filtered.filter(r => r.flags.length > 0).length;
  const compliant       = filtered.filter(r => r.tier === "compliant").length;
  const compliantPct    = filtered.length > 0 ? Math.round((compliant / filtered.length) * 100) : 0;

  function exportCSV() {
    const headers = [
      "Name", "ID", "Department", "Position",
      "Punctuality %", "Tier", "Late Arrivals", "Absent Days", "Absenteeism %",
      "Hours Worked", "Hours Target", "Unapproved OT",
      "Flags", "Base (GHS)", "Deductions (GHS)", "OT Bonus (GHS)", "Net Pay (GHS)",
    ];
    const csvRows = [
      headers.join(","),
      ...filtered.map(r => [
        `"${toTitleCase(r.name)}"`, r.emp_code, `"${r.dept_name}"`, `"${toTitleCase(r.position)}"`,
        r.punctualityRate, r.tier, r.lateArrivals, r.fullyAbsent, r.absenteeismRate,
        r.hoursWorked, r.hoursTarget, r.unapprovedOT ? "Yes" : "No",
        `"${r.flags.join("; ")}"`,
        r.base.toFixed(2), r.totalDed.toFixed(2), r.otBonus.toFixed(2), r.netPay.toFixed(2),
      ].join(",")),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "amc-payroll.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-[1300px] mx-auto px-6 md:px-10 pt-10 md:pt-14 pb-20">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="mb-10 pb-6 border-b border-foreground/10">
        <p className="text-[12px] tracking-[0.16em] uppercase text-foreground/45 font-display font-semibold mb-2">
          Payroll
        </p>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display font-bold text-[34px] md:text-[40px] tracking-tight leading-tight">
              Payroll summary
            </h1>
            <p className="text-[13px] text-foreground/55 mt-1.5 max-w-xl">
              AMC Payroll Policy · 15-min grace period · Salaries in GHS · Based on 7-day sample window
            </p>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-card hover:bg-sidebar-accent/60 text-[13px] font-display font-semibold transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </header>

      {/* ── KPI cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <KpiCard
          label="Total payroll"
          value={`GHS ${Math.round(totalPayroll).toLocaleString()}`}
          icon={<Banknote className="h-4 w-4" />}
        />
        <KpiCard
          label="Total deductions"
          value={`GHS ${Math.round(totalDeductions).toLocaleString()}`}
          icon={<TrendingDown className="h-4 w-4" />}
          danger
        />
        <KpiCard
          label="HR flagged"
          value={`${hrFlagged} staff`}
          icon={<AlertTriangle className="h-4 w-4" />}
          danger={hrFlagged > 0}
        />
        <KpiCard
          label="Punctuality-compliant"
          value={`${compliantPct}%`}
          sub={`${compliant} of ${filtered.length}`}
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="search"
          placeholder="Search name or ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] max-w-xs px-3 py-2 rounded-md border border-border bg-card text-[13px] placeholder:text-foreground/40 focus:outline-none focus:ring-1 focus:ring-foreground/30"
        />
        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          className="px-3 py-2 rounded-md border border-border bg-card text-[13px] focus:outline-none"
        >
          {depts.map(d => (
            <option key={d} value={d}>{d === "all" ? "All departments" : d}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as "name" | "net" | "flags")}
          className="px-3 py-2 rounded-md border border-border bg-card text-[13px] focus:outline-none"
        >
          <option value="name">Sort: Name A–Z</option>
          <option value="net">Sort: Net pay ↓</option>
          <option value="flags">Sort: Flags ↓</option>
        </select>
        <span className="text-[12px] text-foreground/45 ml-auto">{filtered.length} employees</span>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="border border-border rounded-md overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border bg-sidebar-accent/40">
                <Th>Employee</Th>
                <Th>Department</Th>
                <Th>Punctuality</Th>
                <Th>Hours worked</Th>
                <Th>Absent</Th>
                <Th>Flags</Th>
                <Th align="right">Base</Th>
                <Th align="right">Deductions</Th>
                <Th align="right">Net pay</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr
                  key={r.id}
                  className={`border-b border-border/60 last:border-0 hover:bg-sidebar-accent/20 transition-colors ${
                    i % 2 !== 0 ? "bg-sidebar-accent/10" : ""
                  }`}
                >
                  {/* Employee */}
                  <td className="px-4 py-3 min-w-[180px]">
                    <p className="font-display font-semibold text-foreground leading-tight text-[12px]">
                      {toTitleCase(r.name)}
                    </p>
                    <p className="text-foreground/40 text-[11px] mt-0.5">{r.emp_code}</p>
                  </td>

                  {/* Department */}
                  <td className="px-4 py-3 min-w-[150px]">
                    <p className="text-foreground/75 leading-tight">{r.dept_name}</p>
                    <p className="text-foreground/40 text-[11px] mt-0.5 max-w-[160px] truncate">
                      {toTitleCase(r.position)}
                    </p>
                  </td>

                  {/* Punctuality */}
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-display font-semibold ${TIER_CLASS[r.tier]}`}>
                      {r.punctualityRate}%
                    </span>
                    <p className="text-foreground/40 text-[11px] mt-1">
                      {r.lateArrivals} late arrival{r.lateArrivals !== 1 ? "s" : ""}
                    </p>
                  </td>

                  {/* Hours */}
                  <td className="px-4 py-3 tabular-nums">
                    <p className={`font-display font-semibold ${r.hoursWorked < r.hoursTarget ? "text-destructive" : "text-success"}`}>
                      {r.hoursWorked}h
                    </p>
                    <p className="text-foreground/40 text-[11px] mt-0.5">of {r.hoursTarget}h target</p>
                  </td>

                  {/* Absent */}
                  <td className="px-4 py-3 tabular-nums">
                    <p className={`font-display font-semibold ${r.fullyAbsent > 0 ? "text-destructive" : "text-foreground/40"}`}>
                      {r.fullyAbsent} day{r.fullyAbsent !== 1 ? "s" : ""}
                    </p>
                    <p className="text-foreground/40 text-[11px] mt-0.5">{r.absenteeismRate}% rate</p>
                  </td>

                  {/* Flags */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.flags.length === 0 ? (
                        <span className="text-foreground/25 text-[11px]">—</span>
                      ) : r.flags.map(f => (
                        <span
                          key={f}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-display font-semibold ${FLAG_CLASS[f] ?? "bg-foreground/10 text-foreground/70"}`}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Base */}
                  <td className="px-4 py-3 text-right tabular-nums text-foreground/55">
                    GHS {r.base}
                  </td>

                  {/* Deductions */}
                  <td className="px-4 py-3 text-right tabular-nums">
                    {r.totalDed > 0 ? (
                      <span className="text-destructive font-display font-semibold">
                        −{r.totalDed.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-foreground/30">—</span>
                    )}
                    {r.otBonus > 0 && (
                      <p className="text-success text-[11px] mt-0.5">+{r.otBonus.toFixed(2)} OT</p>
                    )}
                  </td>

                  {/* Net pay */}
                  <td className="px-4 py-3 text-right">
                    <span className="font-display font-bold tabular-nums text-foreground text-[13px]">
                      GHS {r.netPay.toFixed(0)}
                    </span>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-foreground/40 text-[13px]">
                    No employees match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Policy footnote ────────────────────────────────────────────────── */}
      <div className="mt-8 p-4 border border-border/50 rounded-md bg-sidebar-accent/15">
        <p className="text-[11px] text-foreground/50 leading-relaxed">
          <strong className="text-foreground/65">AMC Payroll Policy —</strong>{" "}
          Punctuality: ≥95% no action · 85–94% warning · 75–84% minor deduction (5% of base) · &lt;75% major deduction (10% of base).{" "}
          Absenteeism: each fully absent shift deducts GHS {PER_DAY_RATE.toFixed(2)} (1/21st of monthly base).{" "}
          Overtime: pre-approved OT paid at 1.5× hourly rate; unapproved OT flagged and unpaid.{" "}
          Base salary GHS 1,500 is a placeholder — actual salaries will be imported from HR system.{" "}
          Hour targets: Nurses 180h · Doctors 192h · Lab/Pharmacy 150h · Others 168h (monthly); data covers a 7-weekday sample.
        </p>
      </div>

    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon, danger = false,
}: {
  label: string; value: string; sub?: string; icon: React.ReactNode; danger?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-md px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] tracking-[0.14em] uppercase text-foreground/45 font-display font-semibold">
          {label}
        </p>
        <span className={danger ? "text-destructive/60" : "text-foreground/30"}>{icon}</span>
      </div>
      <p className={`font-display font-bold text-[22px] tabular-nums leading-none ${danger ? "text-destructive" : "text-foreground"}`}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-foreground/40 mt-1">{sub}</p>}
    </div>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th className={`px-4 py-3 text-[10px] tracking-[0.12em] uppercase text-foreground/45 font-display font-semibold whitespace-nowrap ${align === "right" ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}
