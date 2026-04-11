import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BIOTIME_URL = Deno.env.get("BIOTIME_URL");
    const BIOTIME_USERNAME = Deno.env.get("BIOTIME_USERNAME");
    const BIOTIME_PASSWORD = Deno.env.get("BIOTIME_PASSWORD");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!BIOTIME_URL) throw new Error("BIOTIME_URL is not configured");
    if (!BIOTIME_USERNAME) throw new Error("BIOTIME_USERNAME is not configured");
    if (!BIOTIME_PASSWORD) throw new Error("BIOTIME_PASSWORD is not configured");
    if (!SUPABASE_URL) throw new Error("SUPABASE_URL is not configured");
    if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Get JWT token from BioTime
    const tokenRes = await fetch(`${BIOTIME_URL}/jwt-api-token-auth/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: BIOTIME_USERNAME, password: BIOTIME_PASSWORD }),
    });

    if (!tokenRes.ok) {
      throw new Error(`BioTime auth failed [${tokenRes.status}]: ${await tokenRes.text()}`);
    }

    const { token } = await tokenRes.json();
    const authHeader = { Authorization: `JWT ${token}`, "Content-Type": "application/json" };

    // 2. Fetch departments
    const deptRes = await fetch(`${BIOTIME_URL}/personnel/api/departments/`, { headers: authHeader });
    const deptData = await deptRes.json();

    // 3. Fetch employees
    let allEmployees: any[] = [];
    let empUrl = `${BIOTIME_URL}/personnel/api/employees/?page_size=100`;
    while (empUrl) {
      const empRes = await fetch(empUrl, { headers: authHeader });
      const empData = await empRes.json();
      allEmployees = allEmployees.concat(empData.data || empData.results || []);
      empUrl = empData.next || null;
    }

    // 4. Fetch transactions (clock in/out) for this month
    const now = new Date();
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const endDate = now.toISOString().split("T")[0];

    let allTransactions: any[] = [];
    let txUrl = `${BIOTIME_URL}/iclock/api/transactions/?start_date=${startDate}&end_date=${endDate}&page_size=100`;
    while (txUrl) {
      const txRes = await fetch(txUrl, { headers: authHeader });
      const txData = await txRes.json();
      allTransactions = allTransactions.concat(txData.data || txData.results || []);
      txUrl = txData.next || null;
    }

    // 5. Get department mapping from our DB
    const { data: dbDepts } = await supabase.from("departments").select("id, name");
    const deptMap = new Map((dbDepts || []).map((d: any) => [d.name.toLowerCase(), d.id]));

    // 6. Upsert employees
    for (const emp of allEmployees) {
      const deptName = emp.department_name || emp.department?.dept_name || "";
      const deptId = deptMap.get(deptName.toLowerCase());

      await supabase.from("employees").upsert({
        emp_code: emp.emp_code,
        first_name: emp.first_name || emp.emp_code,
        last_name: emp.last_name || "",
        department_id: deptId || null,
        position: emp.position_name || null,
      }, { onConflict: "emp_code" });
    }

    // 7. Get employee ID mapping
    const { data: dbEmps } = await supabase.from("employees").select("id, emp_code");
    const empMap = new Map((dbEmps || []).map((e: any) => [e.emp_code, e.id]));

    // 8. Process transactions into attendance records
    // Group by employee + date, find first clock-in and last clock-out
    const grouped = new Map<string, { clockIn: string | null; clockOut: string | null }>();

    for (const tx of allTransactions) {
      const empId = empMap.get(tx.emp_code);
      if (!empId) continue;

      const punchTime = new Date(tx.punch_time);
      const dateStr = punchTime.toISOString().split("T")[0];
      const key = `${empId}|${dateStr}`;

      if (!grouped.has(key)) {
        grouped.set(key, { clockIn: null, clockOut: null });
      }

      const entry = grouped.get(key)!;
      const punchState = tx.punch_state ?? tx.status;

      // punch_state: 0 = check-in, 1 = check-out (BioTime convention)
      if (punchState === 0 || punchState === "0") {
        if (!entry.clockIn || tx.punch_time < entry.clockIn) {
          entry.clockIn = tx.punch_time;
        }
      } else if (punchState === 1 || punchState === "1") {
        if (!entry.clockOut || tx.punch_time > entry.clockOut) {
          entry.clockOut = tx.punch_time;
        }
      }
    }

    // 9. Upsert attendance records
    for (const [key, val] of grouped) {
      const [employeeId, dateStr] = key.split("|");
      const missedIn = !val.clockIn;
      const missedOut = !val.clockOut;
      let hoursWorked = 0;

      if (val.clockIn && val.clockOut) {
        hoursWorked = (new Date(val.clockOut).getTime() - new Date(val.clockIn).getTime()) / 3600000;
      }

      await supabase.from("attendance_records").upsert({
        employee_id: employeeId,
        date: dateStr,
        clock_in: val.clockIn,
        clock_out: val.clockOut,
        missed_clock_in: missedIn,
        missed_clock_out: missedOut,
        hours_worked: Number(hoursWorked.toFixed(2)),
        is_overtime: hoursWorked > 10,
      }, { onConflict: "employee_id,date" });
    }

    // 10. Calculate credit balances
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    for (const [empCode, empId] of empMap) {
      const { data: empAtt } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("employee_id", empId)
        .gte("date", startDate)
        .lte("date", endDate);

      if (!empAtt) continue;

      const missedIns = empAtt.filter((a: any) => a.missed_clock_in && !a.missed_clock_out).length;
      const missedOuts = empAtt.filter((a: any) => a.missed_clock_out && !a.missed_clock_in).length;
      const missedBoth = empAtt.filter((a: any) => a.missed_clock_in && a.missed_clock_out).length;
      const deductions = missedIns * 100 + missedOuts * 100 + missedBoth * 200;
      const totalHours = empAtt.reduce((s: number, a: any) => s + Number(a.hours_worked), 0);

      await supabase.from("credit_balances").upsert({
        employee_id: empId,
        month,
        year,
        initial_credit: 1500,
        deductions,
        final_credit: 1500 - deductions,
        total_hours_worked: Number(totalHours.toFixed(2)),
        target_hours: 250,
      }, { onConflict: "employee_id,month,year" });
    }

    return new Response(
      JSON.stringify({
        success: true,
        employees_synced: allEmployees.length,
        transactions_processed: allTransactions.length,
        attendance_records: grouped.size,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("BioTime sync error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
