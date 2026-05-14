import { useState } from "react";
import {
  Bell, CheckCircle2, XCircle, Inbox, RotateCcw,
  ChevronRight, AlertTriangle, Clock, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  useOvertimeNotifications,
  OvertimeNotification,
  MissedNotification,
} from "@/hooks/useOvertimeNotifications";
import { useAuth } from "@/hooks/useAuth";
import { useEmployees } from "@/hooks/useEmployees";
import { useAttendance } from "@/hooks/useAttendance";
import type { Employee } from "@/types/attendance";

import {
  User, Building2, Hash, Calendar,
  CheckCircle2 as Check, Timer, CreditCard,
  TrendingUp, Briefcase, Shield,
  XCircle as XC,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import type { AttendanceRecord, CreditBalance } from "@/types/attendance";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}
function fmtTime(t: string | null) {
  if (!t) return "—";
  // Handle both "HH:MM" and full ISO strings
  if (t.includes("T")) return new Date(t).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return t;
}

// ─── Attendance status badge ──────────────────────────────────────────────────

function AttStatus({ record }: { record: AttendanceRecord }) {
  if (record.missed_clock_in && record.missed_clock_out)
    return <span className="status-badge status-danger"><AlertTriangle className="h-3 w-3" /> Missed Both</span>;
  if (record.missed_clock_in)
    return <span className="status-badge status-warning"><XC className="h-3 w-3" /> No Clock-In</span>;
  if (record.missed_clock_out)
    return <span className="status-badge status-warning"><Clock className="h-3 w-3" /> No Clock-Out</span>;
  if (record.is_overtime)
    return <span className="status-badge bg-primary/10 text-primary"><TrendingUp className="h-3 w-3" /> Overtime</span>;
  return <span className="status-badge status-ok"><Check className="h-3 w-3" /> Present</span>;
}

// ─── Employee Detail Sheet ────────────────────────────────────────────────────
// Uses real Supabase data via hooks — no mockData

