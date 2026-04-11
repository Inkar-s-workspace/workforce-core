import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { mockEmployees, mockAttendance, mockCredits } from "@/data/mockData";
import {
  Users, Clock, AlertTriangle, TrendingUp, Shield,
  Download, CalendarDays, Building2, ChevronRight,
  CheckCircle2, XCircle, Timer, Activity, Flame,
  BadgeAlert, ArrowUpRight, Info, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const MONTHLY_HOURS = 180;
const WEEKLY_HOURS  = 45;

function useGreeting() {
  return useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);
}
function deptSlug(name: string) {
  return name.toLowerCase().replace(/\s+&\s+/g, "-").replace(/\s+/g, "-");
}
function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

const TODAY      = new Date().toISOString().split("T")[0];
const DATE_LABEL = new Date().toLocaleDateString("en-US", {
  weekday: "long", year: "numeric", month: "long", day: "numeric",
});

const C_PRIMARY     = "hsl(220 60% 55%)";
const C_SUCCESS     = "hsl(152 60% 45%)";
const C_WARNING     = "hsl(38 92% 55%)";
const C_DESTRUCTIVE = "hsl(0 72% 56%)";
const C_MUTED       = "hsl(220 15% 55%)";

function useDashboardData(employees: any[], attendance: any[], credits: any[]) {
  return useMemo(() => {
    const todayAtt   = attendance.filter(a => a.date === TODAY);
    const missedIn   = attendance.filter(a => a.missed_clock_in).length;
    const missedOut  = attendance.filter(a => a.missed_clock_out).length;
    const overtime   = attendance.filter(a => a.is_overtime).length;
    const present    = attendance.filter(a => !a.missed_clock_in && !a.missed_clock_out).length;
    const missedBoth = attendance.filter(a => a.missed_clock_in && a.missed_clock_out).length;

    const clockedInToday    = todayAtt.filter(a => a.clock_in && !a.missed_clock_in).length;
    const notClockedInToday = todayAtt.filter(a => a.missed_clock_in).length;
    const clockedOutToday   = todayAtt.filter(a => a.clock_out && !a.missed_clock_out).length;
    const stillOnShift      = todayAtt.filter(a => a.clock_in && !a.clock_out && !a.missed_clock_out).length;

    const totalDeductions = credits.reduce((s, c) => s + c.deductions, 0);
    const avgCredit       = credits.length
      ? Math.round(credits.reduce((s, c) => s + c.final_credit, 0) / credits.length)
      : 0;

    const totalHours   = attendance.reduce((s, a) => s + a.hours_worked, 0);
    const avgHours     = attendance.length ? totalHours / attendance.length : 0;
    const overtimeHrs  = attendance.filter(a => a.is_overtime).reduce((s, a) => s + Math.max(0, a.hours_worked - 8), 0);

    const missedPunches = missedIn + missedOut;
    const deductions    = missedPunches * 100;

    const trendData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const ds  = d.toISOString().split("T")[0];
      const day = attendance.filter(a => a.date === ds);
      return {
        day:     d.toLocaleDateString("en-US", { weekday: "short" }),
        date:    ds,
        present: day.filter(a => !a.missed_clock_in && !a.missed_clock_out).length,
        missed:  day.filter(a => a.missed_clock_in || a.missed_clock_out).length,
        overtime:day.filter(a => a.is_overtime).length,
        hours:   day.reduce((s, a) => s + a.hours_worked, 0).toFixed(1),
      };
    });

    const deptMap = new Map<string, { name: string; total: number; missed: number; hours: number }>();
    employees.forEach(e => {
      if (!deptMap.has(e.department_id)) {
        deptMap.set(e.department_id, { name: e.department_name, total: 0, missed: 0, hours: 0 });
      }
      deptMap.get(e.department_id)!.total++;
    });
    attendance.forEach(a => {
      const emp  = employees.find(e => e.id === a.employee_id);
      if (!emp) return;
      const dept = deptMap.get(emp.department_id);
      if (!dept) return;
      if (a.missed_clock_in || a.missed_clock_out) dept.missed++;
      dept.hours += a.hours_worked;
    });
    const deptData = Array.from(deptMap.values());

    const attPie = [
      { name: "Present",     value: present,              color: C_SUCCESS          },
      { name: "Missed In",   value: missedIn - missedBoth, color: C_WARNING          },
      { name: "Missed Out",  value: missedOut - missedBoth,color: C_DESTRUCTIVE      },
      { name: "Missed Both", value: missedBoth,            color: "hsl(0 72% 40%)"   },
    ].filter(x => x.value > 0);

    const empHours = new Map<string, number>();
    attendance.forEach(a => empHours.set(a.employee_id, (empHours.get(a.employee_id) ?? 0) + a.hours_worked));
    const topPerformers = employees
      .map(e => ({ ...e, hours: empHours.get(e.id) ?? 0 }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);

    const attIssues = new Map<string, number>();
    attendance.forEach(a => {
      if (a.missed_clock_in || a.missed_clock_out) {
        attIssues.set(a.employee_id, (attIssues.get(a.employee_id) ?? 0) + 1);
      }
    });
    const needsAttention = employees
      .map(e => ({ ...e, issues: attIssues.get(e.id) ?? 0 }))
      .filter(e => e.issues > 0)
      .sort((a, b) => b.issues - a.issues)
      .slice(0, 5);

    return {
      totalStaff: employees.length,
      missedIn, missedOut, overtime, present, missedBoth,
      clockedInToday, notClockedInToday, clockedOutToday, stillOnShift,
      totalDeductions, avgCredit,
      totalHours, avgHours, overtimeHrs,
      missedPunches, deductions,
      trendData, deptData, attPie,
      topPerformers, needsAttention,
    };
  }, [employees, attendance, credits]);
}

