/**
 * Metrics page
 * ─────────────────────────────────────────────────────────────────────────────
 * One page that handles all 4 metrics — punctuality, absenteeism, shift
 * adherence, overtime. Reads the slug from the URL (`/metrics/:slug`) to pick
 * which metric to render. Has a today/week/month toggle.
 *
 * Math:
 *   Punctuality   → % of clock-ins before expected start
 *   Absenteeism   → % of expected shifts where the person didn't show up
 *   Adherence     → % of scheduled shifts where staff clocked in AND out
 *                   at appropriate times
 *   Overtime      → % of staff who worked beyond their scheduled hours
 *
 * The math is calibrated against mockData; once BioTime is connected, swap
 * the data source and the computations stay the same.
 */

import { useMemo, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { useAttendance } from "@/hooks/useAttendance";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

type Range = "today" | "week" | "month";

type MetricSlug = "punctuality" | "absenteeism" | "adherence" | "overtime";

interface MetricDef {
  slug: MetricSlug;
  title: string;
  subtitle: string;
  description: string;
  /** Higher = better (e.g. punctuality, adherence) or worse (absenteeism, overtime) */
  direction: "up_good" | "down_good";
  /** Target line on the chart (e.g. 90 means 90% target) */
  target: number;
  targetLabel: string;
  unit: "percent";
}

const METRICS: Record<MetricSlug, MetricDef> = {
  punctuality: {
    slug: "punctuality",
    title: "Punctuality rate",
    subtitle: "On-time clock-ins as a share of all clock-ins",
    description:
      "Counts a clock-in as punctual if it happened before the expected shift start. People who showed up but were late count as present, but not punctual.",
    direction: "up_good",
    target: 90,
    targetLabel: "Target 90%",
    unit: "percent",
  },
  absenteeism: {
    slug: "absenteeism",
    title: "Absenteeism rate",
    subtitle: "Expected shifts where staff didn't show up",
    description:
      "The share of expected shifts where the person was a no-show. Doesn't include approved leave, only unaccounted absences.",
    direction: "down_good",
    target: 5,
    targetLabel: "Target ≤5%",
    unit: "percent",
  },
  adherence: {
    slug: "adherence",
    title: "Shift adherence",
    subtitle: "Shifts that were clocked in AND out correctly",
    description:
      "The strictest of the four: a shift only counts as 'adhered' if the person clocked in on time and clocked out at the expected end time.",
    direction: "up_good",
    target: 85,
    targetLabel: "Target 85%",
    unit: "percent",
  },
  overtime: {
    slug: "overtime",
    title: "Overtime rate",
    subtitle: "Staff working beyond scheduled hours",
    description:
      "The share of staff who worked beyond their scheduled hours in the period. Some overtime is healthy; consistently high overtime usually signals a staffing gap.",
    direction: "down_good",
    target: 15,
    targetLabel: "Target ≤15%",
    unit: "percent",
  },
};

// ─── Math helpers ─────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split("T")[0];

function dateRangeForToggle(range: Range): { start: Date; end: Date; days: number } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (range === "week")  start.setDate(start.getDate() - 6);
  if (range === "month") start.setDate(start.getDate() - 29);
  const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  return { start, end, days };
}

/**
 * Compute the metric value for a given attendance subset.
 * All four metrics return a percentage 0–100.
 */
function computeMetric(slug: MetricSlug, atts: any[]): number {
  if (atts.length === 0) return 0;

  switch (slug) {
    case "punctuality": {
      // % of clock-ins that were before expected start (we treat <8:00 as on time)
      const withClockIn = atts.filter((a) => a.clock_in);
      if (!withClockIn.length) return 0;
      const onTime = withClockIn.filter((a) => {
        const t = new Date(a.clock_in);
        return t.getHours() < 8 || (t.getHours() === 8 && t.getMinutes() === 0);
      });
      return Math.round((onTime.length / withClockIn.length) * 100);
    }
    case "absenteeism": {
      const noShow = atts.filter((a) => a.missed_clock_in && a.missed_clock_out);
      return Math.round((noShow.length / atts.length) * 100);
    }
    case "adherence": {
      const adhered = atts.filter(
        (a) => a.clock_in && a.clock_out && !a.missed_clock_in && !a.missed_clock_out
      );
      return Math.round((adhered.length / atts.length) * 100);
    }
    case "overtime": {
      const ot = atts.filter((a) => a.is_overtime);
      // % of distinct staff with overtime in the period
      const staffWithOT  = new Set(ot.map((a) => a.employee_id)).size;
      const staffInRange = new Set(atts.map((a) => a.employee_id)).size;
      if (!staffInRange) return 0;
      return Math.round((staffWithOT / staffInRange) * 100);
    }
  }
}

