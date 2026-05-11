import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { mockEmployees, mockAttendance } from "@/data/mockData";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

const TODAY = new Date().toISOString().split("T")[0];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useGreeting() {
  return useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);
}

function CountUp({ value, duration = 700 }: { value: number; duration?: number }) {
  const [n, setN] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const from = prev.current;
    const start = performance.now();
    let raf: number;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(from + (value - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{n}</>;
}

function initials(first: string, last: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}

function lateBy(expectedHour: number, expectedMin = 0): string {
  const now = new Date();
  const expected = new Date();
  expected.setHours(expectedHour, expectedMin, 0, 0);
  const diff = Math.max(0, Math.round((now.getTime() - expected.getTime()) / 60000));
  if (diff < 60) return `${diff}m late`;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m === 0 ? `${h}h late` : `${h}h ${m}m late`;
}

function isLocum(emp: any) {
  return (
    emp.emp_code?.startsWith("AMC/LOC/") ||
    emp.last_name?.toUpperCase().includes("(LOCUM)")
  );
}

// ─── Build last 7 days of trend data ─────────────────────────────────────────

function useTrendData() {
  return useMemo(() => {
    const totalStaff = mockEmployees.length;
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const ds  = d.toISOString().split("T")[0];
      const day = mockAttendance.filter((a: any) => a.date === ds);
      const present = day.filter((a: any) => !a.missed_clock_in && !a.missed_clock_out).length;
      const expected = day.length || totalStaff;
      const rate = expected > 0 ? Math.round((present / expected) * 100) : 0;
      const isToday = ds === TODAY;
      return {
        day: d.toLocaleDateString("en-GB", { weekday: "short" }),
        date: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        rate, present, expected, isToday,
      };
    });
  }, []);
}

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-card border border-border px-3 py-2 text-[12px] shadow-sm">
      <p className="font-display font-semibold text-foreground mb-1">
        {d.day}, {d.date}{d.isToday && " (today)"}
      </p>
      <p className="text-foreground/70">
        <span className="tabular-nums font-semibold text-foreground">{d.rate}%</span> attendance
      </p>
      <p className="text-foreground/55 text-[11px] mt-0.5 tabular-nums">
        {d.present} of {d.expected} present
      </p>
    </div>
  );
}

// ─── Ring chart ───────────────────────────────────────────────────────────────

