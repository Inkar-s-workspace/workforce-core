/**
 * useEmployees.ts
 *
 * Fetches employees + their department names from Supabase.
 * Replaces: import { mockEmployees } from "@/data/mockData"
 *
 * Usage:
 *   const { employees, departments, loading, error } = useEmployees()
 *   const { employees } = useEmployees({ departmentId: "some-uuid" })
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Employee, Department } from "@/types/attendance";

interface UseEmployeesOptions {
  departmentId?: string | null;
}

interface UseEmployeesResult {
  employees:   Employee[];
  departments: Department[];
  loading:     boolean;
  error:       string | null;
  refetch:     () => void;
}

export function useEmployees(
  options: UseEmployeesOptions = {}
): UseEmployeesResult {
  const [employees,   setEmployees]   = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [tick,        setTick]        = useState(0);

  const refetch = () => setTick(t => t + 1);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // ── 1. Departments ───────────────────────────────────────────────────
        const { data: depts, error: deptErr } = await supabase
          .from("departments")
          .select("id, name")
          .order("name");

        if (deptErr) throw new Error(deptErr.message);
        if (cancelled) return;

        const deptList: Department[] = (depts ?? []).map(d => ({
          id:   d.id,
          name: d.name,
        }));

        // Build a quick lookup map
        const deptMap = new Map(deptList.map(d => [d.id, d.name]));

        // ── 2. Employees ─────────────────────────────────────────────────────
        let query = supabase
          .from("employees")
          .select("id, emp_code, first_name, last_name, position, department_id, is_department_head")
          .order("last_name");

        if (options.departmentId) {
          query = query.eq("department_id", options.departmentId);
        }

        const { data: emps, error: empErr } = await query;
        if (empErr) throw new Error(empErr.message);
        if (cancelled) return;

        const empList: Employee[] = (emps ?? []).map(e => ({
          id:               e.id,
          emp_code:         e.emp_code ?? "",
          first_name:       e.first_name,
          last_name:        e.last_name,
          department_id:    e.department_id ?? "",
          department_name:  deptMap.get(e.department_id ?? "") ?? "Unknown",
          position:         e.position,
          is_department_head: e.is_department_head ?? false,
        }));

        setDepartments(deptList);
        setEmployees(empList);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load employees");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [options.departmentId, tick]);

  return { employees, departments, loading, error, refetch };
}