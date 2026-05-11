import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Download, FileBarChart2, Users, Clock, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmployees } from "@/hooks/useEmployees";
import { useAttendance } from "@/hooks/useAttendance";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function downloadCSV(filename: string, sections: { title: string; headers: string[]; rows: string[][] }[]) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines: string[] = [];
  sections.forEach(s => {
    lines.push(escape(s.title));
    lines.push(s.headers.map(escape).join(","));
    s.rows.forEach(r => lines.push(r.map(escape).join(",")));
    lines.push("");
  });
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

function pct(n: number, d: number) {
  return d === 0 ? "0%" : `${((n / d) * 100).toFixed(1)}%`;
}

function fmt(n: number) {
  return `GH₵ ${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// ─── Print ───────────────────────────────────────────────────────────────────

function printCeoReport(
  period: string,
  kpis: { label: string; value: string; sub: string }[],
  deptRows: string[][],
  flagged: string[][],
  creditRows: string[][],
  creditTotals: string[],
) {
  const tableHTML = (headers: string[], rows: string[][], footer?: string[]) => `
    <table>
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>
        ${rows.map((r, i) => `<tr class="${i % 2 === 0 ? "alt" : ""}">${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}
        ${footer ? `<tr class="total"><td colspan="${footer.length}">&nbsp;</td></tr><tr class="total">${footer.map(c => `<td>${c}</td>`).join("")}</tr>` : ""}
      </tbody>
    </table>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head>
    <title>CEO Attendance Report — ${period}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; padding: 28px 32px; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #1e3a5f; padding-bottom: 14px; }
      .header-left h1 { font-size: 18px; font-weight: 700; color: #1e3a5f; }
      .header-left p { font-size: 11px; color: #666; margin-top: 3px; }
      .header-right { text-align: right; font-size: 10px; color: #666; line-height: 1.6; }
      .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
      .kpi { border: 1px solid #ddd; border-radius: 6px; padding: 10px 12px; }
      .kpi-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; }
      .kpi-value { font-size: 20px; font-weight: 700; color: #1e3a5f; margin: 3px 0; }
      .kpi-sub { font-size: 9px; color: #999; }
      h2 { font-size: 12px; font-weight: 700; color: #1e3a5f; margin: 18px 0 8px; text-transform: uppercase; letter-spacing: 0.06em; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
      th { background: #1e3a5f; color: white; padding: 5px 8px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; }
      td { padding: 5px 8px; font-size: 10px; border-bottom: 1px solid #eee; }
      tr.alt td { background: #f8f8f8; }
      tr.total td { font-weight: 700; background: #eef2f7; }
      .flag { color: #c0392b; font-weight: 600; }
      .good { color: #27ae60; font-weight: 600; }
      .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 9px; color: #999; display: flex; justify-content: space-between; }
      button { display: none; }
      @media print { button { display: none !important; } }
    </style>
  </head><body>
    <button onclick="window.print()" style="display:block;margin-bottom:16px;padding:6px 16px;background:#1e3a5f;color:white;border:none;border-radius:4px;cursor:pointer;font-size:11px;">🖨 Print / Save as PDF</button>
    <div class="header">
      <div class="header-left">
        <h1>Accra Medical Centre</h1>
        <p>CEO Attendance & Workforce Report — ${period}</p>
      </div>
      <div class="header-right">
        <strong>CONFIDENTIAL</strong><br/>
        Generated: ${new Date().toLocaleString("en-US")}<br/>
        Accra Medical Centre
      </div>
    </div>

    <div class="kpis">
      ${kpis.map(k => `<div class="kpi"><div class="kpi-label">${k.label}</div><div class="kpi-value">${k.value}</div><div class="kpi-sub">${k.sub}</div></div>`).join("")}
    </div>

    <h2>Department Performance</h2>
    ${tableHTML(
      ["Department", "Staff", "Att. Records", "Missed In", "Missed Out", "Punctuality", "OT Records", "Total Deductions", "Net Credits"],
      deptRows
    )}

    <h2>Attendance Concerns — Missed Punches</h2>
    ${flagged.length === 0
      ? "<p style='color:#27ae60;font-size:10px;margin-bottom:12px;'>✓ No employees with multiple missed punches this period.</p>"
      : tableHTML(["Employee", "Code", "Department", "Missed Clock-Ins", "Missed Clock-Outs", "Total Misses", "Est. Deduction"], flagged)}

    <h2>Credit & Payroll Summary</h2>
    ${tableHTML(
      ["Department", "Employees", "Initial Credits", "Deductions", "OT Bonuses", "Net Credits", "Avg Credit / Employee"],
      creditRows,
      creditTotals
    )}

    <div class="footer">
      <span>Accra Medical Centre — Workforce Attendance System</span>
      <span>CONFIDENTIAL — For CEO Use Only</span>
    </div>
  </body></html>`);
  win.document.close();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CeoReport() {
  const navigate = useNavigate();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1));
  const [selectedYear,  setSelectedYear]  = useState(String(now.getFullYear()));

  const period = `${MONTHS[parseInt(selectedMonth) - 1]} ${selectedYear}`;

  const { employees, departments } = useEmployees();
  const { attendance, credits }    = useAttendance({
    month: parseInt(selectedMonth),
    year:  parseInt(selectedYear),
  });

  // ── Per-department aggregations ──────────────────────────────────────────
  const deptStats = useMemo(() => {
    return departments.map(dept => {
      const emps   = employees.filter(e => e.department_id === dept.id);
      const empIds = new Set(emps.map(e => e.id));
      const att    = attendance.filter(a => empIds.has(a.employee_id));
      const cred   = credits.filter(c => empIds.has(c.employee_id));

      const missedIn  = att.filter(a => a.missed_clock_in).length;
      const missedOut = att.filter(a => a.missed_clock_out).length;
      const otCount   = att.filter(a => a.is_overtime).length;
      const punctual  = att.filter(a => !a.missed_clock_in).length;

      const totalDeductions = cred.reduce((s, c) => s + (c.deductions ?? 0), 0);
      const totalOtBonus    = cred.reduce((s, c) => s + (c.overtime_credits ?? 0), 0);
      const initialCredit   = cred.reduce((s, c) => s + (c.initial_credit ?? 0), 0);
      const netCredit       = cred.reduce((s, c) => s + (c.final_credit ?? 0), 0);

      return {
        dept,
        staffCount: emps.length,
        attCount:   att.length,
        missedIn,
        missedOut,
        otCount,
        punctuality: att.length > 0 ? (punctual / att.length) * 100 : 0,
        totalDeductions,
        totalOtBonus,
        initialCredit,
        netCredit,
      };
    });
  }, [departments, employees, attendance, credits]);

  // ── Global KPIs ──────────────────────────────────────────────────────────
  const global = useMemo(() => {
    const totalStaff      = employees.length;
    const totalAtt        = attendance.length;
    const totalMissedIn   = attendance.filter(a => a.missed_clock_in).length;
    const totalMissedOut  = attendance.filter(a => a.missed_clock_out).length;
    const totalOt         = attendance.filter(a => a.is_overtime).length;
    const punctual        = attendance.filter(a => !a.missed_clock_in).length;
    const punctualityRate = totalAtt > 0 ? (punctual / totalAtt) * 100 : 0;
    const totalDeductions = credits.reduce((s, c) => s + (c.deductions ?? 0), 0);
    const totalOtBonus    = credits.reduce((s, c) => s + (c.overtime_credits ?? 0), 0);
    const netCredit       = credits.reduce((s, c) => s + (c.final_credit ?? 0), 0);
    return { totalStaff, totalAtt, totalMissedIn, totalMissedOut, totalOt, punctualityRate, totalDeductions, totalOtBonus, netCredit };
  }, [employees, attendance, credits]);

  // ── Flagged employees (any missed punch) ─────────────────────────────────
  const flaggedEmployees = useMemo(() => {
    return employees
      .map(emp => {
        const att       = attendance.filter(a => a.employee_id === emp.id);
        const missedIn  = att.filter(a => a.missed_clock_in).length;
        const missedOut = att.filter(a => a.missed_clock_out).length;
        const total     = missedIn + missedOut;
        const deduction = missedIn * 100 + (missedOut > 0 && missedIn > 0 ? 100 : 0);
        return { emp, missedIn, missedOut, total, deduction };
      })
      .filter(x => x.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [employees, attendance]);

  // ── Build export rows ────────────────────────────────────────────────────
  const deptRows: string[][] = deptStats.map(d => [
    d.dept.name,
    String(d.staffCount),
    String(d.attCount),
    String(d.missedIn),
    String(d.missedOut),
    `${d.punctuality.toFixed(1)}%`,
    String(d.otCount),
    fmt(d.totalDeductions),
    fmt(d.netCredit),
  ]);

  const flaggedRows: string[][] = flaggedEmployees.map(x => [
    `${x.emp.first_name} ${x.emp.last_name}`,
    x.emp.emp_code ?? "—",
    x.emp.department_name ?? "—",
    String(x.missedIn),
    String(x.missedOut),
    String(x.total),
    `GH₵ ${x.deduction}`,
  ]);

  const creditRows: string[][] = deptStats.map(d => [
    d.dept.name,
    String(d.staffCount),
    fmt(d.initialCredit),
    fmt(d.totalDeductions),
    fmt(d.totalOtBonus),
    fmt(d.netCredit),
    d.staffCount > 0 ? fmt(Math.round(d.netCredit / d.staffCount)) : "—",
  ]);

  const creditTotals = [
    "TOTAL",
    String(employees.length),
    fmt(credits.reduce((s, c) => s + (c.initial_credit ?? 0), 0)),
    fmt(global.totalDeductions),
    fmt(global.totalOtBonus),
    fmt(global.netCredit),
    fmt(Math.round(global.netCredit / Math.max(employees.length, 1))),
  ];

  const kpisForPrint = [
    { label: "Total Staff",   value: String(global.totalStaff),              sub: `${departments.length} departments` },
    { label: "Punctuality",   value: `${global.punctualityRate.toFixed(1)}%`, sub: "on-time clock-ins" },
    { label: "Total Deductions", value: fmt(global.totalDeductions),          sub: "missed punch penalties" },
    { label: "OT Records",    value: String(global.totalOt),                  sub: `${fmt(global.totalOtBonus)} in bonuses` },
  ];

  const handlePrint = () => printCeoReport(period, kpisForPrint, deptRows, flaggedRows, creditRows, creditTotals);

  const handleDownload = () => downloadCSV(
    `ceo_report_${period.replace(" ", "_")}.csv`,
    [
      { title: `CEO Report — ${period}`,           headers: ["Metric", "Value"],                                                    rows: kpisForPrint.map(k => [k.label, k.value]) },
      { title: "Department Performance",           headers: ["Department","Staff","Att. Records","Missed In","Missed Out","Punctuality","OT Records","Deductions","Net Credits"], rows: deptRows },
      { title: "Attendance Concerns",              headers: ["Employee","Code","Department","Missed In","Missed Out","Total","Est. Deduction"], rows: flaggedRows },
      { title: "Credit & Payroll Summary",         headers: ["Department","Employees","Initial Credits","Deductions","OT Bonuses","Net Credits","Avg/Employee"], rows: [...creditRows, creditTotals] },
    ]
  );

  const years = ["2025", "2026", "2027"];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">CEO Report</h1>
              <Badge variant="secondary" className="text-[10px] tracking-wide uppercase">Confidential</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Full workforce attendance summary for executive review</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownload}>
            <Download className="h-3.5 w-3.5" /> Download CSV
          </Button>
          <Button size="sm" className="gap-1.5" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5" /> Print / PDF
          </Button>
        </div>
      </div>

      {/* ── Period selector ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Reporting period:</span>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[100px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <Badge variant="outline" className="h-7">{period}</Badge>
      </div>

      {/* ── KPI banner ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Staff",      value: global.totalStaff,                            display: String(global.totalStaff),              sub: `${departments.length} departments`,     icon: Users,         color: "text-primary",     bg: "bg-primary/10" },
          { label: "Punctuality Rate", value: global.punctualityRate,                       display: `${global.punctualityRate.toFixed(1)}%`, sub: "on-time clock-ins",                         icon: TrendingUp,    color: global.punctualityRate >= 85 ? "text-emerald-600" : "text-destructive", bg: global.punctualityRate >= 85 ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-destructive/10" },
          { label: "Total Deductions", value: global.totalDeductions,                       display: fmt(global.totalDeductions),            sub: "missed punch penalties",                    icon: TrendingDown,  color: "text-destructive",  bg: "bg-destructive/10" },
          { label: "Overtime Records", value: global.totalOt,                               display: String(global.totalOt),                 sub: `${fmt(global.totalOtBonus)} in bonuses`,    icon: Clock,         color: "text-amber-600",    bg: "bg-amber-50 dark:bg-amber-950/30" },
        ].map(k => (
          <Card key={k.label} className="p-4">
            <div className="flex items-start gap-3">
              <div className={`h-9 w-9 rounded-lg ${k.bg} flex items-center justify-center shrink-0`}>
                <k.icon className={`h-4 w-4 ${k.color}`} />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">{k.label}</p>
                <p className={`text-xl font-bold ${k.color}`}>{k.display}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{k.sub}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Separator />

      {/* ── Department performance table ─────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileBarChart2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Department Performance</h2>
        </div>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60 border-b">
                  <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Department</th>
                  <th className="text-center px-3 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Staff</th>
                  <th className="text-center px-3 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Records</th>
                  <th className="text-center px-3 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Missed In</th>
                  <th className="text-center px-3 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Missed Out</th>
                  <th className="text-center px-3 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Punctuality</th>
                  <th className="text-center px-3 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">OT</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Deductions</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Net Credits</th>
                </tr>
              </thead>
              <tbody>
                {deptStats.map((d, i) => (
                  <tr key={d.dept.id} className={`border-b last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                    <td className="px-4 py-3 font-medium">{d.dept.name}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">{d.staffCount}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">{d.attCount}</td>
                    <td className="px-3 py-3 text-center">
                      {d.missedIn > 0
                        ? <span className="text-destructive font-semibold">{d.missedIn}</span>
                        : <span className="text-emerald-600">0</span>}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {d.missedOut > 0
                        ? <span className="text-destructive font-semibold">{d.missedOut}</span>
                        : <span className="text-emerald-600">0</span>}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`font-semibold ${d.punctuality >= 85 ? "text-emerald-600" : d.punctuality >= 70 ? "text-amber-600" : "text-destructive"}`}>
                        {d.punctuality.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center text-amber-600 font-medium">{d.otCount}</td>
                    <td className="px-4 py-3 text-right text-destructive font-medium">{fmt(d.totalDeductions)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{fmt(d.netCredit)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 border-t-2">
                  <td className="px-4 py-3 font-bold">Total</td>
                  <td className="px-3 py-3 text-center font-bold">{global.totalStaff}</td>
                  <td className="px-3 py-3 text-center font-bold">{global.totalAtt}</td>
                  <td className="px-3 py-3 text-center font-bold text-destructive">{global.totalMissedIn}</td>
                  <td className="px-3 py-3 text-center font-bold text-destructive">{global.totalMissedOut}</td>
                  <td className="px-3 py-3 text-center font-bold">{global.punctualityRate.toFixed(1)}%</td>
                  <td className="px-3 py-3 text-center font-bold text-amber-600">{global.totalOt}</td>
                  <td className="px-4 py-3 text-right font-bold text-destructive">{fmt(global.totalDeductions)}</td>
                  <td className="px-4 py-3 text-right font-bold">{fmt(global.netCredit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>

      {/* ── Attendance concerns ──────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <h2 className="text-base font-semibold">Attendance Concerns</h2>
          <Badge variant="destructive" className="text-[10px]">{flaggedEmployees.length} flagged</Badge>
        </div>

        {flaggedEmployees.length === 0 ? (
          <Card className="p-6 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <p className="text-sm text-muted-foreground">No employees with missed punches this period.</p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/60 border-b">
                    <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Employee</th>
                    <th className="text-left px-3 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Code</th>
                    <th className="text-left px-3 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Department</th>
                    <th className="text-center px-3 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Missed In</th>
                    <th className="text-center px-3 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Missed Out</th>
                    <th className="text-center px-3 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Total</th>
                    <th className="text-right px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Est. Deduction</th>
                  </tr>
                </thead>
                <tbody>
                  {flaggedEmployees.map((x, i) => (
                    <tr key={x.emp.id} className={`border-b last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                      <td className="px-4 py-2.5 font-medium">{x.emp.first_name} {x.emp.last_name}</td>
                      <td className="px-3 py-2.5 text-muted-foreground text-xs">{x.emp.emp_code ?? "—"}</td>
                      <td className="px-3 py-2.5 text-muted-foreground text-xs">{x.emp.department_name ?? "—"}</td>
                      <td className="px-3 py-2.5 text-center">
                        {x.missedIn > 0 ? <span className="text-destructive font-semibold">{x.missedIn}</span> : <span className="text-muted-foreground">0</span>}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {x.missedOut > 0 ? <span className="text-destructive font-semibold">{x.missedOut}</span> : <span className="text-muted-foreground">0</span>}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-destructive">{x.total}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-destructive">GH₵ {x.deduction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* ── Credit & payroll summary ─────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Credit & Payroll Summary</h2>
        </div>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60 border-b">
                  <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Department</th>
                  <th className="text-center px-3 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Employees</th>
                  <th className="text-right px-3 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Initial Credits</th>
                  <th className="text-right px-3 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Deductions</th>
                  <th className="text-right px-3 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">OT Bonuses</th>
                  <th className="text-right px-3 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Net Credits</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Avg / Employee</th>
                </tr>
              </thead>
              <tbody>
                {deptStats.map((d, i) => (
                  <tr key={d.dept.id} className={`border-b last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                    <td className="px-4 py-3 font-medium">{d.dept.name}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">{d.staffCount}</td>
                    <td className="px-3 py-3 text-right text-muted-foreground">{fmt(d.initialCredit)}</td>
                    <td className="px-3 py-3 text-right text-destructive font-medium">{fmt(d.totalDeductions)}</td>
                    <td className="px-3 py-3 text-right text-emerald-600 font-medium">{fmt(d.totalOtBonus)}</td>
                    <td className="px-3 py-3 text-right font-semibold">{fmt(d.netCredit)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {d.staffCount > 0 ? fmt(Math.round(d.netCredit / d.staffCount)) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 border-t-2">
                  <td className="px-4 py-3 font-bold">Total</td>
                  <td className="px-3 py-3 text-center font-bold">{employees.length}</td>
                  <td className="px-3 py-3 text-right font-bold">{fmt(credits.reduce((s, c) => s + (c.initial_credit ?? 0), 0))}</td>
                  <td className="px-3 py-3 text-right font-bold text-destructive">{fmt(global.totalDeductions)}</td>
                  <td className="px-3 py-3 text-right font-bold text-emerald-600">{fmt(global.totalOtBonus)}</td>
                  <td className="px-3 py-3 text-right font-bold">{fmt(global.netCredit)}</td>
                  <td className="px-4 py-3 text-right font-bold">{fmt(Math.round(global.netCredit / Math.max(employees.length, 1)))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>

      {/* ── Footer note ──────────────────────────────────────────────────── */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-muted/40 border text-xs text-muted-foreground">
        <FileBarChart2 className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          This report is generated from the AMC Attendance System and is intended for executive review only.
          Use <strong>Print / PDF</strong> to save a formatted copy, or <strong>Download CSV</strong> to open in Excel.
          Deduction policy: GH₵ 100 per missed clock-in, GH₵ 100 per missed clock-out (max GH₵ 200/day).
        </p>
      </div>
    </div>
  );
}
