import { useState, useMemo } from "react";
import { Employee, AttendanceRecord, CreditBalance } from "@/types/attendance";
import type { AttendanceFilter } from "@/types/attendance";
import {
  Clock, AlertTriangle, ChevronDown, Hash, Calendar, CheckCircle2,
  XCircle, TrendingUp, Briefcase, Shield, ChevronRight, Building2,
  ArrowUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface EmployeeListProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  credits: CreditBalance[];
  visibleCount: number;
  onSeeMore: () => void;
  activeFilter?: AttendanceFilter;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

// Locum detection
function isLocum(emp: Employee) {
  return (
    emp.emp_code?.startsWith("AMC/LOC/") ||
    emp.first_name?.toUpperCase().includes("(LOCUM)") ||
    emp.last_name?.toUpperCase().includes("(LOCUM)")
  );
}

// ─── Status pill — calmer, AMC palette ────────────────────────────────────────

function StatusPill({ record }: { record: AttendanceRecord }) {
  if (record.missed_clock_in && record.missed_clock_out)
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-destructive/10 text-destructive border border-destructive/20">
        Missed both
      </span>
    );
  if (record.missed_clock_in)
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-destructive/10 text-destructive border border-destructive/20">
        No clock-in
      </span>
    );
  if (record.missed_clock_out)
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amc-yellow/15 text-amc-yellow border border-amc-yellow/25">
        No clock-out
      </span>
    );
  if (record.is_overtime)
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-foreground/8 text-foreground/75 border border-foreground/15">
        Overtime
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-success/10 text-success border border-success/20">
      Present
    </span>
  );
}

// ─── Info tile (used in detail sheet) ─────────────────────────────────────────

function InfoTile({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-foreground/3 border border-border rounded-md p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-foreground/55">
        <Icon className="h-3 w-3" />
        <span className="text-[10px] font-display font-semibold uppercase tracking-[0.12em]">{label}</span>
      </div>
      <p className="text-[13px] font-display font-semibold truncate">{value}</p>
    </div>
  );
}

function StatTile({ label, value, tone = "neutral" }: {
  label: string; value: string | number; tone?: "neutral" | "warn" | "good";
}) {
  const valueColor =
    tone === "warn" ? "text-destructive" :
    tone === "good" ? "text-success" :
    "text-foreground";
  return (
    <div className="bg-foreground/3 border border-border rounded-md p-3 text-center">
      <p className={`text-[20px] font-display font-bold tabular-nums ${valueColor}`}>{value}</p>
      <p className="text-[10px] text-foreground/55 mt-1 leading-tight">{label}</p>
    </div>
  );
}

// ─── Avatar — unified for all non-locum, yellow for locum ─────────────────────

function Avatar({ emp, size = "md" }: { emp: Employee; size?: "sm" | "md" | "lg" }) {
  const locum = isLocum(emp);
  const sz =
    size === "sm" ? "h-8 w-8 text-[10px]" :
    size === "lg" ? "h-14 w-14 text-[16px]" :
    "h-10 w-10 text-[12px]";

  const colorClasses = locum
    ? "bg-amc-yellow/15 text-amc-yellow ring-1 ring-amc-yellow/30"
    : "bg-[#EEE8DD] text-amc-blue ring-1 ring-[#E0D8C8]";

  return (
    <div className={`${sz} rounded-lg ${colorClasses} flex items-center justify-center shrink-0 font-display font-bold`}>
      {emp.first_name[0]}{emp.last_name[0]}
    </div>
  );
}

// ─── Employee detail sheet ────────────────────────────────────────────────────