export default function Welcome() {
  const { user, role } = useAuth();
  const navigate       = useNavigate();
  const greeting       = useGreeting();

  // Using mock data — swap these for useEmployees/useAttendance when Supabase is connected
  const employees  = mockEmployees;
  const attendance = mockAttendance;
  const credits    = mockCredits;
  const departments = mockEmployees
    .map(e => ({ id: e.department_id, name: e.department_name }))
    .filter((d, i, arr) => arr.findIndex(x => x.id === d.id) === i);

  const data     = useDashboardData(employees, attendance, credits);
  const userName = user?.email?.split("@")[0] ?? "admin";

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs uppercase tracking-wide">
              {role ?? "staff"}
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {greeting}, {userName} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{DATE_LABEL}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => navigate("/reports")}>
            <Download className="h-4 w-4 mr-1" /> Reports
          </Button>
          <Button size="sm" onClick={() => navigate("/attendance")}>
            <CalendarDays className="h-4 w-4 mr-1" /> Attendance
          </Button>
        </div>
      </div>

      {/* ── Top stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Staff",      value: data.totalStaff,         icon: Users,         color: "text-primary",     bg: "bg-primary/10"     },
          { label: "Missed Punches",   value: data.missedPunches,      icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
          { label: "Overtime Records", value: data.overtime,           icon: TrendingUp,    color: "text-warning",     bg: "bg-warning/10"     },
          { label: "Total Deductions", value: `GH₵${data.deductions}`, icon: Shield,        color: "text-success",     bg: "bg-success/10"     },
        ].map(s => (
          <Card key={s.label} className="p-4 flex items-center gap-3">
            <div className={`${s.bg} p-2.5 rounded-lg shrink-0`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Today + 7-day trend + pie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Today — {TODAY}</h3>
            <Badge variant="secondary" className="text-xs">Live</Badge>
          </div>
          {[
            { label: "Clocked In",     value: data.clockedInToday,    color: "text-success",    icon: CheckCircle2 },
            { label: "Not Clocked In", value: data.notClockedInToday, color: "text-destructive", icon: XCircle      },
            { label: "Clocked Out",    value: data.clockedOutToday,   color: "text-primary",     icon: Clock        },
            { label: "Still On Shift", value: data.stillOnShift,      color: "text-warning",     icon: Timer        },
          ].map(r => (
            <div key={r.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <r.icon className={`h-3.5 w-3.5 ${r.color}`} />
                {r.label}
              </div>
              <span className={`font-bold text-sm ${r.color}`}>{r.value}</span>
            </div>
          ))}
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3">7-Day Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={data.trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend iconType="circle" iconSize={8} />
              <Area type="monotone" dataKey="present"  name="Present"   stroke={C_SUCCESS}     fill={C_SUCCESS}     fillOpacity={0.15} />
              <Area type="monotone" dataKey="missed"   name="Missed In" stroke={C_DESTRUCTIVE} fill={C_DESTRUCTIVE} fillOpacity={0.15} />
              <Area type="monotone" dataKey="overtime" name="Overtime"  stroke={C_WARNING}     fill={C_WARNING}     fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3">Attendance Breakdown</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={data.attPie} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                {data.attPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v}`, n]} />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Top performers + Needs attention ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-warning" />
            <h3 className="font-semibold text-sm">Top Performers (Hours)</h3>
          </div>
          <div className="space-y-2">
            {data.topPerformers.map((e, i) => (
              <div key={e.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium">{e.first_name} {e.last_name}</p>
                    <p className="text-xs text-muted-foreground">{e.department_name}</p>
                  </div>
                </div>
                <Badge variant="secondary">{e.hours.toFixed(1)}h</Badge>
              </div>
            ))}
            {data.topPerformers.length === 0 && <p className="text-xs text-muted-foreground">No data yet</p>}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <BadgeAlert className="h-4 w-4 text-destructive" />
            <h3 className="font-semibold text-sm">Needs Attention</h3>
          </div>
          <div className="space-y-2">
            {data.needsAttention.map(e => (
              <div key={e.id} className="flex items-center justify-between py-1.5">
                <div>
                  <p className="text-sm font-medium">{e.first_name} {e.last_name}</p>
                  <p className="text-xs text-muted-foreground">{e.department_name}</p>
                </div>
                <Badge variant="destructive">{e.issues} issue{e.issues > 1 ? "s" : ""}</Badge>
              </div>
            ))}
            {data.needsAttention.length === 0 && <p className="text-xs text-muted-foreground">✓ All staff on track</p>}
          </div>
        </Card>
      </div>

      {/* ── Departments quick-nav ── */}
      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4" /> Departments
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {departments.map(dept => {
            const deptEmps = employees.filter(e => e.department_id === dept.id);
            return (
              <button key={dept.id} onClick={() => navigate(`/attendance?dept=${dept.id}`)}
                className="flex flex-col items-center p-3 rounded-xl border hover:bg-accent transition-colors text-center group">
                <span className="text-sm font-semibold group-hover:text-primary transition-colors">{dept.name}</span>
                <span className="text-xs text-muted-foreground mt-1">{deptEmps.length} staff</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground mt-1 group-hover:text-primary transition-colors" />
              </button>
            );
          })}
        </div>
      </Card>

    </div>
  );
}