function EmployeeDetailSheet({
  emp, open, onClose,
}: {
  emp: Employee | null;
  open: boolean;
  onClose: () => void;
}) {
  // Load attendance for this specific employee
  const { attendance } = useAttendance(
    emp ? { employeeIds: [emp.id] } : {}
  );

  if (!emp) return null;

  const MONTHLY_TARGET = 180;
  const totalHours     = attendance.reduce((s, a) => s + a.hours_worked, 0);
  const missedIns      = attendance.filter(a => a.missed_clock_in).length;
  const missedOuts     = attendance.filter(a => a.missed_clock_out).length;
  const overtimeDays   = attendance.filter(a => a.is_overtime).length;
  const presentDays    = attendance.filter(a => !a.missed_clock_in && !a.missed_clock_out).length;
  const totalDays      = attendance.length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;
  const hoursPercent   = Math.min(100, (totalHours / MONTHLY_TARGET) * 100);

  // Deductions: GHS 100 per missed event
  const deductions  = (missedIns + missedOuts) * 100;
  const finalCredit = Math.max(0, 1500 - deductions);
  const creditColor = finalCredit < 1300 ? "text-destructive" : finalCredit < 1500 ? "text-warning" : "text-success";

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col gap-0">

        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-primary">
                {emp.first_name[0]}{emp.last_name[0]}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg font-bold leading-tight">
                {emp.first_name} {emp.last_name}
              </SheetTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {emp.position} · {emp.department_name}
              </p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge variant="secondary" className="text-[10px]">{emp.emp_code}</Badge>
                {emp.is_department_head && (
                  <Badge className="text-[10px] bg-primary/10 text-primary border-0">Dept Head</Badge>
                )}
                <Badge className="text-[10px] bg-success/10 text-success border-0">Active</Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable body */}
        <ScrollArea className="flex-1 px-6 pb-8">
          <div className="space-y-6 pt-5">

            {/* Profile */}
            <section>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Profile</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Hash,      label: "Employee Code", value: emp.emp_code },
                  { icon: Building2, label: "Department",    value: emp.department_name },
                  { icon: Briefcase, label: "Position",      value: emp.position ?? "—" },
                  { icon: Shield,    label: "Role",          value: emp.is_department_head ? "Dept Head" : "Staff" },
                ].map(item => (
                  <div key={item.label} className="bg-muted/40 rounded-xl p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <item.icon className="h-3 w-3" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">{item.label}</span>
                    </div>
                    <p className="text-sm font-semibold truncate">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <Separator />

            {/* Credits */}
            <section>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Credit Balance — {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Initial",    value: "GH₵1,500",          color: "text-foreground"  },
                  { label: "Deductions", value: `-GH₵${deductions}`, color: "text-destructive" },
                  { label: "OT Bonus",   value: `+GH₵${overtimeDays * 0}`, color: "text-success" },
                  { label: "Final",      value: `GH₵${finalCredit}`, color: creditColor        },
                ].map(item => (
                  <Card key={item.label} className="p-3 text-center">
                    <p className="text-[10px] text-muted-foreground mb-1">{item.label}</p>
                    <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
                  </Card>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                GHS 100 deducted per missed clock-in or clock-out event
              </p>
            </section>

            <Separator />

            {/* Attendance summary */}
            <section>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Attendance Summary
              </p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: "Days",       value: totalDays,     color: "text-foreground" },
                  { label: "Present",    value: presentDays,   color: "text-success" },
                  { label: "Missed In",  value: missedIns,     color: missedIns  > 0 ? "text-warning" : "text-foreground" },
                  { label: "Missed Out", value: missedOuts,    color: missedOuts > 0 ? "text-warning" : "text-foreground" },
                  { label: "Overtime",   value: overtimeDays,  color: overtimeDays > 0 ? "text-primary" : "text-foreground" },
                  { label: "Rate",       value: `${attendanceRate}%`,
                    color: attendanceRate >= 90 ? "text-success" : attendanceRate >= 75 ? "text-warning" : "text-destructive" },
                ].map(item => (
                  <div key={item.label} className="bg-muted/40 rounded-xl p-3 text-center">
                    <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-muted/40 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Monthly Hours</span>
                  <span className="text-muted-foreground text-xs">{totalHours.toFixed(1)}h / {MONTHLY_TARGET}h</span>
                </div>
                <Progress value={hoursPercent} className="h-2.5" />
                <p className="text-[11px] text-muted-foreground">
                  {hoursPercent >= 100 ? "✓ Target reached" : `${(MONTHLY_TARGET - totalHours).toFixed(1)}h remaining`}
                </p>
              </div>
            </section>

            <Separator />

            {/* Attendance log */}
            <section>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Attendance Log
              </p>
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="h-9 text-[11px] py-0">Date</TableHead>
                      <TableHead className="h-9 text-[11px] py-0">In</TableHead>
                      <TableHead className="h-9 text-[11px] py-0">Out</TableHead>
                      <TableHead className="h-9 text-[11px] py-0">Hrs</TableHead>
                      <TableHead className="h-9 text-[11px] py-0">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                          No attendance records found.
                        </TableCell>
                      </TableRow>
                    )}
                    {attendance.map(record => (
                      <TableRow key={record.id} className={
                        record.missed_clock_in && record.missed_clock_out
                          ? "bg-destructive/5 hover:bg-destructive/10"
                          : record.missed_clock_in || record.missed_clock_out
                          ? "bg-warning/5 hover:bg-warning/10" : ""
                      }>
                        <TableCell className="py-2 text-xs font-medium">{fmtDate(record.date)}</TableCell>
                        <TableCell className={`py-2 text-xs font-mono ${record.missed_clock_in ? "text-destructive" : "text-success"}`}>
                          {fmtTime(record.clock_in)}
                        </TableCell>
                        <TableCell className={`py-2 text-xs font-mono ${record.missed_clock_out ? "text-destructive" : "text-foreground"}`}>
                          {fmtTime(record.clock_out)}
                        </TableCell>
                        <TableCell className="py-2 text-xs">
                          {record.hours_worked > 0 ? `${record.hours_worked.toFixed(1)}h` : "—"}
                        </TableCell>
                        <TableCell className="py-2"><AttStatus record={record} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// ─── Overtime notification card ───────────────────────────────────────────────

function OTCard({ n, onApprove, onDeny, onRevoke, onViewProfile }: {
  n: OvertimeNotification;
  onApprove: () => void;
  onDeny: () => void;
  onRevoke: () => void;
  onViewProfile: () => void;
}) {
  const isPending  = n.status === "pending";
  const isApproved = n.status === "approved";

  return (
    <div className={[
      "rounded-xl border-2 p-4 space-y-3 transition-all",
      isPending  ? "border-warning/60 bg-warning/10" :
      isApproved ? "border-success/50 bg-success/10" :
                   "border-border bg-muted/40 opacity-80",
    ].join(" ")}>
      <div className="flex items-start justify-between gap-2">
        <button onClick={onViewProfile}
          className="flex items-center gap-3 min-w-0 group flex-1 text-left">
          <div className={[
            "h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold",
            isPending  ? "bg-warning/30 text-warning" :
            isApproved ? "bg-success/30 text-success" : "bg-muted text-muted-foreground",
          ].join(" ")}>
            {n.employeeName.split(" ").map(w => w[0]).join("").slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="text-sm font-bold truncate group-hover:text-primary group-hover:underline underline-offset-2 transition-colors">
                {n.employeeName}
              </p>
              <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
            <p className="text-xs text-foreground/70 truncate">{n.position} · {n.department}</p>
          </div>
        </button>
        <Badge className={[
          "text-[10px] shrink-0 font-semibold",
          isPending  ? "bg-warning/25 text-warning border-warning/50" :
          isApproved ? "bg-success/25 text-success border-success/40" : "bg-muted text-muted-foreground border-0",
        ].join(" ")}>
          {isPending ? "Pending" : isApproved ? "✓ Approved" : "✗ Denied"}
        </Badge>
      </div>

      <button onClick={onViewProfile}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-background border border-border/80 hover:bg-muted/60 hover:border-primary/40 transition-all group">
        <span className="text-xs text-foreground/60 group-hover:text-foreground transition-colors">
          View full profile &amp; attendance history
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-foreground/40 group-hover:text-primary transition-colors" />
      </button>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-background rounded-lg p-2 text-center border border-border/80">
          <p className="text-[10px] text-foreground/50 mb-0.5">Date</p>
          <p className="text-xs font-semibold">{fmtDate(n.date)}</p>
        </div>
        <div className="bg-background rounded-lg p-2 text-center border border-border/80">
          <p className="text-[10px] text-foreground/50 mb-0.5">Total</p>
          <p className="text-xs font-bold text-warning">{n.hoursWorked.toFixed(1)}h</p>
        </div>
        <div className="bg-background rounded-lg p-2 text-center border border-border/80">
          <p className="text-[10px] text-foreground/50 mb-0.5">Extra</p>
          <p className="text-xs font-bold text-warning">+{Math.max(0, n.hoursWorked - 9).toFixed(1)}h</p>
        </div>
      </div>

      <div className="flex gap-3 text-[11px] text-foreground/60">
        <span>In: <span className="font-mono font-semibold text-foreground">{fmtTime(n.clockIn)}</span></span>
        <span>·</span>
        <span>Out: <span className="font-mono font-semibold text-foreground">{fmtTime(n.clockOut)}</span></span>
      </div>

      {isPending && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" className="flex-1 h-8 gap-1.5 bg-success hover:bg-success/90 text-white" onClick={onApprove}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
          </Button>
          <Button size="sm" variant="outline"
            className="flex-1 h-8 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10" onClick={onDeny}>
            <XCircle className="h-3.5 w-3.5" /> Deny
          </Button>
        </div>
      )}
      {isApproved && (
        <Button size="sm" variant="outline"
          className="w-full h-8 gap-1.5 border-warning/40 text-warning hover:bg-warning/10 hover:border-warning"
          onClick={onRevoke}>
          <RotateCcw className="h-3.5 w-3.5" /> Revoke Approval
        </Button>
      )}
    </div>
  );
}

// ─── Missed clock-in/out notification card ────────────────────────────────────

function MissedCard({ n, onViewProfile }: {
  n: MissedNotification;
  onViewProfile: () => void;
}) {
  const both = n.missedClockIn && n.missedClockOut;
  const label = both ? "Missed Both" : n.missedClockIn ? "No Clock-In" : "No Clock-Out";
  const color = both ? "border-destructive/60 bg-destructive/10" : "border-warning/60 bg-warning/10";
  const badgeColor = both
    ? "bg-destructive/25 text-destructive border-destructive/50 font-semibold"
    : "bg-warning/25 text-warning border-warning/50 font-semibold";

  return (
    <div className={`rounded-xl border-2 p-4 space-y-3 transition-all ${color}`}>
      <div className="flex items-start justify-between gap-2">
        <button onClick={onViewProfile}
          className="flex items-center gap-3 min-w-0 group flex-1 text-left">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
            both ? "bg-destructive/30 text-destructive" : "bg-warning/30 text-warning"
          }`}>
            {n.employeeName.split(" ").map(w => w[0]).join("").slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="text-sm font-bold truncate group-hover:text-primary group-hover:underline underline-offset-2 transition-colors">
                {n.employeeName}
              </p>
              <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
            <p className="text-xs text-foreground/70 truncate">{n.position} · {n.department}</p>
          </div>
        </button>
        <Badge className={`text-[10px] shrink-0 ${badgeColor}`}>
          {both ? <><AlertTriangle className="h-2.5 w-2.5 mr-1" />{label}</> : label}
        </Badge>
      </div>

      <button onClick={onViewProfile}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-background border border-border/80 hover:bg-muted/60 hover:border-primary/40 transition-all group">
        <span className="text-xs text-foreground/60 group-hover:text-foreground transition-colors">
          View full profile &amp; attendance history
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-foreground/40 group-hover:text-primary transition-colors" />
      </button>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-background rounded-lg p-2 text-center border border-border/80">
          <p className="text-[10px] text-foreground/50 mb-0.5">Date</p>
          <p className="text-xs font-semibold">{fmtDate(n.date)}</p>
        </div>
        <div className="bg-background rounded-lg p-2 text-center border border-border/80">
          <p className="text-[10px] text-foreground/50 mb-0.5">Clock In</p>
          <p className={`text-xs font-mono font-bold ${n.missedClockIn ? "text-destructive" : "text-success"}`}>
            {fmtTime(n.clockIn)}
          </p>
        </div>
        <div className="bg-background rounded-lg p-2 text-center border border-border/80">
          <p className="text-[10px] text-foreground/50 mb-0.5">Clock Out</p>
          <p className={`text-xs font-mono font-bold ${n.missedClockOut ? "text-destructive" : "text-foreground"}`}>
            {fmtTime(n.clockOut)}
          </p>
        </div>
      </div>

      <p className="text-[11px] text-foreground/70 font-medium">
        Deduction: <span className="font-bold text-destructive">
          -GH₵{(n.missedClockIn ? 100 : 0) + (n.missedClockOut ? 100 : 0)}
        </span> from monthly credit
      </p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <Inbox className="h-12 w-12 text-muted-foreground/30" />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function OvertimePanel() {
  const { role } = useAuth();
  const {
    notifications, unreadCount, pendingCount,
    approve, deny, revoke, markAllRead,
    missedNotifications, missedUnreadCount,
    markAllMissedRead, markMissedRead,
    loading,
  } = useOvertimeNotifications();

  // Load employees from Supabase for profile lookup
  const { employees } = useEmployees();

  const [open, setOpen]               = useState(false);
  const [profileEmp, setProfileEmp]   = useState<Employee | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const canApprove = ["manager", "department_head", "hr", "admin"].includes(role ?? "");
  if (!canApprove) return null;

  const pending  = notifications.filter(n => n.status === "pending");
  const resolved = notifications.filter(n => n.status !== "pending");

  // Total unread badge = overtime unread + missed unread
  const totalUnread = unreadCount + missedUnreadCount;

  function handleOpen() {
    setOpen(true);
    markAllRead();
    markAllMissedRead();
  }

  function openProfile(employeeId: string) {
    const emp = employees.find(e => e.id === employeeId);
    if (emp) { setProfileEmp(emp); setProfileOpen(true); }
  }

  return (
    <>
      {/* Bell button */}
      <button onClick={handleOpen}
        className="relative h-9 w-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
        aria-label="Notifications">
        <Bell className={`h-4 w-4 ${totalUnread > 0 ? "text-warning" : "text-muted-foreground"}`} />
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-warning text-[9px] font-black text-white flex items-center justify-center">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>

      {/* Notifications sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col gap-0">
          <SheetHeader className="px-5 pt-5 pb-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-warning" /> Notifications
                </SheetTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Overtime approvals &amp; missed clock-ins · Click a name to view profile
                </p>
              </div>
              {pendingCount > 0 && (
                <Badge className="bg-warning/15 text-warning border-warning/30">
                  {pendingCount} pending
                </Badge>
              )}
            </div>

            {/* Summary row */}
            <div className="flex gap-3 mt-3">
              {[
                { label: "OT Pending",  value: pending.length,          color: "text-warning"          },
                { label: "Missed",      value: missedNotifications.length, color: "text-destructive"    },
                { label: "Resolved",    value: resolved.length,          color: "text-muted-foreground" },
              ].map(s => (
                <div key={s.label} className="flex-1 bg-muted/40 rounded-lg p-2 text-center">
                  {loading
                    ? <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                    : <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                  }
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </SheetHeader>

          <Tabs defaultValue="missed" className="flex-1 flex flex-col min-h-0">
            <TabsList className="mx-5 mt-4 mb-2 shrink-0">

              {/* Missed clock-in/out tab — shown first as it's more urgent */}
              <TabsTrigger value="missed" className="flex-1">
                Missed
                {missedNotifications.length > 0 && (
                  <Badge className="ml-1.5 h-4 px-1.5 text-[9px] bg-destructive/20 text-destructive border-0">
                    {missedNotifications.length}
                  </Badge>
                )}
              </TabsTrigger>

              {/* Overtime pending tab */}
              <TabsTrigger value="pending" className="flex-1">
                Overtime
                {pending.length > 0 && (
                  <Badge className="ml-1.5 h-4 px-1.5 text-[9px] bg-warning/20 text-warning border-0">
                    {pending.length}
                  </Badge>
                )}
              </TabsTrigger>

              <TabsTrigger value="resolved" className="flex-1">Resolved</TabsTrigger>
            </TabsList>

            {/* ── Missed tab ────────────────────────────────────────────── */}
            <TabsContent value="missed" className="flex-1 min-h-0 mt-0">
              <ScrollArea className="h-full px-5 pb-5">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : missedNotifications.length === 0 ? (
                  <EmptyState label="No missed clock-ins or clock-outs. All clear!" />
                ) : (
                  <div className="space-y-3 pt-1">
                    <p className="text-[11px] text-muted-foreground">
                      Showing {missedNotifications.length} record{missedNotifications.length !== 1 ? "s" : ""} —
                      GHS 100 deducted per missed event
                    </p>
                    {missedNotifications.map(n => (
                      <MissedCard key={n.id} n={n}
                        onViewProfile={() => openProfile(n.employeeId)} />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* ── Overtime pending tab ──────────────────────────────────── */}
            <TabsContent value="pending" className="flex-1 min-h-0 mt-0">
              <ScrollArea className="h-full px-5 pb-5">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : pending.length === 0 ? (
                  <EmptyState label="No pending overtime requests. All clear!" />
                ) : (
                  <div className="space-y-3 pt-1">
                    {pending.length > 1 && (
                      <div className="flex gap-2 pb-1">
                        <Button size="sm" variant="outline"
                          className="flex-1 h-7 text-xs gap-1 border-success/40 text-success hover:bg-success/10"
                          onClick={() => pending.forEach(n => approve(n.id))}>
                          <CheckCircle2 className="h-3 w-3" /> Approve All
                        </Button>
                        <Button size="sm" variant="outline"
                          className="flex-1 h-7 text-xs gap-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                          onClick={() => pending.forEach(n => deny(n.id))}>
                          <XCircle className="h-3 w-3" /> Deny All
                        </Button>
                      </div>
                    )}
                    {pending.map(n => (
                      <OTCard key={n.id} n={n}
                        onApprove={() => approve(n.id)}
                        onDeny={() => deny(n.id)}
                        onRevoke={() => revoke(n.id)}
                        onViewProfile={() => openProfile(n.employeeId)} />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* ── Resolved tab ──────────────────────────────────────────── */}
            <TabsContent value="resolved" className="flex-1 min-h-0 mt-0">
              <ScrollArea className="h-full px-5 pb-5">
                {resolved.length === 0 ? (
                  <EmptyState label="No resolved requests yet." />
                ) : (
                  <div className="space-y-3 pt-1">
                    {resolved.map(n => (
                      <OTCard key={n.id} n={n}
                        onApprove={() => approve(n.id)}
                        onDeny={() => deny(n.id)}
                        onRevoke={() => revoke(n.id)}
                        onViewProfile={() => openProfile(n.employeeId)} />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Employee detail sheet */}
      <EmployeeDetailSheet
        emp={profileEmp}
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </>
  );
}