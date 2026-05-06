import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { mockEmployees, mockAttendance } from "@/data/mockData";
import { MessageSquare, Check, ArrowUpRight } from "lucide-react";
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
  if (diff < 60) return `${diff} min late`;
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

  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [exiting,  setExiting]  = useState<Set<string>>(new Set());

  const trendData = useTrendData();
  const weekAvg   = Math.round(trendData.reduce((s, d) => s + d.rate, 0) / trendData.length);

  const todayAtt = useMemo(
    () => mockAttendance.filter((a: any) => a.date === TODAY),
    []
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

  const handleResolve = (id: string) => {
    setExiting((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setResolved((prev) => new Set(prev).add(id));
      setExiting((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 320);
  };

  const fmtDate = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });

  // ─── UI ─────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen text-foreground antialiased">
      <div className="max-w-[880px] mx-auto px-6 md:px-12 pt-14 md:pt-24 pb-16">

        {/* ── Date strip ──────────────────────────────────────────────── */}
        <header className="mb-14 md:mb-20">
          <p className="font-bold text-[16px] md:text-[18px] tracking-[0.16em] uppercase text-foreground/60 leading-none">
            {fmtDate}
          </p>
        </header>

        {/* ── Greeting ──────────────────────────────────────────────────── */}
        <p className="text-[19px] md:text-[21px] text-foreground/75 leading-snug mb-10">
          {greeting}, <span className="font-display font-semibold text-foreground">{niceName}</span>.
        </p>

        {/* ── The headline moment ───────────────────────────────────────── */}
        <section className="mb-16">
          {visibleMissing.length === 0 ? (
            <div>
              <h1 className="font-display text-[58px] md:text-[78px] leading-[0.95] tracking-tight">
                Everyone's <span className="text-amc-yellow">here</span>.
              </h1>
              <p className="mt-7 text-[14px] text-foreground/55 max-w-md leading-relaxed">
                All {presentToday} expected staff have clocked in this morning.
                Nothing needs your attention right now.
              </p>
            </div>
          ) : (
            <div>
              <h1 className="font-display leading-[0.92] tracking-tight">
                <span className="block text-[84px] md:text-[120px] text-destructive tabular-nums font-bold">
                  <CountUp value={visibleMissing.length} />
                </span>
                <span className="block text-[26px] md:text-[34px] mt-2 max-w-[14ch] font-semibold text-foreground">
                  {visibleMissing.length === 1 ? "person hasn't" : "people haven't"} clocked in yet.
                </span>
              </h1>

              <p className="mt-8 text-[13px] text-foreground/55 flex items-center gap-3">
                <span>
                  <span className="text-foreground font-semibold">{presentToday}</span> of {expectedToday} present
                </span>
                <span className="h-px w-6 bg-foreground/15" />
                <span className="text-foreground/50">
                  {Math.round((presentToday / Math.max(1, expectedToday)) * 100)}% on time
                </span>
              </p>
            </div>
          )}
        </section>

        {/* ── Missing list ──────────────────────────────────────────────── */}
        {visibleMissing.length > 0 && (
          <section className="mb-16">
            <div className="flex items-baseline justify-between mb-5 pb-3">
              <h2 className="font-display text-[11px] tracking-[0.16em] uppercase text-foreground/55 font-semibold">
                Missing
              </h2>
              <span className="text-[11px] text-foreground/40">
                {visibleMissing.length} {visibleMissing.length === 1 ? "person" : "people"}
              </span>
            </div>
            <div className="rule-paper mb-1" />

            <ul className="divide-y divide-border/70">
              {visibleMissing.map((emp, idx) => {
                const locum = isLocum(emp);
                const expectedHour = emp.department_name?.includes("Emergency") ? 8 : 7;
                const isExiting = exiting.has(emp.id);

                return (
                  <li
                    key={emp.id}
                    className="group transition-all duration-300"
                    style={{
                      animation: isExiting
                        ? "slide-out-right 0.32s ease-in forwards"
                        : `fade-in-up 0.5s ${idx * 50}ms ease-out backwards`,
                    }}
                  >
                    <div className="flex items-center gap-4 py-4">
                      {/* AVATAR — unified cream + AMC blue ink, locum keeps yellow */}
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-display font-semibold shrink-0 transition-all
                          ${locum
                            ? "bg-amc-yellow/15 text-amc-yellow ring-1 ring-amc-yellow/30"
                            : "bg-[#EEE8DD] text-amc-blue ring-1 ring-[#E0D8C8]"
                          }`}
                      >
                        {initials(emp.first_name, emp.last_name)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14px] font-display font-semibold truncate">
                            {emp.first_name} {emp.last_name}
                          </span>
                          {locum && (
                            <span className="text-[10px] font-medium px-1.5 py-px rounded-sm text-amc-yellow bg-amc-yellow/12">
                              Locum
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-foreground/55 mt-0.5 truncate">
                          {emp.department_name}
                          <span className="text-foreground/25 mx-1.5">·</span>
                          expected {expectedHour}:00
                        </p>
                      </div>

                      <div className="hidden sm:flex flex-col items-end shrink-0 mr-1">
                        <p className="text-[12px] font-semibold text-destructive tabular-nums">
                          {lateBy(expectedHour)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[12px] text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors"
                          onClick={() => alert(`Message ${emp.first_name} (placeholder)`)}
                          aria-label={`Message ${emp.first_name}`}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span className="hidden md:inline">Message</span>
                        </button>
                        <button
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[12px] text-foreground/70 hover:text-success hover:bg-success/10 transition-colors"
                          onClick={() => handleResolve(emp.id)}
                          aria-label={`Resolve ${emp.first_name}`}
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span className="hidden md:inline">Resolve</span>
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* ── 7-day attendance trend ────────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-display text-[11px] tracking-[0.16em] uppercase text-foreground/55 font-semibold">
              This week
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

        {/* ── Secondary nav ─────────────────────────────────────────────── */}
        <nav className="pt-8">
          <div className="rule-paper mb-6" />
          <p className="font-display text-[11px] tracking-[0.16em] uppercase text-foreground/40 font-semibold mb-4">
            Or jump to
          </p>
          <ul className="space-y-1">
            <NavLinkRow
              label="Full team roster"
              detail={`${mockEmployees.length} people across all departments`}
              onClick={() => navigate("/department/all")}
            />
            <NavLinkRow
              label="Duty roster"
              detail="This month's schedule"
              onClick={() => navigate("/roster")}
            />
            <NavLinkRow
              label="Reports"
              detail="Export attendance and credits"
              onClick={() => navigate("/reports")}
            />
          </ul>
        </nav>

        <p className="font-display text-[10px] tracking-[0.20em] uppercase text-foreground/30 text-center mt-24 font-semibold">
          Accra Medical Centre · Workforce
        </p>

      </div>
    </div>
  );
}

// ─── Small sub-component ──────────────────────────────────────────────────────

function NavLinkRow({
  label, detail, onClick,
}: {
  label: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className="group w-full flex items-baseline justify-between py-3 text-left border-b border-transparent hover:border-foreground/15 transition-colors"
      >
        <span className="flex items-baseline gap-3">
          <span className="text-[15px] font-display font-semibold text-foreground group-hover:text-destructive transition-colors">
            {label}
          </span>
          <span className="text-[12px] text-foreground/45">{detail}</span>
        </span>
        <ArrowUpRight className="h-3.5 w-3.5 text-foreground/25 group-hover:text-foreground/70 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
      </button>
    </li>
  );
}