import { useState } from "react";
import { Employee, AttendanceRecord, CreditBalance } from "@/types/attendance";
import type { AttendanceFilter } from "@/types/attendance";
import {
  Clock, AlertTriangle, ChevronDown, Timer, CreditCard,
  User, Building2, Hash, Calendar, CheckCircle2, XCircle,
  TrendingUp, Briefcase, Shield, ChevronRight, Flame, ArrowUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

// Avatar colour based on name — gives each employee a consistent unique colour
const AVATAR_COLORS = [
  { bg: "bg-violet-500/20",  text: "text-violet-400",  ring: "ring-violet-500/30"  },
  { bg: "bg-blue-500/20",    text: "text-blue-400",    ring: "ring-blue-500/30"    },
  { bg: "bg-emerald-500/20", text: "text-emerald-400", ring: "ring-emerald-500/30" },
  { bg: "bg-amber-500/20",   text: "text-amber-400",   ring: "ring-amber-500/30"   },
  { bg: "bg-rose-500/20",    text: "text-rose-400",    ring: "ring-rose-500/30"    },
  { bg: "bg-teal-500/20",    text: "text-teal-400",    ring: "ring-teal-500/30"    },
  { bg: "bg-orange-500/20",  text: "text-orange-400",  ring: "ring-orange-500/30"  },
  { bg: "bg-cyan-500/20",    text: "text-cyan-400",    ring: "ring-cyan-500/30"    },
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({ record }: { record: AttendanceRecord }) {
  if (record.missed_clock_in && record.missed_clock_out)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/25">
        <AlertTriangle className="h-3 w-3" /> Missed Both
      </span>
    );
  if (record.missed_clock_in)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/25">
        <XCircle className="h-3 w-3" /> No Clock-In
      </span>
    );
  if (record.missed_clock_out)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
        <Clock className="h-3 w-3" /> No Clock-Out
      </span>
    );
  if (record.is_overtime)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/25">
        <TrendingUp className="h-3 w-3" /> Overtime
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
      <CheckCircle2 className="h-3 w-3" /> Present
    </span>
  );
}

// ─── Info tile ────────────────────────────────────────────────────────────────

function InfoTile({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-muted/40 rounded-xl p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3 w-3" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-semibold truncate">{value}</p>
    </div>
  );
}