function MetricRing({
  count, total, animatedCount,
}: {
  count: number;
  total: number;
  animatedCount: number;
}) {
  const size      = 96;
  const stroke    = 6;
  const radius    = (size - stroke) / 2;
  const circ      = 2 * Math.PI * radius;
  const pct       = total > 0 ? count / total : 0;
  const dashOffset = circ - circ * pct;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--foreground) / 0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--destructive))"
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-bold text-[28px] leading-none text-destructive tabular-nums">
          {animatedCount}
        </span>
        <span className="text-[10px] text-foreground/45 mt-1 tabular-nums">
          {count}/{total}
        </span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Welcome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const greeting = useGreeting();
  const userName = (user?.email?.split("@")[0] ?? "Admin").replace(/\./g, " ");
  const niceName = userName
    .split(" ")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");

  const [resolved] = useState<Set<string>>(new Set());

  const trendData = useTrendData();
  const weekAvg   = Math.round(trendData.reduce((s, d) => s + d.rate, 0) / trendData.length);

  // Use the most recent date that has records — mock data skips weekends so TODAY may return nothing
  const effectiveDate = useMemo(() => {
    const dates = [...new Set(mockAttendance.map((a: any) => a.date as string))].sort().reverse();
    return dates[0] ?? TODAY;
  }, []);

  const isToday = effectiveDate === TODAY;
  const effectiveDateLabel = isToday
    ? "today"
    : new Date(effectiveDate + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  const todayAtt = useMemo(
    () => mockAttendance.filter((a: any) => a.date === effectiveDate),
    [effectiveDate]
  );

  const missingToday = useMemo(() => {
    return todayAtt
      .filter((a: any) => a.missed_clock_in)
      .map((a: any) => {
        const emp = mockEmployees.find((e: any) => e.id === a.employee_id);
        return emp ? { ...emp, attendance: a } : null;
      })
      .filter(Boolean) as any[];
  }, [todayAtt]);

  const presentToday   = todayAtt.filter((a: any) => a.clock_in && !a.missed_clock_in).length;
  const expectedToday  = todayAtt.length || mockEmployees.length;
  const visibleMissing = missingToday.filter((e) => !resolved.has(e.id));

  const fmtDate = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div className="min-h-screen text-foreground antialiased">
      <div className="max-w-[1100px] mx-auto px-6 md:px-12 pt-12 md:pt-16 pb-16">

        {/* Top row: greeting + date */}
        <header className="flex items-start justify-between mb-10">
          <div>
            <p className="text-[19px] md:text-[21px] text-foreground/75 leading-snug">
              {greeting}, <span className="font-display font-semibold text-foreground">{niceName}</span>.
            </p>
          </div>
          <p className="font-bold text-[12px] md:text-[13px] tracking-[0.16em] uppercase text-foreground/55 leading-none mt-2">
            {fmtDate}
          </p>
        </header>

        {/* Heading */}
        <h1 className="font-display font-bold text-[36px] md:text-[44px] tracking-tight leading-[1.05] mb-2">
          Who hasn't clocked in
        </h1>
        <p className="text-[14px] text-foreground/50 mb-8 capitalize">{effectiveDateLabel}</p>

        {/* Summary row */}
        <section className="flex items-center gap-5 mb-8">
          {visibleMissing.length === 0 ? (
            <>
              <div className="w-24 h-24 rounded-full bg-success/10 ring-4 ring-success/15 flex flex-col items-center justify-center shrink-0">
                <span className="font-display font-bold text-[28px] leading-none text-success">{presentToday}</span>
                <span className="text-[10px] text-foreground/55 mt-1 tabular-nums">{presentToday}/{expectedToday}</span>
              </div>
              <div>
                <p className="font-display font-semibold text-[18px] text-foreground leading-tight">Everyone's here.</p>
                <p className="text-[13px] text-foreground/55 mt-1">All {presentToday} expected staff clocked in.</p>
              </div>
            </>
          ) : (
            <>
              <MetricRing count={visibleMissing.length} total={expectedToday} animatedCount={visibleMissing.length} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] tracking-[0.16em] uppercase text-foreground/45 font-display font-semibold mb-1.5">Did not clock in</p>
                <p className="font-display font-semibold text-[18px] text-foreground leading-tight">
                  {visibleMissing.length} {visibleMissing.length === 1 ? "employee" : "employees"} missing
                </p>
                <p className="text-[13px] text-foreground/55 mt-1.5">
                  <span className="font-semibold text-foreground tabular-nums">{presentToday}</span>{" "}
                  <span className="text-foreground/45">of {expectedToday} present</span>
                </p>
              </div>
            </>
          )}
        </section>

        {/* Missing employees list — always shown, empty state if all present */}
        <section className="mb-16">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-[11px] tracking-[0.16em] uppercase text-foreground/55 font-semibold">
              {visibleMissing.length === 0 ? "Absent employees" : `Missing · ${visibleMissing.length} ${visibleMissing.length === 1 ? "person" : "people"}`}
            </h2>
            {visibleMissing.length > 0 && (
              <button
                onClick={() => navigate("/department/all")}
                className="text-[11px] text-foreground/45 hover:text-foreground underline underline-offset-2 transition-colors"
              >
                View all attendance →
              </button>
            )}
          </div>
          <div className="rule-paper mb-3" />

          {visibleMissing.length === 0 ? (
            <div className="flex items-center gap-4 px-4 py-5 bg-card border border-border rounded-md">
              <div className="w-9 h-9 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                <span className="text-success text-[18px]">✓</span>
              </div>
              <p className="text-[14px] text-foreground/60">No missed clock-ins — full attendance recorded.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {visibleMissing.map((emp, idx) => {
                const locum = isLocum(emp);
                const expectedHour = emp.department_name?.includes("Emergency") ? 8 : 7;
                return (
                  <div
                    key={emp.id}
                    className="bg-card border border-border rounded-md px-4 py-3 hover:border-foreground/20 transition-colors"
                    style={{ animation: `fade-in-up 0.5s ${idx * 50}ms ease-out backwards` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:block shrink-0">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-destructive/10 text-destructive border border-destructive/20 tracking-wide uppercase">
                          Absent
                        </span>
                      </div>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-display font-semibold shrink-0
                        ${locum ? "bg-amc-yellow/15 text-amc-yellow ring-1 ring-amc-yellow/30" : "bg-[#EEE8DD] text-amc-blue ring-1 ring-[#E0D8C8]"}`}>
                        {initials(emp.first_name, emp.last_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14px] font-display font-semibold truncate">{emp.first_name} {emp.last_name}</span>
                          {locum && (
                            <span className="text-[10px] font-medium px-1.5 py-px rounded-sm text-amc-yellow bg-amc-yellow/15">Locum</span>
                          )}
                        </div>
                        <p className="text-[12px] text-foreground/55 mt-0.5 truncate">{emp.department_name} · {emp.position ?? "—"}</p>
                      </div>
                      <div className="hidden md:block text-right shrink-0">
                        <p className="text-[10px] text-foreground/45 uppercase tracking-[0.1em] font-display font-semibold leading-none mb-1">Expected</p>
                        <p className="text-[13px] font-display font-semibold text-destructive tabular-nums leading-none">{expectedHour}:00</p>
                        {isToday && (
                          <p className="text-[10px] text-foreground/45 mt-1 tabular-nums">{lateBy(expectedHour)}</p>
                        )}
                      </div>
                      <button
                        onClick={() => navigate("/department/all")}
                        className="shrink-0 px-3 py-1.5 rounded-full border border-border bg-background text-[11px] font-display font-semibold tracking-wide uppercase text-foreground/70 hover:text-foreground hover:border-foreground/30 transition-colors"
                      >
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 7-day trend */}
        <section className="mb-16">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-display text-[11px] tracking-[0.16em] uppercase text-foreground/55 font-semibold">
              7-day attendance trend
            </h2>
            <span className="text-[11px] text-foreground/45 tabular-nums">
              {weekAvg}% avg attendance
            </span>
          </div>
          <div className="rule-paper mb-6" />

          <div className="bg-card border border-border rounded-md p-5 md:p-6">
            <div className="flex items-baseline justify-between mb-1">
              <p className="font-display font-semibold text-[13px] text-foreground">
                Daily attendance rate
              </p>
              <p className="text-[11px] text-foreground/45">
                Past 7 days
              </p>
            </div>
            <p className="text-[12px] text-foreground/55 mb-5">
              Percentage of expected staff who clocked in.
            </p>

            <div className="h-[220px] -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData}
                  margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="rateFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="hsl(var(--foreground))" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="2 4"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "hsl(var(--foreground) / 0.55)", fontFamily: "League Spartan" }}
                    tickLine={false}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 11, fill: "hsl(var(--foreground) / 0.55)", fontFamily: "League Spartan" }}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                  />

                  <ReferenceLine
                    y={90}
                    stroke="hsl(var(--success))"
                    strokeDasharray="3 3"
                    strokeOpacity={0.5}
                    label={{
                      value: "Target 90%",
                      position: "right",
                      fill: "hsl(var(--success))",
                      fontSize: 10,
                      fontFamily: "League Spartan",
                    }}
                  />

                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ stroke: "hsl(var(--foreground) / 0.2)", strokeWidth: 1 }}
                  />

                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="hsl(var(--foreground))"
                    strokeWidth={1.75}
                    fill="url(#rateFill)"
                    dot={{
                      fill: "hsl(var(--background))",
                      stroke: "hsl(var(--foreground))",
                      strokeWidth: 1.5,
                      r: 3,
                    }}
                    activeDot={{
                      fill: "hsl(var(--foreground))",
                      stroke: "hsl(var(--background))",
                      strokeWidth: 2,
                      r: 5,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/60 text-[11px] text-foreground/55">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-px bg-foreground" />
                Attendance rate
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-px border-t border-dashed border-success" />
                Target 90%
              </span>
            </div>
          </div>
        </section>

        <p className="font-display text-[10px] tracking-[0.20em] uppercase text-foreground/30 text-center mt-20 font-semibold">
          Accra Medical Centre · Workforce
        </p>

      </div>
    </div>
  );
}