/** Build the daily series for the chart (always 7 or 30 days depending on toggle) */
function useDailySeries(slug: MetricSlug, range: Range, attendance: any[]) {
  return useMemo(() => {
    const days = range === "today" ? 1 : range === "week" ? 7 : 30;
    return Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const ds  = d.toISOString().split("T")[0];
      const dayAtts = attendance.filter((a: any) => a.date === ds);
      const value = computeMetric(slug, dayAtts);
      return {
        day: d.toLocaleDateString("en-GB", { weekday: "short" }),
        date: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        value,
        sample: dayAtts.length,
        isToday: ds === TODAY,
      };
    });
  }, [slug, range, attendance]);
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, unit }: any) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-card border border-border px-3 py-2 text-[12px] shadow-sm">
      <p className="font-display font-semibold text-foreground mb-1">
        {d.day}, {d.date}{d.isToday && " (today)"}
      </p>
      <p className="text-foreground/70 tabular-nums">
        <span className="font-semibold text-foreground">{d.value}{unit === "percent" ? "%" : ""}</span>
      </p>
      <p className="text-foreground/55 text-[11px] mt-0.5">
        {d.sample} {d.sample === 1 ? "record" : "records"}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Metrics() {
  const { slug } = useParams<{ slug: string }>();
  const metric   = slug && (slug in METRICS) ? METRICS[slug as MetricSlug] : null;
  const [range, setRange] = useState<Range>("week");

  // Fetch 60 days so both current and comparison periods are covered
  const startDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 59);
    return d.toISOString().split("T")[0];
  }, []);
  const { attendance } = useAttendance({ startDate });

  if (!metric) return <Navigate to="/metrics/punctuality" replace />;

  // ─── Computations ───────────────────────────────────────────────────────────

  const { start, end } = dateRangeForToggle(range);

  const periodAtts = useMemo(() => {
    return attendance.filter((a: any) => {
      const d = new Date(a.date);
      return d >= start && d <= end;
    });
  }, [attendance, start, end]);

  const periodValue = computeMetric(metric.slug, periodAtts);

  // Compute the previous-period value for comparison
  const prevAtts = useMemo(() => {
    const dayCount = range === "today" ? 1 : range === "week" ? 7 : 30;
    const prevEnd   = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - dayCount + 1);
    return attendance.filter((a: any) => {
      const d = new Date(a.date);
      return d >= prevStart && d <= prevEnd;
    });
  }, [attendance, start, range]);

  const prevValue = computeMetric(metric.slug, prevAtts);
  const change    = periodValue - prevValue;

  // Series for the chart (skip today-only)
  const series = useDailySeries(metric.slug, range, attendance);

  // Direction analysis — is the change good or bad?
  const isImproving =
    metric.direction === "up_good" ? change > 0 :
    metric.direction === "down_good" ? change < 0 :
    false;
  const isDeclining =
    metric.direction === "up_good" ? change < 0 :
    metric.direction === "down_good" ? change > 0 :
    false;

  const isHittingTarget =
    metric.direction === "up_good"   ? periodValue >= metric.target :
    metric.direction === "down_good" ? periodValue <= metric.target :
    false;

  // ─── UI ─────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-[1100px] mx-auto px-6 md:px-10 pt-10 md:pt-14 pb-16">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <header className="mb-10 pb-6 border-b border-foreground/10">
        <p className="text-[12px] tracking-[0.16em] uppercase text-foreground/45 font-display font-semibold mb-2">
          Metrics
        </p>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display font-bold text-[34px] md:text-[40px] tracking-tight leading-tight">
              {metric.title}
            </h1>
            <p className="text-[13px] text-foreground/55 mt-1.5 max-w-xl">
              {metric.subtitle}
            </p>
          </div>

          {/* Time range toggle */}
          <div className="inline-flex border border-border rounded p-0.5 bg-card">
            {(["today", "week", "month"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded text-[12px] font-display font-semibold transition-colors capitalize
                  ${range === r
                    ? "bg-foreground text-background"
                    : "text-foreground/60 hover:text-foreground"
                  }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── The headline number ───────────────────────────────────────── */}
      <section className="mb-12">
        <div className="flex items-baseline gap-6 flex-wrap">
          <h2 className="font-display font-bold leading-none tabular-nums">
            <span className={`text-[88px] md:text-[120px] ${
              isHittingTarget ? "text-foreground" : "text-destructive"
            }`}>
              {periodValue}
              <span className="text-[44px] md:text-[60px] text-foreground/40 ml-1">%</span>
            </span>
          </h2>

          {/* Compared-to chip + target chip */}
          <div className="flex flex-col gap-2 mb-3">
            {prevValue > 0 && (
              <div className="flex items-center gap-1.5 text-[12px]">
                {change === 0 ? (
                  <>
                    <Minus className="h-3 w-3 text-foreground/40" />
                    <span className="text-foreground/55">No change</span>
                  </>
                ) : isImproving ? (
                  <>
                    {metric.direction === "up_good" ? (
                      <ArrowUpRight className="h-3 w-3 text-success" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-success" />
                    )}
                    <span className="text-success font-semibold tabular-nums">
                      {Math.abs(change)} pp
                    </span>
                    <span className="text-foreground/55">vs previous {range}</span>
                  </>
                ) : isDeclining ? (
                  <>
                    {metric.direction === "up_good" ? (
                      <ArrowDownRight className="h-3 w-3 text-destructive" />
                    ) : (
                      <ArrowUpRight className="h-3 w-3 text-destructive" />
                    )}
                    <span className="text-destructive font-semibold tabular-nums">
                      {Math.abs(change)} pp
                    </span>
                    <span className="text-foreground/55">vs previous {range}</span>
                  </>
                ) : null}
              </div>
            )}

            <div className="flex items-center gap-1.5 text-[12px]">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  isHittingTarget ? "bg-success" : "bg-destructive"
                }`}
              />
              <span className={isHittingTarget ? "text-success" : "text-destructive"}>
                {isHittingTarget ? "Above target" : "Below target"}
              </span>
              <span className="text-foreground/45">·</span>
              <span className="text-foreground/55 tabular-nums">{metric.targetLabel}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-[13px] text-foreground/60 leading-relaxed max-w-2xl mt-6">
          {metric.description}
        </p>
      </section>

      {/* ── Chart (only when range > today) ───────────────────────────── */}
      {range !== "today" && (
        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-display text-[11px] tracking-[0.16em] uppercase text-foreground/55 font-semibold">
              Trend
            </h2>
            <span className="text-[11px] text-foreground/45">
              Last {range === "week" ? "7" : "30"} days
            </span>
          </div>
          <div className="rule-paper mb-6" />

          <div className="bg-card border border-border rounded-md p-5 md:p-6">
            <p className="font-display font-semibold text-[13px] text-foreground mb-1">
              Daily {metric.title.toLowerCase()}
            </p>
            <p className="text-[12px] text-foreground/55 mb-5">
              Hover the line for daily details.
            </p>

            <div className="h-[240px] -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={series}
                  margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="metricFill" x1="0" y1="0" x2="0" y2="1">
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
                    dataKey={range === "month" ? "date" : "day"}
                    interval={range === "month" ? 4 : 0}
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
                    y={metric.target}
                    stroke="hsl(var(--success))"
                    strokeDasharray="3 3"
                    strokeOpacity={0.5}
                    label={{
                      value: metric.targetLabel,
                      position: "right",
                      fill: "hsl(var(--success))",
                      fontSize: 10,
                      fontFamily: "League Spartan",
                    }}
                  />

                  <Tooltip
                    content={<ChartTooltip unit={metric.unit} />}
                    cursor={{ stroke: "hsl(var(--foreground) / 0.2)", strokeWidth: 1 }}
                  />

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--foreground))"
                    strokeWidth={1.75}
                    fill="url(#metricFill)"
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
                {metric.title}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-px border-t border-dashed border-success" />
                {metric.targetLabel}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ── Cross-metric quick links ──────────────────────────────────── */}
      <section className="pt-8">
        <div className="rule-paper mb-6" />
        <p className="font-display text-[11px] tracking-[0.16em] uppercase text-foreground/40 font-semibold mb-4">
          Other metrics
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.values(METRICS)
            .filter((m) => m.slug !== metric.slug)
            .map((m) => (
              <a
                key={m.slug}
                href={`/metrics/${m.slug}`}
                className="group block py-3 px-4 border border-border rounded-md bg-card hover:border-foreground/30 transition-colors"
              >
                <p className="text-[10px] text-foreground/45 tracking-[0.12em] uppercase font-display font-semibold mb-1">
                  {m.targetLabel}
                </p>
                <p className="font-display font-semibold text-[14px] text-foreground group-hover:text-destructive transition-colors">
                  {m.title}
                </p>
              </a>
            ))}
        </div>
      </section>

    </div>
  );
}