function StatTile({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-muted/40 rounded-xl p-3 text-center">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{label}</p>
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

  const ac            = avatarColor(`${emp.first_name} ${emp.last_name}`);
  const totalHours    = attendance.reduce((s, a) => s + a.hours_worked, 0);
  const missedIns     = attendance.filter(a => a.missed_clock_in).length;
  const missedOuts    = attendance.filter(a => a.missed_clock_out).length;
  const overtimeDays  = attendance.filter(a => a.is_overtime).length;
  const presentDays   = attendance.filter(a => !a.missed_clock_in && !a.missed_clock_out).length;
  const totalDays     = attendance.length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;
  const finalCredit   = credit?.final_credit ?? 1500;
  const hoursPercent  = Math.min(100, (totalHours / 180) * 100);
  const creditColor   = finalCredit < 1300 ? "text-red-400" : finalCredit < 1500 ? "text-amber-400" : "text-emerald-400";

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col gap-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center gap-4">
            <div className={`h-14 w-14 rounded-2xl ${ac.bg} ring-2 ${ac.ring} flex items-center justify-center shrink-0`}>
              <span className={`text-lg font-black ${ac.text}`}>
                {emp.first_name[0]}{emp.last_name[0]}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg font-bold">{emp.first_name} {emp.last_name}</SheetTitle>
              <SheetDescription className="text-sm mt-0.5">{emp.position} · {emp.department_name}</SheetDescription>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-muted text-muted-foreground">
                  {emp.emp_code}
                </span>
                {emp.is_department_head && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                    Dept Head
                  </span>
                )}
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active
                </span>
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

          <TabsContent value="profile" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full px-6 pb-6">
              <div className="space-y-5 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <InfoTile icon={Hash}      label="Employee Code" value={emp.emp_code} />
                  <InfoTile icon={Building2} label="Department"    value={emp.department_name} />
                  <InfoTile icon={Briefcase} label="Position"      value={emp.position ?? "—"} />
                  <InfoTile icon={Shield}    label="Role"          value={emp.is_department_head ? "Dept Head" : "Staff"} />
                </div>
                <Separator />
                {(() => {
                  const todayStr = new Date().toISOString().split("T")[0];
                  const todayRec = attendance.find(a => a.date === todayStr);
                  return (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Today's Status</p>
                      {todayRec ? (
                        <div className="rounded-xl border overflow-hidden divide-y divide-border">
                          <div className="flex items-center justify-between px-4 py-3">
                            <span className="text-sm font-medium flex items-center gap-2">
                              {todayRec.missed_clock_in
                                ? <XCircle className="h-4 w-4 text-red-400" />
                                : <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                              Clock-In
                            </span>
                            <span className={`text-sm font-mono font-bold ${todayRec.missed_clock_in ? "text-red-400" : "text-emerald-400"}`}>
                              {fmtTime(todayRec.clock_in)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between px-4 py-3">
                            <span className="text-sm font-medium flex items-center gap-2">
                              {todayRec.missed_clock_out
                                ? <XCircle className="h-4 w-4 text-amber-400" />
                                : <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                              Clock-Out
                            </span>
                            <span className={`text-sm font-mono font-bold ${todayRec.missed_clock_out ? "text-amber-400" : "text-emerald-400"}`}>
                              {fmtTime(todayRec.clock_out)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between px-4 py-3 bg-muted/20">
                            <span className="text-sm font-medium">Hours Today</span>
                            <span className="text-sm font-bold">
                              {todayRec.hours_worked > 0 ? `${todayRec.hours_worked.toFixed(1)}h` : "—"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                          No record for today yet
                        </div>
                      )}
                    </div>
                  );
                })()}
                <Separator />
                <div className="grid grid-cols-3 gap-2">
                  <StatTile label="Days Tracked" value={totalDays} color="text-foreground" />
                  <StatTile label="Present" value={presentDays} color="text-emerald-400" />
                  <StatTile label="Attend. Rate" value={`${attendanceRate}%`}
                    color={attendanceRate >= 90 ? "text-emerald-400" : attendanceRate >= 75 ? "text-amber-400" : "text-red-400"} />
                </div>
                <div className="bg-muted/40 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Monthly Hours</span>
                    <span className="text-muted-foreground text-xs">{totalHours.toFixed(1)}h / 180h</span>
                  </div>
                  <Progress value={hoursPercent} className="h-2" />
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="attendance" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full px-6 pb-6">
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-4 gap-2">
                  <StatTile label="Missed In"  value={missedIns}    color={missedIns > 0 ? "text-orange-400" : "text-foreground"} />
                  <StatTile label="Missed Out" value={missedOuts}   color={missedOuts > 0 ? "text-amber-400" : "text-foreground"} />
                  <StatTile label="Overtime"   value={overtimeDays} color={overtimeDays > 0 ? "text-blue-400" : "text-foreground"} />
                  <StatTile label="Present"    value={presentDays}  color="text-emerald-400" />
                </div>
                <Separator />
                {attendance.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">No records found.</div>
                ) : (
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
                        {attendance.map(record => (
                          <TableRow key={record.id}
                            className={
                              record.missed_clock_in && record.missed_clock_out ? "bg-red-500/5" :
                              record.missed_clock_in || record.missed_clock_out ? "bg-amber-500/5" : ""
                            }>
                            <TableCell className="py-2 text-xs font-medium">{fmtDate(record.date)}</TableCell>
                            <TableCell className={`py-2 text-xs font-mono ${record.missed_clock_in ? "text-red-400" : "text-emerald-400"}`}>
                              {fmtTime(record.clock_in)}
                            </TableCell>
                            <TableCell className={`py-2 text-xs font-mono ${record.missed_clock_out ? "text-amber-400" : "text-foreground"}`}>
                              {fmtTime(record.clock_out)}
                            </TableCell>
                            <TableCell className="py-2 text-xs">
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

          <TabsContent value="credits" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full px-6 pb-6">
              <div className="space-y-4 pt-2">
                <div className="rounded-xl border overflow-hidden divide-y divide-border">
                  {[
                    { label: "Initial Credit",  value: `GH₵ ${credit?.initial_credit ?? 1500}`,  color: "text-foreground",  desc: "Base monthly allocation" },
                    { label: "Deductions",      value: `-GH₵ ${credit?.deductions ?? 0}`,        color: "text-red-400",     desc: "Missed punch penalties" },
                    { label: "Overtime Bonus",  value: `+GH₵ ${credit?.overtime_credits ?? 0}`,  color: "text-emerald-400", desc: "Approved overtime credits" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-4 bg-muted/30">
                    <div>
                      <p className="text-sm font-bold">Final Credit</p>
                      <p className="text-xs text-muted-foreground">Net balance this month</p>
                    </div>
                    <span className={`text-3xl font-black ${creditColor}`}>GH₵ {finalCredit}</span>
                  </div>
                </div>
                <div className="bg-muted/40 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Monthly Hours vs Target</span>
                    <span className="text-muted-foreground text-xs">{totalHours.toFixed(1)}h / 180h</span>
                  </div>
                  <Progress value={Math.min(100, (totalHours / 180) * 100)} className="h-2" />
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
  const ac         = avatarColor(`${emp.first_name} ${emp.last_name}`);
  const totalExtra = overtimeRecords.reduce((s, r) => s + Math.max(0, r.hours_worked - SCHEDULED_HOURS), 0);
  const totalActual = overtimeRecords.reduce((s, r) => s + r.hours_worked, 0);

  return (
    <button onClick={onClick}
      className="w-full rounded-2xl border border-blue-500/20 bg-blue-500/5 px-4 py-3.5 hover:border-blue-500/40 hover:bg-blue-500/10 transition-all group text-left">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`h-10 w-10 rounded-xl ${ac.bg} ring-1 ${ac.ring} flex items-center justify-center shrink-0`}>
            <span className={`text-xs font-black ${ac.text}`}>{emp.first_name[0]}{emp.last_name[0]}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">{emp.first_name} {emp.last_name}</span>
              {emp.is_department_head && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">Head</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{emp.position} · {emp.emp_code}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">OT Days</p>
            <div className="flex items-center gap-1 justify-end">
              <Flame className="h-3 w-3 text-blue-400" />
              <span className="text-sm font-bold text-blue-400">{overtimeRecords.length}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Extra Hours</p>
            <span className="text-sm font-bold text-blue-400">+{totalExtra.toFixed(1)}h</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-400 transition-colors" />
        </div>
      </div>
      <div className="space-y-1.5 border-t border-blue-500/15 pt-2.5">
        {overtimeRecords.map(r => {
          const extra = Math.max(0, r.hours_worked - SCHEDULED_HOURS);
          return (
            <div key={r.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-blue-500/8 border border-blue-500/15">
              <span className="text-xs font-semibold w-28 shrink-0">
                {new Date(r.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </span>
              <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                <span>In: <span className="font-mono text-foreground">{r.clock_in ? new Date(r.clock_in).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}</span></span>
                <span>Out: <span className="font-mono text-foreground">{r.clock_out ? new Date(r.clock_out).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}</span></span>
              </div>
              <div className="flex items-center gap-2 text-xs shrink-0">
                <span className="text-muted-foreground">{r.hours_worked.toFixed(1)}h total</span>
                <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/25 font-bold text-blue-400 text-[11px]">
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
  const ac = avatarColor(`${emp.first_name} ${emp.last_name}`);

  const hoursColor =
    totalHours < 36 ? "text-red-400" :
    totalHours >= 45 ? "text-emerald-400" : "text-foreground";

  const creditColor =
    finalCredit < 1300 ? "text-red-400" :
    finalCredit < 1500 ? "text-amber-400" : "text-emerald-400";

  return (
    <button onClick={onClick}
      className="w-full rounded-2xl border bg-card px-4 py-3.5 hover:border-primary/30 hover:bg-primary/5 transition-all group text-left">
      <div className="flex items-center gap-3">

        {/* Avatar */}
        <div className={`h-10 w-10 rounded-xl ${ac.bg} ring-1 ${ac.ring} flex items-center justify-center shrink-0`}>
          <span className={`text-xs font-black ${ac.text}`}>
            {emp.first_name[0]}{emp.last_name[0]}
          </span>
        </div>

        {/* Name + details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm">{emp.first_name} {emp.last_name}</span>
            {emp.is_department_head && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                Head
              </span>
            )}
            {missedCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
                {missedCount} missed
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {emp.position} · <span className="font-mono">{emp.emp_code}</span>
          </p>
        </div>

        {/* Right side stats */}
        <div className="flex items-center gap-3 shrink-0">

          {/* Today status */}
          <div className="hidden sm:block">
            {todayRecord
              ? <StatusPill record={todayRecord} />
              : <span className="text-xs text-muted-foreground">No record</span>
            }
          </div>

          {/* Divider */}
          <div className="hidden md:block h-8 w-px bg-border" />

          {/* Hours */}
          <div className="hidden md:block text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-none mb-1">Week Hrs</p>
            <span className={`text-sm font-bold ${hoursColor}`}>
              {totalHours.toFixed(1)}
              <span className="text-[10px] text-muted-foreground font-normal"> / 45</span>
            </span>
          </div>

          {/* Divider */}
          <div className="hidden md:block h-8 w-px bg-border" />

          {/* Credits */}
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-none mb-1">Credits</p>
            <span className={`text-sm font-bold ${creditColor}`}>
              {finalCredit}
            </span>
          </div>

          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-1" />
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

  const visibleEmployees  = employees.slice(0, visibleCount);
  const hasMore           = employees.length > visibleCount;
  const selectedAttendance = selected ? attendance.filter(a => a.employee_id === selected.id) : [];
  const selectedCredit    = selected ? credits.find(c => c.employee_id === selected.id) : undefined;
  const isOvertimeFilter  = activeFilter === "overtime";

  return (
    <>
      <div className="space-y-2">
        {visibleEmployees.map(emp => {
          const empAtt      = attendance.filter(a => a.employee_id === emp.id);
          const empCredit   = credits.find(c => c.employee_id === emp.id);
          const todayRecord = empAtt[0];
          const totalHours  = empAtt.reduce((s, a) => s + a.hours_worked, 0);
          const missedCount = empAtt.filter(a => a.missed_clock_in || a.missed_clock_out).length;
          const finalCredit = empCredit?.final_credit ?? 1500;

          if (isOvertimeFilter) {
            const overtimeRecords = empAtt.filter(a => a.is_overtime);
            if (overtimeRecords.length === 0) return null;
            return (
              <OvertimeRow key={emp.id} emp={emp} overtimeRecords={overtimeRecords}
                onClick={() => setSelected(emp)} />
            );
          }

          return (
            <EmployeeRow key={emp.id} emp={emp} todayRecord={todayRecord}
              totalHours={totalHours} finalCredit={finalCredit} missedCount={missedCount}
              onClick={() => setSelected(emp)} />
          );
        })}

        {hasMore && (
          <div className="flex justify-center pt-2">
            <Button variant="outline" onClick={onSeeMore} className="gap-2">
              See More <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        )}

        {employees.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No employees match the current filters.</p>
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

export default EmployeeList;