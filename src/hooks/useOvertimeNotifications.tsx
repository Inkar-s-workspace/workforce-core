import {
  createContext, useContext, useState, useEffect,
  useCallback, ReactNode, useMemo,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OTStatus = "pending" | "approved" | "denied";

export interface OvertimeNotification {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  departmentId: string;
  position: string;
  date: string;
  hoursWorked: number;
  clockIn: string | null;
  clockOut: string | null;
  status: OTStatus;
  readAt: string | null;
  resolvedAt: string | null;
}

export interface MissedNotification {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  departmentId: string;
  position: string;
  date: string;
  missedClockIn: boolean;
  missedClockOut: boolean;
  clockIn: string | null;
  clockOut: string | null;
  readAt: string | null;
}

interface OTContextType {
  // Overtime
  notifications:      OvertimeNotification[];
  unreadCount:        number;
  pendingCount:       number;
  approve:            (id: string) => void;
  deny:               (id: string) => void;
  revoke:             (id: string) => void;
  markAllRead:        () => void;
  // Missed clock-in/out
  missedNotifications:     MissedNotification[];
  missedUnreadCount:       number;
  markMissedRead:          (id: string) => void;
  markAllMissedRead:       () => void;
  // Loading
  loading: boolean;
}

// ─── Persist OT decisions in localStorage (status only) ──────────────────────
// We persist approve/deny decisions locally so they survive page reload.
// The source of truth for attendance data is always Supabase.

const OT_DECISIONS_KEY  = "amc_ot_decisions";
const OT_READ_KEY       = "amc_ot_read";
const MISSED_READ_KEY   = "amc_missed_read";

function loadDecisions(): Record<string, { status: OTStatus; resolvedAt: string }> {
  try { return JSON.parse(localStorage.getItem(OT_DECISIONS_KEY) ?? "{}") } catch { return {} }
}
function saveDecisions(d: Record<string, { status: OTStatus; resolvedAt: string }>) {
  localStorage.setItem(OT_DECISIONS_KEY, JSON.stringify(d))
}
function loadOTRead(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(OT_READ_KEY) ?? "{}") } catch { return {} }
}
function saveOTRead(r: Record<string, string>) {
  localStorage.setItem(OT_READ_KEY, JSON.stringify(r))
}
function loadMissedRead(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(MISSED_READ_KEY) ?? "{}") } catch { return {} }
}
function saveMissedRead(r: Record<string, string>) {
  localStorage.setItem(MISSED_READ_KEY, JSON.stringify(r))
}

// ─── Context ──────────────────────────────────────────────────────────────────

const OTContext = createContext<OTContextType | undefined>(undefined);