function EmployeeSheet({ emp, attendance, credit, open, onClose }: {
  emp: Employee | null;
  attendance: AttendanceRecord[];
  credit: CreditBalance | undefined;
  open: boolean;
  onClose: () => void;
}) {
  if (!emp) return null;

  const locum         = isLocum(emp);
  const totalHours    = attendance.reduce((s, a) => s + a.hours_worked, 0);
  const missedIns     = attendance.filter(a => a.missed_clock_in).length;
  const missedOuts    = attendance.filter(a => a.missed_clock_out).length;
  const overtimeDays  = attendance.filter(a => a.is_overtime).length;
  const presentDays   = attendance.filter(a => !a.missed_clock_in && !a.missed_clock_out).length;
  const totalDays     = attendance.length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;
  const finalCredit   = credit?.final_credit ?? 1500;
  const hoursPercent  = Math.min(100, (totalHours / 180) * 100);

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col gap-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-4">
            <Avatar emp={emp} size="lg" />
            <div className="min-w-0 flex-1">
              <SheetTitle className="font-display font-bold text-[18px]">
                {emp.first_name} {emp.last_name}
              </SheetTitle>
              <SheetDescription className="text-[13px] mt-0.5 text-foreground/55">
                {emp.position} · {emp.department_name}
              </SheetDescription>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono text-foreground/55 bg-foreground/5">
                  {emp.emp_code}
                </span>
                {emp.is_department_head && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-foreground/8 text-foreground/75 border border-foreground/15">
                    Dept head
                  </span>
                )}
                {locum && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amc-yellow/15 text-amc-yellow border border-amc-yellow/25">
                    Locum
                  </span>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="profile" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-6 mt-4 mb-2 shrink-0">
            <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
            <TabsTrigger value="attendance" className="flex-1">Attendance</TabsTrigger>
            <TabsTrigger value="credits" className="flex-1">Credits</TabsTrigger>
          </TabsList>

          {/* ── Profile tab ─────────────────────────────────────────── */}
          <TabsContent value="profile" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full px-6 pb-6">
              <div className="space-y-5 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <InfoTile icon={Hash}      label="Code"       value={emp.emp_code} />
                  <InfoTile icon={Building2} label="Department" value={emp.department_name} />
                  <InfoTile icon={Briefcase} label="Position"   value={emp.position ?? "—"} />
                  <InfoTile icon={Shield}    label="Role"       value={locum ? "Locum" : emp.is_department_head ? "Dept Head" : "Staff"} />
                </div>
                <Separator />

                {(() => {
                  const todayStr = new Date().toISOString().split("T")[0];
                  const todayRec = attendance.find(a => a.date === todayStr);
                  return (
                    <div>
                      <p className="font-display text-[10px] tracking-[0.14em] uppercase text-foreground/55 font-semibold mb-3">
                        Today's status
                      </p>
                      {todayRec ? (
                        <div className="rounded-md border border-border overflow-hidden divide-y divide-border">
                          <div className="flex items-center justify-between px-4 py-3">
                            <span className="text-[13px] flex items-center gap-2">
                              {todayRec.missed_clock_in
                                ? <XCircle className="h-3.5 w-3.5 text-destructive" />
                                : <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                              Clock-in
                            </span>
                            <span className={`text-[13px] font-mono font-semibold tabular-nums ${todayRec.missed_clock_in ? "text-destructive" : "text-foreground"}`}>
                              {fmtTime(todayRec.clock_in)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between px-4 py-3">
                            <span className="text-[13px] flex items-center gap-2">
                              {todayRec.missed_clock_out
                                ? <XCircle className="h-3.5 w-3.5 text-destructive" />
                                : <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                              Clock-out
                            </span>
                            <span className={`text-[13px] font-mono font-semibold tabular-nums ${todayRec.missed_clock_out ? "text-destructive" : "text-foreground"}`}>
                              {fmtTime(todayRec.clock_out)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between px-4 py-3 bg-foreground/3">
                            <span className="text-[13px]">Hours today</span>
                            <span className="text-[13px] font-display font-bold tabular-nums">
                              {todayRec.hours_worked > 0 ? `${todayRec.hours_worked.toFixed(1)}h` : "—"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-md border border-dashed border-border px-4 py-6 text-center text-[13px] text-foreground/55">
                          No record for today yet
                        </div>
                      )}
                    </div>
                  );
                })()}

                <Separator />
                <div className="grid grid-cols-3 gap-2">
                  <StatTile label="Days tracked" value={totalDays} />
                  <StatTile label="Present"      value={presentDays} tone="good" />
                  <StatTile
                    label="Attend. rate"
                    value={`${attendanceRate}%`}
                    tone={attendanceRate >= 90 ? "good" : attendanceRate >= 75 ? "neutral" : "warn"}
                  />
                </div>

                <div className="bg-foreground/3 border border-border rounded-md p-4 space-y-2">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium">Monthly hours</span>
                    <span className="text-foreground/55 text-[12px] tabular-nums">
                      {totalHours.toFixed(1)}h / 180h
                    </span>
                  </div>
                  <Progress value={hoursPercent} className="h-1.5" />
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ── Attendance tab ──────────────────────────────────────── */}
          <TabsContent value="attendance" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full px-6 pb-6">
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-4 gap-2">
                  <StatTile label="Missed in"  value={missedIns}    tone={missedIns > 0 ? "warn" : "neutral"} />
                  <StatTile label="Missed out" value={missedOuts}   tone={missedOuts > 0 ? "warn" : "neutral"} />
                  <StatTile label="Overtime"   value={overtimeDays} />
                  <StatTile label="Present"    value={presentDays}  tone="good" />
                </div>
                <Separator />
                {attendance.length === 0 ? (
                  <div className="text-center py-8 text-[13px] text-foreground/55">No records found.</div>
                ) : (
                  <div className="rounded-md border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-foreground/3 hover:bg-foreground/3">
                          <TableHead className="h-9 text-[10px] py-0 font-display font-semibold tracking-[0.1em] uppercase text-foreground/55">Date</TableHead>
                          <TableHead className="h-9 text-[10px] py-0 font-display font-semibold tracking-[0.1em] uppercase text-foreground/55">In</TableHead>
                          <TableHead className="h-9 text-[10px] py-0 font-display font-semibold tracking-[0.1em] uppercase text-foreground/55">Out</TableHead>
                          <TableHead className="h-9 text-[10px] py-0 font-display font-semibold tracking-[0.1em] uppercase text-foreground/55">Hrs</TableHead>
                          <TableHead className="h-9 text-[10px] py-0 font-display font-semibold tracking-[0.1em] uppercase text-foreground/55">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendance.map(record => (
                          <TableRow
                            key={record.id}
                            className={
                              record.missed_clock_in && record.missed_clock_out ? "bg-destructive/5" :
                              record.missed_clock_in || record.missed_clock_out ? "bg-amc-yellow/5" : ""
                            }
                          >
                            <TableCell className="py-2 text-[12px] font-medium">{fmtDate(record.date)}</TableCell>
                            <TableCell className={`py-2 text-[12px] font-mono tabular-nums ${record.missed_clock_in ? "text-destructive" : "text-foreground/75"}`}>
                              {fmtTime(record.clock_in)}
                            </TableCell>
                            <TableCell className={`py-2 text-[12px] font-mono tabular-nums ${record.missed_clock_out ? "text-destructive" : "text-foreground/75"}`}>
                              {fmtTime(record.clock_out)}
                            </TableCell>
                            <TableCell className="py-2 text-[12px] tabular-nums">
                              {record.hours_worked > 0 ? `${record.hours_worked.toFixed(1)}h` : "—"}
                            </TableCell>
                            <TableCell className="py-2"><StatusPill record={record} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ── Credits tab ─────────────────────────────────────────── */}
          <TabsContent value="credits" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full px-6 pb-6">
              <div className="space-y-4 pt-2">
                <div className="rounded-md border border-border overflow-hidden divide-y divide-border">
                  {[
                    { label: "Initial credit",  value: `GH₵ ${credit?.initial_credit ?? 1500}`,  tone: "neutral", desc: "Base monthly allocation" },
                    { label: "Deductions",      value: `−GH₵ ${credit?.deductions ?? 0}`,        tone: "warn",    desc: "Missed punch penalties" },
                    { label: "Overtime bonus",  value: `+GH₵ ${credit?.overtime_credits ?? 0}`,  tone: "good",    desc: "Approved overtime credits" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-[13px] font-medium">{item.label}</p>
                        <p className="text-[11px] text-foreground/55">{item.desc}</p>
                      </div>
                      <span className={`text-[13px] font-display font-bold tabular-nums
                        ${item.tone === "warn" ? "text-destructive" : item.tone === "good" ? "text-success" : "text-foreground"}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-4 bg-foreground/3">
                    <div>
                      <p className="text-[13px] font-display font-bold">Final credit</p>
                      <p className="text-[11px] text-foreground/55">Net balance this month</p>
                    </div>
                    <span className={`font-display text-[28px] font-bold tabular-nums
                      ${finalCredit < 1300 ? "text-destructive" : finalCredit < 1500 ? "text-amc-yellow" : "text-foreground"}`}>
                      GH₵ {finalCredit}
                    </span>
                  </div>
                </div>
                <div className="bg-foreground/3 border border-border rounded-md p-4 space-y-2">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium">Monthly hours vs target</span>
                    <span className="text-foreground/55 text-[12px] tabular-nums">
                      {totalHours.toFixed(1)}h / 180h
                    </span>
                  </div>
                  <Progress value={Math.min(100, (totalHours / 180) * 100)} className="h-1.5" />
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

// ─── Overtime row ─────────────────────────────────────────────────────────────

const SCHEDULED_HOURS = 9;

function OvertimeRow({ emp, overtimeRecords, onClick }: {
  emp: Employee; overtimeRecords: AttendanceRecord[]; onClick: () => void;
}) {
  const locum       = isLocum(emp);
  const totalExtra  = overtimeRecords.reduce((s, r) => s + Math.max(0, r.hours_worked - SCHEDULED_HOURS), 0);

  return (
    <button onClick={onClick}
      className="w-full rounded-md border border-border bg-card px-4 py-3.5 hover:border-foreground/30 transition-colors group text-left">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar emp={emp} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-display font-semibold text-[14px]">
                {emp.first_name} {emp.last_name}
              </span>
              {emp.is_department_head && (
                <span className="text-[10px] font-medium px-1.5 py-px rounded bg-foreground/8 text-foreground/75">Head</span>
              )}
              {locum && (
                <span className="text-[10px] font-medium px-1.5 py-px rounded bg-amc-yellow/15 text-amc-yellow border border-amc-yellow/25">
                  Locum
                </span>
              )}
            </div>
            <p className="text-[12px] text-foreground/55 mt-0.5">{emp.position} · {emp.emp_code}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-foreground/45 uppercase tracking-[0.1em] font-display font-semibold">OT days</p>
            <span className="text-[14px] font-display font-bold tabular-nums">{overtimeRecords.length}</span>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-foreground/45 uppercase tracking-[0.1em] font-display font-semibold">Extra hrs</p>
            <span className="text-[14px] font-display font-bold tabular-nums">+{totalExtra.toFixed(1)}h</span>
          </div>
          <ChevronRight className="h-4 w-4 text-foreground/30 group-hover:text-foreground/70 transition-colors" />
        </div>
      </div>
      <div className="space-y-1 border-t border-border pt-2.5">
        {overtimeRecords.map(r => {
          const extra = Math.max(0, r.hours_worked - SCHEDULED_HOURS);
          return (
            <div key={r.id} className="flex items-center justify-between px-3 py-1.5 rounded bg-foreground/3 border border-border/60">
              <span className="text-[11px] font-medium w-28 shrink-0">
                {new Date(r.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </span>
              <div className="hidden sm:flex items-center gap-3 text-[11px] text-foreground/55">
                <span>In: <span className="font-mono text-foreground/80 tabular-nums">{r.clock_in ? new Date(r.clock_in).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}</span></span>
                <span>Out: <span className="font-mono text-foreground/80 tabular-nums">{r.clock_out ? new Date(r.clock_out).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}</span></span>
              </div>
              <div className="flex items-center gap-2 text-[11px] shrink-0">
                <span className="text-foreground/55 tabular-nums">{r.hours_worked.toFixed(1)}h</span>
                <span className="flex items-center gap-0.5 px-1.5 py-px rounded font-semibold tabular-nums">
                  <ArrowUp className="h-2.5 w-2.5" />+{extra.toFixed(1)}h
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </button>
  );
}

// ─── Main employee row ────────────────────────────────────────────────────────

function EmployeeRow({ emp, todayRecord, totalHours, finalCredit, missedCount, onClick }: {
  emp: Employee;
  todayRecord: AttendanceRecord | undefined;
  totalHours: number;
  finalCredit: number;
  missedCount: number;
  onClick: () => void;
}) {
  const locum = isLocum(emp);

  const hoursColor =
    totalHours < 36 ? "text-destructive" :
    "text-foreground";

  const creditColor =
    finalCredit < 1300 ? "text-destructive" :
    finalCredit < 1500 ? "text-amc-yellow" :
    "text-foreground";

  return (
    <button onClick={onClick}
      className="w-full rounded-md border border-border bg-card px-4 py-3 hover:border-foreground/30 hover:bg-foreground/2 transition-colors group text-left">
      <div className="flex items-center gap-3">

        <Avatar emp={emp} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-display font-semibold text-[14px]">
              {emp.first_name} {emp.last_name}
            </span>
            {emp.is_department_head && (
              <span className="text-[10px] font-medium px-1.5 py-px rounded bg-foreground/8 text-foreground/75">
                Head
              </span>
            )}
            {locum && (
              <span className="text-[10px] font-medium px-1.5 py-px rounded bg-amc-yellow/15 text-amc-yellow border border-amc-yellow/25">
                Locum
              </span>
            )}
            {missedCount > 0 && (
              <span className="text-[10px] font-medium px-1.5 py-px rounded bg-destructive/10 text-destructive border border-destructive/20">
                {missedCount} missed
              </span>
            )}
          </div>
          <p className="text-[12px] text-foreground/55 mt-0.5">
            {emp.position} · <span className="font-mono">{emp.emp_code}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">

          <div className="hidden sm:block">
            {todayRecord
              ? <StatusPill record={todayRecord} />
              : <span className="text-[11px] text-foreground/45">No record</span>
            }
          </div>

          <div className="hidden md:block h-7 w-px bg-border" />

          <div className="hidden md:block text-right">
            <p className="text-[10px] text-foreground/45 uppercase tracking-[0.1em] font-display font-semibold leading-none mb-1">Week hrs</p>
            <span className={`text-[14px] font-display font-bold tabular-nums ${hoursColor}`}>
              {totalHours.toFixed(1)}
              <span className="text-[10px] text-foreground/45 font-normal"> / 45</span>
            </span>
          </div>

          <div className="hidden md:block h-7 w-px bg-border" />

          <div className="text-right">
            <p className="text-[10px] text-foreground/45 uppercase tracking-[0.1em] font-display font-semibold leading-none mb-1">Credits</p>
            <span className={`text-[14px] font-display font-bold tabular-nums ${creditColor}`}>
              {finalCredit}
            </span>
          </div>

          <ChevronRight className="h-4 w-4 text-foreground/30 group-hover:text-foreground/70 transition-colors shrink-0 ml-1" />
        </div>
      </div>
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const EmployeeList = ({
  employees, attendance, credits, visibleCount, onSeeMore, activeFilter = "all",
}: EmployeeListProps) => {
  const [selected, setSelected] = useState<Employee | null>(null);

  // Sort: regular staff first (alphabetically), locums last (alphabetically)
  const sortedEmployees = useMemo(() => {
    const regular = employees.filter(e => !isLocum(e));
    const locums  = employees.filter(e =>  isLocum(e));
    return [...regular, ...locums];
  }, [employees]);

  const visibleEmployees   = sortedEmployees.slice(0, visibleCount);
  const hasMore            = sortedEmployees.length > visibleCount;
  const selectedAttendance = selected ? attendance.filter(a => a.employee_id === selected.id) : [];
  const selectedCredit     = selected ? credits.find(c => c.employee_id === selected.id) : undefined;
  const isOvertimeFilter   = activeFilter === "overtime";

  return (
    <>
      <div className="space-y-1.5">
        {visibleEmployees.map((emp, idx) => {
          const empAtt      = attendance.filter(a => a.employee_id === emp.id);
          const empCredit   = credits.find(c => c.employee_id === emp.id);
          const todayRecord = empAtt[0];
          const totalHours  = empAtt.reduce((s, a) => s + a.hours_worked, 0);
          const missedCount = empAtt.filter(a => a.missed_clock_in || a.missed_clock_out).length;
          const finalCredit = empCredit?.final_credit ?? 1500;

          // Insert "Locum staff" divider before the first locum
          const isFirstLocum =
            isLocum(emp) && (idx === 0 || !isLocum(visibleEmployees[idx - 1]));

          if (isOvertimeFilter) {
            const overtimeRecords = empAtt.filter(a => a.is_overtime);
            if (overtimeRecords.length === 0) return null;
            return (
              <div key={emp.id}>
                {isFirstLocum && <LocumDivider />}
                <OvertimeRow emp={emp} overtimeRecords={overtimeRecords}
                  onClick={() => setSelected(emp)} />
              </div>
            );
          }

          return (
            <div key={emp.id}>
              {isFirstLocum && <LocumDivider />}
              <EmployeeRow emp={emp} todayRecord={todayRecord}
                totalHours={totalHours} finalCredit={finalCredit} missedCount={missedCount}
                onClick={() => setSelected(emp)} />
            </div>
          );
        })}

        {hasMore && (
          <div className="flex justify-center pt-3">
            <Button variant="outline" onClick={onSeeMore} className="gap-2 font-display font-semibold">
              See more <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        )}

        {sortedEmployees.length === 0 && (
          <div className="text-center py-12 text-foreground/55">
            <p className="text-[13px]">No employees match the current filters.</p>
          </div>
        )}
      </div>

      <EmployeeSheet
        emp={selected}
        attendance={selectedAttendance}
        credit={selectedCredit}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
};

// ─── Locum section divider ────────────────────────────────────────────────────

function LocumDivider() {
  return (
    <div className="flex items-center gap-2 py-3 mt-2">
      <span className="font-display text-[10px] tracking-[0.16em] uppercase text-amc-yellow font-semibold">
        Locum staff
      </span>
      <span className="flex-1 h-px bg-amc-yellow/20" />
    </div>
  );
}

export default EmployeeList;