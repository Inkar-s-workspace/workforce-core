import { useState, useMemo } from "react";
import { ArrowLeft, Download, FileSpreadsheet, FileText, Calendar, Users, Clock, TrendingDown, CheckCircle2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { mockDepartments, mockEmployees, mockAttendance, mockCredits } from "@/data/mockData";

// ─── CSV helper ───────────────────────────────────────────────────────────────

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = [
    headers.map(escape).join(","),
    ...rows.map(r => r.map(escape).join(",")),
  ].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Print helper — opens a formatted print window ───────────────────────────

function printReport(title: string, headers: string[], rows: string[][]) {
  const table = `
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:11px">
      <thead style="background:#1e3a5f;color:white">
        <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${rows.map((r, i) => `
          <tr style="background:${i % 2 === 0 ? "#f9f9f9" : "white"}">
            ${r.map(c => `<td>${c}</td>`).join("")}
          </tr>`).join("")}
      </tbody>
    </table>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html><html><head>
    <title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      h1 { font-size: 16px; margin-bottom: 4px; }
      p  { font-size: 11px; color: #666; margin-bottom: 16px; }
      @media print { button { display: none; } }
    </style>
    </head><body>
    <h1>Accra Medical Centre — ${title}</h1>
    <p>Generated: ${new Date().toLocaleString("en-US")} · ${rows.length} records</p>
    <button onclick="window.print()" style="margin-bottom:12px;padding:6px 14px;background:#1e3a5f;color:white;border:none;border-radius:4px;cursor:pointer">🖨 Print</button>
    ${table}
    </body></html>`);
  win.document.close();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Reports() {
  const navigate = useNavigate();
  const [selectedDept, setSelectedDept] = useState("all");
  const [downloaded, setDownloaded]     = useState<string[]>([]);

  const filteredEmployees = useMemo(() =>
    selectedDept === "all"
      ? mockEmployees
      : mockEmployees.filter(e => e.department_id === selectedDept),
    [selectedDept]);

  const employeeIds = useMemo(() => new Set(filteredEmployees.map(e => e.id)), [filteredEmployees]);

  // ── Summary stats for the selected filter ────────────────────────────────
  const stats = useMemo(() => {
    const att     = mockAttendance.filter(a => employeeIds.has(a.employee_id));
    const credits = mockCredits.filter(c => employeeIds.has(c.employee_id));
    return {
      employees:   filteredEmployees.length,
      attRecords:  att.length,
      missedPunch: att.filter(a => a.missed_clock_in || a.missed_clock_out).length,
      deductions:  credits.reduce((s, c) => s + c.deductions, 0),
    };
  }, [employeeIds, filteredEmployees]);

  function markDownloaded(key: string) {
    setDownloaded(prev => prev.includes(key) ? prev : [...prev, key]);
  }

  // ── Export handlers ───────────────────────────────────────────────────────

  function getAttRows() {
    return mockAttendance
      .filter(a => employeeIds.has(a.employee_id))
      .map(r => {
        const emp = mockEmployees.find(e => e.id === r.employee_id);
        return [
          `${emp?.first_name ?? ""} ${emp?.last_name ?? ""}`,
          emp?.emp_code ?? "",
          emp?.department_name ?? "",
          r.date,
          r.clock_in  ? new Date(r.clock_in).toLocaleTimeString("en-US",  { hour: "2-digit", minute: "2-digit" }) : "MISSING",
          r.clock_out ? new Date(r.clock_out).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "MISSING",
          r.hours_worked > 0 ? `${r.hours_worked.toFixed(2)}` : "0",
          r.missed_clock_in  ? "YES" : "No",
          r.missed_clock_out ? "YES" : "No",
          r.is_overtime ? "YES" : "No",
          r.overtime_approved ? "Approved" : r.is_overtime ? "Pending" : "N/A",
        ];
      });
  }

  function getCreditRows() {
    return mockCredits
      .filter(c => employeeIds.has(c.employee_id))
      .map(r => {
        const emp = mockEmployees.find(e => e.id === r.employee_id);
        return [
          `${emp?.first_name ?? ""} ${emp?.last_name ?? ""}`,
          emp?.emp_code ?? "",
          emp?.department_name ?? "",
          `${r.month}/${r.year}`,
          `GH₵ ${r.initial_credit}`,
          `GH₵ ${r.deductions}`,
          `GH₵ ${r.overtime_credits}`,
          `GH₵ ${r.final_credit}`,
          `${r.total_hours_worked.toFixed(1)}h`,
          `180h`,
        ];
      });
  }

  function getEmployeeRows() {
    return filteredEmployees.map(e => [
      `${e.first_name} ${e.last_name}`,
      e.emp_code,
      e.department_name,
      e.position ?? "—",
      e.is_department_head ? "Yes" : "No",
    ]);
  }

  const ATT_HEADERS     = ["Employee", "Code", "Department", "Date", "Clock In", "Clock Out", "Hours", "Missed In", "Missed Out", "Overtime", "OT Status"];
  const CREDIT_HEADERS  = ["Employee", "Code", "Department", "Month/Year", "Initial Credit", "Deductions", "OT Bonus", "Final Credit", "Hours Worked", "Target"];
  const EMP_HEADERS     = ["Full Name", "Employee Code", "Department", "Position", "Dept Head"];

  const deptLabel = selectedDept === "all"
    ? "All Departments"
    : mockDepartments.find(d => d.id === selectedDept)?.name ?? "";

  const reports = [
    {
      key:     "attendance",
      title:   "Attendance Records",
      desc:    "Clock-in/out times, missed punches, overtime status for every shift",
      icon:    Clock,
      color:   "text-primary",
      bg:      "bg-primary/10",
      records: stats.attRecords,
      unit:    "records",
      onCSV:   () => { downloadCSV(`attendance_${deptLabel}_${new Date().toISOString().split("T")[0]}.csv`, ATT_HEADERS, getAttRows()); markDownloaded("attendance"); },
      onPrint: () => printReport("Attendance Records", ATT_HEADERS, getAttRows()),
    },
    {
      key:     "credits",
      title:   "Credit & Deduction Report",
      desc:    "Monthly credit balances, salary deductions, overtime bonuses in GH₵",
      icon:    TrendingDown,
      color:   "text-destructive",
      bg:      "bg-destructive/10",
      records: filteredEmployees.length,
      unit:    "employees",
      onCSV:   () => { downloadCSV(`credits_${deptLabel}_${new Date().toISOString().split("T")[0]}.csv`, CREDIT_HEADERS, getCreditRows()); markDownloaded("credits"); },
      onPrint: () => printReport("Credit & Deduction Report", CREDIT_HEADERS, getCreditRows()),
    },
    {
      key:     "employees",
      title:   "Employee Directory",
      desc:    "Staff list with codes, departments, positions, and department heads",
      icon:    Users,
      color:   "text-success",
      bg:      "bg-success/10",
      records: filteredEmployees.length,
      unit:    "employees",
      onCSV:   () => { downloadCSV(`employees_${deptLabel}_${new Date().toISOString().split("T")[0]}.csv`, EMP_HEADERS, getEmployeeRows()); markDownloaded("employees"); },
      onPrint: () => printReport("Employee Directory", EMP_HEADERS, getEmployeeRows()),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports & Exports</h1>
          <p className="text-sm text-muted-foreground">Download or print attendance data</p>
        </div>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium text-muted-foreground">Filter by:</span>
        </div>
        <Select value={selectedDept} onValueChange={setSelectedDept}>
          <SelectTrigger className="w-[200px] h-9">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {mockDepartments.map(d => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedDept !== "all" && (
          <Badge variant="secondary" className="h-7 px-2">
            {deptLabel}
          </Badge>
        )}
      </div>

      {/* ── Summary stats ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Employees",      value: stats.employees,   icon: Users,         color: "text-primary" },
          { label: "Att. Records",   value: stats.attRecords,  icon: FileSpreadsheet, color: "text-foreground" },
          { label: "Missed Punches", value: stats.missedPunch, icon: Clock,         color: stats.missedPunch > 0 ? "text-destructive" : "text-success" },
          { label: "Total Deductions", value: `GH₵${stats.deductions.toLocaleString()}`, icon: TrendingDown, color: stats.deductions > 0 ? "text-destructive" : "text-success" },
        ].map(s => (
          <div key={s.label} className="bg-muted/40 rounded-xl p-3 flex items-center gap-3">
            <s.icon className={`h-4 w-4 shrink-0 ${s.color}`} />
            <div>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
              <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <Separator />

      {/* ── Report cards ────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {reports.map(r => (
          <Card key={r.key} className="p-5">
            <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
              {/* Icon */}
              <div className={`h-11 w-11 rounded-xl ${r.bg} flex items-center justify-center shrink-0`}>
                <r.icon className={`h-5 w-5 ${r.color}`} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm">{r.title}</h3>
                  {downloaded.includes(r.key) && (
                    <Badge className="text-[10px] bg-success/10 text-success border-0 gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Downloaded
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  <span className="font-semibold text-foreground">{r.records}</span> {r.unit}
                  {selectedDept !== "all" && ` · ${deptLabel}`}
                  {" · "}{new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                <Button
                  variant="outline" size="sm" className="flex-1 sm:flex-none gap-1.5 h-9"
                  onClick={r.onPrint}
                >
                  <Printer className="h-3.5 w-3.5" /> Print
                </Button>
                <Button
                  size="sm" className="flex-1 sm:flex-none gap-1.5 h-9"
                  onClick={r.onCSV}
                >
                  <Download className="h-3.5 w-3.5" /> Download CSV
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Note ────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-muted/40 border">
        <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          CSV files are UTF-8 encoded and open correctly in Excel, Google Sheets, and Numbers.
          Print view opens in a new tab — use your browser's print function or <kbd className="px-1 py-0.5 rounded bg-background border text-[10px]">Ctrl+P</kbd> to print.
        </p>
      </div>
    </div>
  );
}