export function OvertimeProvider({ children }: { children: ReactNode }) {
  const { user, role } = useAuth()

  const [rawOT,     setRawOT]     = useState<OvertimeNotification[]>([])
  const [rawMissed, setRawMissed] = useState<MissedNotification[]>([])
  const [loading,   setLoading]   = useState(true)

  // Local state for decisions and read receipts
  const [decisions,   setDecisions]   = useState(loadDecisions)
  const [otRead,      setOTRead]      = useState(loadOTRead)
  const [missedRead,  setMissedRead]  = useState(loadMissedRead)

  // ── Fetch from Supabase ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setLoading(false); return }

    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        // Get the current user's employee record to find their department
        const { data: meData } = await supabase
          .from("employees")
          .select("id, department_id")
          .eq("user_id", user.id)
          .maybeSingle()

        const myDeptId = meData?.department_id ?? null

        // ── 1. Build employees lookup ──────────────────────────────────────
        const { data: emps } = await supabase
          .from("employees")
          .select("id, first_name, last_name, department_id, position")

        // ── 2. Build departments lookup ────────────────────────────────────
        const { data: depts } = await supabase
          .from("departments")
          .select("id, name")

        const deptMap  = new Map((depts ?? []).map(d => [d.id, d.name]))
        const empMap   = new Map((emps  ?? []).map(e => [e.id, e]))

        // ── 3. Determine which employee IDs this user can see ──────────────
        // HR sees everyone. Dept head sees only their department.
        const isHR = role === "hr"
        const visibleEmpIds = isHR
          ? (emps ?? []).map(e => e.id)
          : (emps ?? []).filter(e => e.department_id === myDeptId).map(e => e.id)

        if (visibleEmpIds.length === 0) {
          if (!cancelled) { setRawOT([]); setRawMissed([]); setLoading(false) }
          return
        }

        // ── 4. Fetch overtime records ──────────────────────────────────────
        const { data: otData } = await supabase
          .from("attendance_records")
          .select("*")
          .eq("is_overtime", true)
          .in("employee_id", visibleEmpIds)
          .order("date", { ascending: false })

        const otList: OvertimeNotification[] = (otData ?? []).map(a => {
          const emp    = empMap.get(a.employee_id)
          const deptId = emp?.department_id ?? ""
          return {
            id:           a.id,
            employeeId:   a.employee_id,
            employeeName: emp ? `${emp.first_name} ${emp.last_name}` : "Unknown",
            department:   deptMap.get(deptId) ?? "Unknown",
            departmentId: deptId,
            position:     emp?.position ?? "Staff",
            date:         a.date,
            hoursWorked:  Number(a.hours_worked ?? 0),
            clockIn:      a.clock_in,
            clockOut:     a.clock_out,
            // Decisions and read receipts come from localStorage
            status:      "pending" as OTStatus,
            readAt:      null,
            resolvedAt:  null,
          }
        })

        // ── 5. Fetch missed clock-in/out records ───────────────────────────
        const { data: missedData } = await supabase
          .from("attendance_records")
          .select("*")
          .or("missed_clock_in.eq.true,missed_clock_out.eq.true")
          .in("employee_id", visibleEmpIds)
          .order("date", { ascending: false })

        const missedList: MissedNotification[] = (missedData ?? []).map(a => {
          const emp    = empMap.get(a.employee_id)
          const deptId = emp?.department_id ?? ""
          return {
            id:             a.id,
            employeeId:     a.employee_id,
            employeeName:   emp ? `${emp.first_name} ${emp.last_name}` : "Unknown",
            department:     deptMap.get(deptId) ?? "Unknown",
            departmentId:   deptId,
            position:       emp?.position ?? "Staff",
            date:           a.date,
            missedClockIn:  a.missed_clock_in  ?? false,
            missedClockOut: a.missed_clock_out ?? false,
            clockIn:        a.clock_in,
            clockOut:       a.clock_out,
            readAt:         null,
          }
        })

        if (!cancelled) {
          setRawOT(otList)
          setRawMissed(missedList)
          setLoading(false)
        }
      } catch (err) {
        console.error("OvertimeProvider fetch error:", err)
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [user, role])

  // ── Merge localStorage decisions + read receipts onto raw data ────────────
  const notifications: OvertimeNotification[] = useMemo(() =>
    rawOT.map(n => {
      const dec = decisions[n.id]
      return {
        ...n,
        status:     dec?.status     ?? "pending",
        resolvedAt: dec?.resolvedAt ?? null,
        readAt:     otRead[n.id]    ?? null,
      }
    }),
    [rawOT, decisions, otRead]
  )

  const missedNotifications: MissedNotification[] = useMemo(() =>
    rawMissed.map(n => ({
      ...n,
      readAt: missedRead[n.id] ?? null,
    })),
    [rawMissed, missedRead]
  )

  // ── Computed counts ────────────────────────────────────────────────────────
  const unreadCount = useMemo(() =>
    notifications.filter(n => !n.readAt && n.status === "pending").length,
    [notifications]
  )
  const pendingCount = useMemo(() =>
    notifications.filter(n => n.status === "pending").length,
    [notifications]
  )
  const missedUnreadCount = useMemo(() =>
    missedNotifications.filter(n => !n.readAt).length,
    [missedNotifications]
  )

  // ── Actions ────────────────────────────────────────────────────────────────
  const approve = useCallback((id: string) => {
    const now = new Date().toISOString()
    setDecisions(prev => {
      const next = { ...prev, [id]: { status: "approved" as OTStatus, resolvedAt: now } }
      saveDecisions(next)
      return next
    })
    setOTRead(prev => {
      if (prev[id]) return prev
      const next = { ...prev, [id]: now }
      saveOTRead(next)
      return next
    })
  }, [])

  const deny = useCallback((id: string) => {
    const now = new Date().toISOString()
    setDecisions(prev => {
      const next = { ...prev, [id]: { status: "denied" as OTStatus, resolvedAt: now } }
      saveDecisions(next)
      return next
    })
    setOTRead(prev => {
      if (prev[id]) return prev
      const next = { ...prev, [id]: now }
      saveOTRead(next)
      return next
    })
  }, [])

  const revoke = useCallback((id: string) => {
    setDecisions(prev => {
      const next = { ...prev }
      delete next[id]
      saveDecisions(next)
      return next
    })
    setOTRead(prev => {
      const next = { ...prev }
      delete next[id]
      saveOTRead(next)
      return next
    })
  }, [])

  const markAllRead = useCallback(() => {
    const now = new Date().toISOString()
    setOTRead(prev => {
      const next = { ...prev }
      notifications
        .filter(n => !n.readAt && n.status === "pending")
        .forEach(n => { next[n.id] = now })
      saveOTRead(next)
      return next
    })
  }, [notifications])

  const markMissedRead = useCallback((id: string) => {
    const now = new Date().toISOString()
    setMissedRead(prev => {
      const next = { ...prev, [id]: now }
      saveMissedRead(next)
      return next
    })
  }, [])

  const markAllMissedRead = useCallback(() => {
    const now = new Date().toISOString()
    setMissedRead(prev => {
      const next = { ...prev }
      missedNotifications
        .filter(n => !n.readAt)
        .forEach(n => { next[n.id] = now })
      saveMissedRead(next)
      return next
    })
  }, [missedNotifications])

  return (
    <OTContext.Provider value={{
      notifications, unreadCount, pendingCount,
      approve, deny, revoke, markAllRead,
      missedNotifications, missedUnreadCount,
      markMissedRead, markAllMissedRead,
      loading,
    }}>
      {children}
    </OTContext.Provider>
  )
}

export function useOvertimeNotifications() {
  const ctx = useContext(OTContext)
  if (!ctx) throw new Error("useOvertimeNotifications must be used within OvertimeProvider")
  return ctx
}