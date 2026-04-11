/**
 * useAttendance.ts
 *
 * Fetches attendance records + credit balances from Supabase.
 * Replaces: import { mockAttendance, mockCredits } from "@/data/mockData"
 *
 * Usage:
 *   const { attendance, credits, loading } = useAttendance()
 *   const { attendance } = useAttendance({ departmentId, startDate, endDate })
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AttendanceRecord, CreditBalance } from "@/types/attendance";

interface UseAttendanceOptions {
  departmentId?: string | null;
  employeeIds?:  string[];          // pre-filtered list (optional)
  startDate?:    string;            // "YYYY-MM-DD"
  endDate?:      string;            // "YYYY-MM-DD"
  month?:        number;
  year?:         number;
}

interface UseAttendanceResult {
  attendance: AttendanceRecord[];
  credits:    CreditBalance[];
  loading:    boolean;
  error:      string | null;
  refetch:    () => void;
}

// Default: last 7 days
function defaultDates() {
  const end   = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate:   end.toISOString().split("T")[0],
  };
}

export function useAttendance(
  options: UseAttendanceOptions = {}
): UseAttendanceResult {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [credits,    setCredits]    = useState<CreditBalance[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [tick,       setTick]       = useState(0);

  const refetch = () => setTick(t => t + 1);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const dates = defaultDates();
        const startDate = options.startDate ?? dates.startDate;
        const endDate   = options.endDate   ?? dates.endDate;
        const now       = new Date();
        const month     = options.month ?? now.getMonth() + 1;
        const year      = options.year  ?? now.getFullYear();

        // ── Resolve employee IDs ─────────────────────────────────────────────
        // If departmentId given, first get the employee IDs for that dept
        let empIds: string[] | null = options.employeeIds ?? null;

        if (options.departmentId && !empIds) {
          const { data: depEmps, error: depErr } = await supabase
            .from("employees")
            .select("id")
            .eq("department_id", options.departmentId);

          if (depErr) throw new Error(depErr.message);
          if (cancelled) return;
          empIds = (depEmps ?? []).map(e => e.id);
          // No employees in dept → return empty
          if (empIds.length === 0) {
            setAttendance([]);
            setCredits([]);
            setLoading(false);
            return;
          }
        }

        // ── Attendance ───────────────────────────────────────────────────────
        let attQuery = supabase
          .from("attendance_records")
          .select("*")
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date", { ascending: false });

        if (empIds) attQuery = attQuery.in("employee_id", empIds);

        const { data: attData, error: attErr } = await attQuery;
        if (attErr) throw new Error(attErr.message);
        if (cancelled) return;

        const attList: AttendanceRecord[] = (attData ?? []).map(a => ({
          id:               a.id,
          employee_id:      a.employee_id,
          date:             a.date,
          clock_in:         a.clock_in,
          clock_out:        a.clock_out,
          missed_clock_in:  a.missed_clock_in  ?? false,
          missed_clock_out: a.missed_clock_out ?? false,
          hours_worked:     Number(a.hours_worked ?? 0),
          is_overtime:      a.is_overtime      ?? false,
          overtime_approved: a.overtime_approved ?? false,
        }));

        // ── Credits ──────────────────────────────────────────────────────────
        let credQuery = supabase
          .from("credit_balances")
          .select("*")
          .eq("month", month)
          .eq("year",  year);

        if (empIds) credQuery = credQuery.in("employee_id", empIds);

        const { data: credData, error: credErr } = await credQuery;
        if (credErr) throw new Error(credErr.message);
        if (cancelled) return;

        const credList: CreditBalance[] = (credData ?? []).map(c => ({
          id:                c.id,
          employee_id:       c.employee_id,
          month:             c.month,
          year:              c.year,
          initial_credit:    Number(c.initial_credit   ?? 1500),
          deductions:        Number(c.deductions        ?? 0),
          overtime_credits:  Number(c.overtime_credits  ?? 0),
          final_credit:      Number(c.final_credit      ?? 1500),
          total_hours_worked: Number(c.total_hours_worked ?? 0),
          target_hours:      Number(c.target_hours       ?? 250),
        }));

        setAttendance(attList);
        setCredits(credList);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load attendance");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [
    options.departmentId,
    options.startDate,
    options.endDate,
    options.month,
    options.year,
    JSON.stringify(options.employeeIds),
    tick,
  ]);

  return { attendance, credits, loading, error, refetch };
}