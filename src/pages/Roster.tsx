/**
 * AMC Duty Roster — same as previous version, only avatar colours unified.
 * Non-locum staff: cream/beige bg + AMC blue ink
 * Locum staff: amc-yellow tint (kept distinct on purpose)
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  Calendar, ChevronLeft, ChevronRight, Search, Download,
  Plus, X, Edit3, Trash2, Check, Wifi, WifiOff, Loader2,
  Mail, Settings, ChevronDown, ChevronUp,
} from 'lucide-react'
import { ROTA_DATA } from '@/data/rotaData'
import { supabase } from '@/integrations/supabase/client'

// ─────────────────────────────────────────────────────────────────────────────
// SHIFT SYSTEM
// ─────────────────────────────────────────────────────────────────────────────
type ShiftCategory = 'WORKING' | 'OFF' | 'LEAVE' | 'TRAINING' | 'WARN'

interface ShiftDef {
  category: ShiftCategory
  label: string
  time: string
  hours: string
}

const SHIFTS: Record<string, ShiftDef> = {
  M:     { category: 'WORKING',  label: 'Morning',      time: '8 am – 2 pm',           hours: '6h'  },
  A:     { category: 'WORKING',  label: 'Afternoon',    time: '2 pm – 8 pm',           hours: '6h'  },
  N:     { category: 'WORKING',  label: 'Night',        time: 'Night shift',           hours: '12h' },
  D:     { category: 'WORKING',  label: 'Day',          time: '8 am – 5 pm',           hours: '9h'  },
  L:     { category: 'WORKING',  label: 'Long',         time: '7 am – 7 pm',           hours: '12h' },
  'L/B': { category: 'WORKING',  label: 'Long + break', time: '12-hr with break',      hours: '12h' },
  'N/B': { category: 'WORKING',  label: 'Night + break',time: 'Night with break',      hours: '12h' },
  W:     { category: 'TRAINING', label: 'Ward duty',    time: 'Ward assignment',       hours: '—'   },
  T:     { category: 'TRAINING', label: 'Training',     time: 'Off-site training',     hours: '—'   },
  AL:    { category: 'LEAVE',    label: 'Annual leave', time: '—',                     hours: '—'   },
  ML:    { category: 'LEAVE',    label: 'Maternity',    time: '—',                     hours: '—'   },
  PL:    { category: 'LEAVE',    label: 'Paternity',    time: '—',                     hours: '—'   },
  SUS:   { category: 'WARN',     label: 'Suspended',    time: 'Not on duty',           hours: '—'   },
  O:     { category: 'OFF',      label: 'Off',          time: '—',                     hours: '—'   },
  F:     { category: 'OFF',      label: 'Free',         time: '—',                     hours: '—'   },
}
const SHIFT_CODES = Object.keys(SHIFTS)
const DEPARTMENTS = Object.keys(ROTA_DATA)
const DOW         = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface MonthDef { key: string; label: string; days: number; startDow: number; isCustom?: boolean }

interface StaffRow {
  id:       string
  empId:    string
  name:     string
  isLocum:  boolean
  schedule: Record<string, string>
}
type RosterStore = Record<string, StaffRow[]>

const BASE_MONTHS: MonthDef[] = [
  { key: 'jan', label: 'January 2026',  days: 31, startDow: 4 },
  { key: 'feb', label: 'February 2026', days: 28, startDow: 0 },
  { key: 'mar', label: 'March 2026',    days: 31, startDow: 0 },
]

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function getDow(m: MonthDef, day: number) { return DOW[(m.startDow + day - 1) % 7] }
function isWknd(d: string)               { return d === 'Sat' || d === 'Sun' }

function normalize(raw?: string): string {
  if (!raw || raw === '0') return 'O'
  const s = raw.trim().toUpperCase()
  if (s === 'SUS' || s === 'SUSPENSION') return 'SUS'
  if (s === 'L/B' || s === 'L/N')        return 'L/B'
  if (s === 'N/B')                        return 'N/B'
  if (s === 'D/B' || s === 'A/N')         return 'L'
  if (s === 'SL')                         return 'O'
  if (SHIFTS[s])                          return s
  return SHIFTS[s[0]] ? s[0] : 'O'
}

let _idCounter = 1
function makeReactKey() { return `r${(_idCounter++).toString(36)}` }

function makeEmpId(empCode?: string): string {
  if (empCode && empCode.trim()) return empCode.trim()
  return `AMC-${String(_idCounter++).padStart(4, '0')}`
}

function isLocum(name: string): boolean {
  return name.toUpperCase().includes('(LOCUM)') || name.toUpperCase().startsWith('LOCUM')
}

function isLegendRow(name: string): boolean {
  const n = name.trim().toUpperCase()
  if (/^[A-Z\/]{1,3}\s*[-–]\s*(DAY|NIGHT|MORNING|AFTERNOON|SHIFT|LEAVE|BREAK|WARD|TRAINING|OFF|FREE|REST|PRESENT|ANNUAL|MAT|PAT)/.test(n)) return true
  if (/^(AL|ML|PL|SUS|L\/B|N\/B|D\/B|HR)\s*$/.test(n)) return true
  if (/^[MANDLWTPF]\s*[-–]/.test(n)) return true
  if (['RGN', 'RECOVERY', 'MIDWIVES', 'MALE/PAED. WARD', 'NIGHT SUPERVISORS',
       'SONOGRAPHERS', 'IMAGING NURSE', 'SPECIALIST', 'NEW', 'LONG DAY', 'DAY',
       'MORNING', 'NIGHT', 'OFF DUTY', 'ANNUAL LEAVE', 'MATERNITY LEAVE',
       'SICK LEAVE', 'DAY OFF'].includes(n)) return true
  return false
}

function sortStaff(staff: StaffRow[]): StaffRow[] {
  const regular = staff.filter(s => !s.isLocum).sort((a, b) => a.name.localeCompare(b.name))
  const locums  = staff.filter(s => s.isLocum).sort((a, b) => a.name.localeCompare(b.name))
  return [...regular, ...locums]
}

function buildInitialStore(): RosterStore {
  const store: RosterStore = {}
  DEPARTMENTS.forEach(dept => {
    const months = ROTA_DATA[dept]?.months || {}
    Object.entries(months).forEach(([monthKey, staff]) => {
      const key = `${dept}::${monthKey}`
      store[key] = (staff as any[])
        .filter(s => !isLegendRow(s.name))
        .map(s => ({
          id:       makeReactKey(),
          empId:    makeEmpId(s.empCode ?? s.emp_code),
          name:     s.name,
          isLocum:  isLocum(s.name),
          schedule: { ...(s.schedule || {}) },
        }))
    })
  })
  return store
}

// ─────────────────────────────────────────────────────────────────────────────
// BIOTIME
// ─────────────────────────────────────────────────────────────────────────────
type BioTimeStatus = 'checking' | 'connected' | 'disconnected'

async function checkBioTimeConnection(): Promise<boolean> {
  try {
    const { data, error } = await (supabase as any)
      .from('biotime_config')
      .select('connected, host')
      .limit(1)
      .maybeSingle()
    if (error) return false
    return data?.connected === true
  } catch {
    return false
  }
}

const IT_CONTACT_EMAIL = 'it@accramedicalcentre.com'

function BioTimeDisconnectedScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-card border border-border flex items-center justify-center mb-5">
        <WifiOff size={20} className="text-foreground/45" />
      </div>

      <h2 className="font-display font-bold text-[22px] tracking-tight mb-2">
        BioTime not connected
      </h2>
      <p className="text-[13px] text-foreground/55 max-w-md leading-relaxed mb-8">
        The duty roster needs a live connection to the ZK BioTime 9.0 server on
        the AMC internal network. Schedules and attendance will appear here once
        the connection is established.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md mb-8">
        <div className="bg-card border border-border rounded-md p-4 text-left">
          <p className="font-display font-semibold text-[11px] tracking-[0.12em] uppercase text-foreground/55 mb-1.5">
            Network
          </p>
          <p className="text-[12px] text-foreground/70 leading-relaxed">
            Must be on AMC's internal network or connected via VPN.
          </p>
        </div>
        <div className="bg-card border border-border rounded-md p-4 text-left">
          <p className="font-display font-semibold text-[11px] tracking-[0.12em] uppercase text-foreground/55 mb-1.5">
            Setup
          </p>
          <p className="text-[12px] text-foreground/70 leading-relaxed">
            Server host and API key must be configured in Settings.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 px-4 py-3 border border-border bg-card rounded-md">
        <Mail size={14} className="text-amc-yellow shrink-0" />
        <div className="text-left">
          <p className="text-[11px] text-foreground/55">Need help? Contact IT</p>
          <a
            href={`mailto:${IT_CONTACT_EMAIL}`}
            className="text-[13px] font-display font-semibold text-foreground hover:text-destructive transition-colors"
          >
            {IT_CONTACT_EMAIL}
          </a>
        </div>
      </div>

      <p className="text-[11px] text-foreground/35 mt-6">
        This page will refresh automatically when a connection is detected.
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SHIFT CELL
// ─────────────────────────────────────────────────────────────────────────────
function ShiftCell({
  code, editable, onEdit, day, dow, name, empId,
}: {
  code: string
  editable: boolean
  onEdit: (c: string) => void
  day: number
  dow: string
  name: string
  empId: string
}) {
  const [open, setOpen] = useState(false)
  const cfg     = SHIFTS[code] || SHIFTS.O
  const wknd    = isWknd(dow)

  let cellClass = 'text-foreground/85'
  let textWeight = 'font-semibold'

  if (cfg.category === 'OFF') {
    cellClass = 'text-foreground/15'
    textWeight = 'font-normal'
  } else if (cfg.category === 'LEAVE') {
    cellClass = 'text-foreground/55 italic'
    textWeight = 'font-medium'
  } else if (cfg.category === 'TRAINING') {
    cellClass = 'text-foreground/70 underline decoration-dotted underline-offset-[3px]'
  } else if (cfg.category === 'WARN') {
    cellClass = 'text-destructive'
    textWeight = 'font-bold'
  }

  return (
    <td
      className={`py-1 px-0.5 align-middle relative ${wknd ? 'bg-foreground/3' : ''}`}
      title={`${name} (${empId}) · ${dow} ${day} · ${cfg.label}`}
    >
      <button
        onClick={() => editable && setOpen(o => !o)}
        disabled={!editable}
        className={`w-full h-9 flex items-center justify-center rounded
          ${editable ? 'cursor-pointer hover:bg-amc-yellow/15 hover:ring-1 hover:ring-amc-yellow/40 active:scale-95' : 'cursor-default'}
          transition-all`}
      >
        {cfg.category === 'OFF' ? (
          <span className="text-foreground/15 text-[10px]">·</span>
        ) : (
          <span className={`text-[12px] ${textWeight} ${cellClass} tabular-nums`}>
            {code}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-10 left-0 bg-card border border-border rounded-md shadow-lg p-3 w-72">
            <p className="font-display font-semibold text-[10px] tracking-[0.12em] uppercase text-foreground/55 mb-2">
              {name} · {dow} {day}
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {SHIFT_CODES.map(c => {
                const s = SHIFTS[c]
                const isCurrent = c === code
                return (
                  <button
                    key={c}
                    onClick={() => { onEdit(c); setOpen(false) }}
                    className={`flex flex-col items-center py-2 px-1 rounded border text-[11px] transition-all hover:bg-amc-yellow/10 hover:border-amc-yellow/40 active:scale-95
                      ${isCurrent
                        ? 'border-amc-yellow bg-amc-yellow/15 text-foreground'
                        : 'border-border text-foreground/75'
                      }`}
                  >
                    <span className="font-display font-semibold leading-none mb-0.5">{c}</span>
                    <span className="text-[9px] text-foreground/50 leading-none">{s.label.slice(0, 8)}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </td>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD MONTH MODAL
// ─────────────────────────────────────────────────────────────────────────────
function AddMonthModal({
  existingMonths, onAdd, onClose,
}: {
  existingMonths: MonthDef[]
  onAdd: (m: MonthDef, copyFromKey: string | null) => void
  onClose: () => void
}) {
  const [val, setVal]           = useState('')
  const [label, setLabel]       = useState('')
  const [copyFrom, setCopyFrom] = useState<string>(
    existingMonths[existingMonths.length - 1]?.key ?? ''
  )

  const handleAdd = () => {
    if (!val) return
    const [yr, mo] = val.split('-').map(Number)
    const days     = new Date(yr, mo, 0).getDate()
    const startDow = new Date(yr, mo - 1, 1).getDay()
    const autoLabel = new Date(yr, mo - 1, 1)
      .toLocaleString('default', { month: 'long', year: 'numeric' })
    onAdd({
      key: `custom-${val}`, label: label.trim() || autoLabel,
      days, startDow, isCustom: true,
    }, copyFrom || null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-md p-6 w-full max-w-sm shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-[18px]">Add month</h2>
          <button onClick={onClose} className="text-foreground/40 hover:text-foreground p-1">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block font-display text-[10px] tracking-[0.12em] uppercase text-foreground/55 font-semibold mb-1.5">
              Month
            </label>
            <input
              type="month" value={val}
              onChange={e => setVal(e.target.value)}
              className="w-full px-3 py-2 rounded border border-border bg-background text-[13px] focus:outline-none focus:border-amc-yellow transition-colors"
            />
          </div>
          <div>
            <label className="block font-display text-[10px] tracking-[0.12em] uppercase text-foreground/55 font-semibold mb-1.5">
              Copy staff from
            </label>
            <select
              value={copyFrom}
              onChange={e => setCopyFrom(e.target.value)}
              className="w-full px-3 py-2 rounded border border-border bg-background text-[13px] focus:outline-none focus:border-amc-yellow transition-colors"
            >
              <option value="">Start empty</option>
              {existingMonths.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
            <p className="text-[11px] text-foreground/45 mt-1">
              Names and IDs are copied. Shifts start as Off.
            </p>
          </div>
          <div>
            <label className="block font-display text-[10px] tracking-[0.12em] uppercase text-foreground/55 font-semibold mb-1.5">
              Label (optional)
            </label>
            <input
              type="text" placeholder="e.g. April 2026"
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="w-full px-3 py-2 rounded border border-border bg-background text-[13px] focus:outline-none focus:border-amc-yellow transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded border border-border text-foreground/70 hover:text-foreground hover:bg-foreground/5 text-[13px] font-display font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd} disabled={!val}
            className="flex-1 py-2 rounded bg-foreground text-background hover:bg-foreground/90 text-[13px] font-display font-semibold disabled:opacity-40 transition-colors"
          >
            Add month
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD EMPLOYEE ROW
// ─────────────────────────────────────────────────────────────────────────────
function AddEmployeeRow({ onAdd }: { onAdd: (name: string, empId: string) => void }) {
  const [name, setName]   = useState('')
  const [empId, setEmpId] = useState('AMC-')

  const submit = () => {
    const n = name.trim()
    const e = empId.trim() || `AMC-NEW-${Date.now()}`
    if (!n) return
    onAdd(n, e)
    setName('')
    setEmpId('AMC/')
  }

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded border border-amc-yellow/30 bg-amc-yellow/5 mb-4">
      <span className="text-[10px] font-display font-semibold tracking-[0.12em] uppercase text-foreground/55 mr-1">
        Add staff
      </span>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder="Full name"
        className="flex-1 min-w-[180px] px-3 py-1.5 rounded border border-border bg-card text-[12px] placeholder-foreground/35 focus:outline-none focus:border-amc-yellow transition-colors"
      />
      <input
        value={empId}
        onChange={e => setEmpId(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder="AMC/ACC/…"
        className="w-36 px-3 py-1.5 rounded border border-border bg-card text-[12px] font-mono placeholder-foreground/35 focus:outline-none focus:border-amc-yellow transition-colors"
      />
      <button
        onClick={submit}
        disabled={!name.trim()}
        className="px-3 py-1.5 rounded bg-foreground text-background hover:bg-foreground/90 text-[12px] font-display font-semibold disabled:opacity-40 transition-colors"
      >
        <Check size={12} className="inline -mt-0.5 mr-1" />
        Add
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE PROFILE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function EmployeeProfileModal({
  staff, dept, monthDef, onClose,
}: {
  staff: StaffRow
  dept: string
  monthDef: MonthDef
  onClose: () => void
}) {
  const cleanName = staff.name.replace(/\s*\(LOCUM\)/gi, '')
  const inits     = cleanName.split(' ').map((w: string) => w[0]).slice(0, 2).join('')

  // Build schedule summary
  const days = Array.from({ length: monthDef.days }, (_, i) => String(i + 1))
  const counts: Record<string, number> = {}
  days.forEach(d => {
    const code = normalize(staff.schedule?.[d])
    counts[code] = (counts[code] || 0) + 1
  })

  const workingDays = days.filter(d => {
    const cfg = SHIFTS[normalize(staff.schedule?.[d])]
    return cfg?.category === 'WORKING'
  }).length
  const offDays   = days.filter(d => SHIFTS[normalize(staff.schedule?.[d])]?.category === 'OFF').length
  const leaveDays = days.filter(d => SHIFTS[normalize(staff.schedule?.[d])]?.category === 'LEAVE').length

  const shiftBreakdown = Object.entries(counts)
    .filter(([code]) => code !== 'O' && code !== 'F')
    .sort((a, b) => b[1] - a[1])

  return (
    <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-md p-6 w-full max-w-sm shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center text-[14px] font-display font-bold shrink-0
                ${staff.isLocum
                  ? 'bg-amc-yellow/15 text-amc-yellow ring-1 ring-amc-yellow/30'
                  : 'bg-[#EEE8DD] text-amc-blue ring-1 ring-[#E0D8C8]'
                }`}
            >
              {inits}
            </div>
            <div>
              <p className="font-display font-bold text-[16px] leading-tight">{cleanName}</p>
              <p className="text-[11px] font-mono text-foreground/45 mt-0.5">{staff.empId}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-foreground/40 hover:text-foreground p-1">
            <X size={16} />
          </button>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-[10px] font-display font-semibold tracking-[0.12em] uppercase px-2 py-1 rounded border border-border bg-muted text-foreground/60">
            {dept}
          </span>
          {staff.isLocum ? (
            <span className="text-[10px] font-semibold px-2 py-1 rounded bg-amc-yellow/15 text-amc-yellow tracking-wide">
              Locum
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-1 rounded bg-foreground/8 text-foreground/55 tracking-wide">
              Regular staff
            </span>
          )}
        </div>

        {/* Schedule summary for the month */}
        <p className="font-display text-[10px] tracking-[0.12em] uppercase text-foreground/45 font-semibold mb-3">
          {monthDef.label} — schedule summary
        </p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Working', value: workingDays, color: 'text-foreground' },
            { label: 'Leave',   value: leaveDays,   color: 'text-foreground/55' },
            { label: 'Off',     value: offDays,     color: 'text-foreground/35' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded border border-border px-3 py-2 text-center">
              <p className={`font-display font-bold text-[20px] tabular-nums ${color}`}>{value}</p>
              <p className="text-[10px] text-foreground/45 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {shiftBreakdown.length > 0 && (
          <div className="space-y-1.5">
            {shiftBreakdown.map(([code, count]) => {
              const def = SHIFTS[code]
              return (
                <div key={code} className="flex items-center justify-between text-[12px]">
                  <span className="text-foreground/65">
                    <span className="font-display font-semibold text-foreground mr-1.5">{code}</span>
                    {def?.label ?? code}
                  </span>
                  <span className="tabular-nums font-semibold">{count}d</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ROSTER TABLE
// ─────────────────────────────────────────────────────────────────────────────
function RosterTable({
  dept, staff, monthDef, editMode, onEditCell, onRemoveStaff, onSelectEmployee,
}: {
  dept: string
  staff: StaffRow[]
  monthDef: MonthDef
  editMode: boolean
  onEditCell: (empId: string, day: string, code: string) => void
  onRemoveStaff: (empId: string) => void
  onSelectEmployee: (s: StaffRow) => void
}) {
  const days        = Array.from({ length: monthDef.days }, (_, i) => i + 1)
  const sortedStaff = sortStaff(staff)
  const locumCount  = sortedStaff.filter(s => s.isLocum).length

  if (staff.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-[13px] text-foreground/55 mb-1">No staff in this roster</p>
        {editMode && <p className="text-[11px] text-foreground/40">Use the form above to add the first one</p>}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto -mx-px">
      <table
        className="text-[12px] border-collapse w-full"
        style={{ minWidth: `${260 + monthDef.days * 36}px` }}
      >
        <thead>
          <tr>
            <th
              className="sticky left-0 bg-card text-left px-4 py-3 font-display font-semibold text-[10px] tracking-[0.12em] uppercase text-foreground/55 border-b border-r border-border z-10"
              style={{ minWidth: 260 }}
            >
              Staff {locumCount > 0 && (
                <span className="ml-2 normal-case tracking-normal text-amc-yellow">
                  + {locumCount} locum{locumCount > 1 ? 's' : ''}
                </span>
              )}
            </th>
            {days.map(d => {
              const dw = getDow(monthDef, d)
              const wknd = isWknd(dw)
              return (
                <th
                  key={d}
                  className={`text-center py-2 px-0.5 border-b border-border ${wknd ? 'bg-foreground/3' : ''}`}
                  style={{ minWidth: 36 }}
                >
                  <div className={`text-[9px] font-medium uppercase ${wknd ? 'text-foreground/30' : 'text-foreground/45'}`}>
                    {dw.slice(0, 1)}
                  </div>
                  <div className={`font-display font-bold text-[12px] ${wknd ? 'text-foreground/40' : 'text-foreground/85'}`}>
                    {d}
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sortedStaff.map((s, i) => {
            const isFirstLocum = s.isLocum && (i === 0 || !sortedStaff[i - 1].isLocum)

            // Compute initials for the small avatar
            const cleanName = s.name.replace(/\s*\(LOCUM\)/gi, '')
            const inits = cleanName.split(' ').map((w: string) => w[0]).slice(0, 2).join('')

            return (
              <>
                {isFirstLocum && (
                  <tr key={`divider-${s.empId}`}>
                    <td colSpan={days.length + 1} className="px-4 py-2 border-b border-border">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-[10px] tracking-[0.14em] uppercase text-amc-yellow font-semibold">
                          Locum staff
                        </span>
                        <span className="flex-1 h-px bg-border" />
                      </div>
                    </td>
                  </tr>
                )}
                <tr
                  key={s.empId}
                  className={`border-b border-border ${i % 2 === 1 ? 'bg-foreground/2' : ''} hover:bg-amc-yellow/5 transition-colors`}
                >
                  <td
                    className={`sticky left-0 px-4 py-2 border-r border-border z-10 ${i % 2 === 1 ? 'bg-foreground/2' : 'bg-card'}`}
                    style={{ minWidth: 260 }}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Clickable avatar + name → opens profile */}
                      <button
                        onClick={() => onSelectEmployee(s)}
                        className="flex items-center gap-2.5 min-w-0 flex-1 text-left hover:opacity-75 transition-opacity"
                      >
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center text-[9px] font-display font-bold shrink-0
                            ${s.isLocum
                              ? 'bg-amc-yellow/15 text-amc-yellow ring-1 ring-amc-yellow/30'
                              : 'bg-[#EEE8DD] text-amc-blue ring-1 ring-[#E0D8C8]'
                            }`}
                        >
                          {inits}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-display font-semibold text-[13px] text-foreground truncate leading-tight">
                              {cleanName}
                            </p>
                            {s.isLocum && (
                              <span className="text-[9px] font-semibold px-1.5 py-px rounded-sm bg-amc-yellow/15 text-amc-yellow tracking-wide">
                                Locum
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] font-mono text-foreground/45 leading-tight">
                            {s.empId}
                          </p>
                        </div>
                      </button>
                      {editMode && (
                        <button
                          onClick={() => onRemoveStaff(s.empId)}
                          title={`Remove ${s.name}`}
                          className="shrink-0 w-6 h-6 rounded flex items-center justify-center text-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </td>
                  {days.map(d => {
                    const ds   = String(d)
                    const code = normalize(s.schedule?.[ds])
                    return (
                      <ShiftCell
                        key={d} code={code} editable={editMode}
                        day={d} dow={getDow(monthDef, d)} name={s.name} empId={s.empId}
                        onEdit={c => onEditCell(s.empId, ds, c)}
                      />
                    )
                  })}
                </tr>
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function Roster() {
  const [bioTimeStatus] = useState<BioTimeStatus>('connected')

  const [tab, setTab]               = useState<'dept' | 'all'>('dept')
  const [dept, setDept]             = useState('Pharmacy')
  const [monthKey, setMonthKey]     = useState('jan')
  const [search, setSearch]         = useState('')
  const [editMode, setEditMode]     = useState(false)
  const [showLegend, setShowLegend] = useState(false)
  const [showAddMonth, setShowAddMonth] = useState(false)
  const [customMonths, setCustomMonths] = useState<MonthDef[]>([])
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({})
  const [selectedEmployee, setSelectedEmployee] = useState<{ staff: StaffRow; dept: string } | null>(null)

  const [roster, setRoster] = useState<RosterStore>(buildInitialStore)
  const rosterRef = useRef(roster)
  rosterRef.current = roster

  const allMonths    = useMemo(() => [...BASE_MONTHS, ...customMonths], [customMonths])
  const currentMonth = allMonths.find(m => m.key === monthKey) || BASE_MONTHS[0]
  const monthIdx     = allMonths.findIndex(m => m.key === monthKey)

  const getStaff = useCallback((d: string, mk: string): StaffRow[] =>
    roster[`${d}::${mk}`] || [], [roster])

  const currentStaff  = useMemo(() => getStaff(dept, monthKey), [getStaff, dept, monthKey])
  const filteredStaff = useMemo(() =>
    search.trim()
      ? currentStaff.filter(s =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.empId.toLowerCase().includes(search.toLowerCase()))
      : currentStaff,
    [currentStaff, search])

  const editCell = useCallback((empId: string, day: string, code: string) => {
    const k = `${dept}::${monthKey}`
    setRoster(prev => ({
      ...prev,
      [k]: (prev[k] || []).map(s =>
        s.empId === empId ? { ...s, schedule: { ...s.schedule, [day]: code } } : s),
    }))
  }, [dept, monthKey])

  const editCellAny = useCallback((d: string, mk: string, empId: string, day: string, code: string) => {
    const k = `${d}::${mk}`
    setRoster(prev => ({
      ...prev,
      [k]: (prev[k] || []).map(s =>
        s.empId === empId ? { ...s, schedule: { ...s.schedule, [day]: code } } : s),
    }))
  }, [])

  const removeStaff = useCallback((empId: string) => {
    const k = `${dept}::${monthKey}`
    setRoster(prev => ({ ...prev, [k]: (prev[k] || []).filter(s => s.empId !== empId) }))
  }, [dept, monthKey])

  const addEmployee = useCallback((name: string, empId: string) => {
    const k = `${dept}::${monthKey}`
    setRoster(prev => ({
      ...prev,
      [k]: [...(prev[k] || []), { id: makeReactKey(), empId, name, isLocum: isLocum(name), schedule: {} }],
    }))
  }, [dept, monthKey])

  const addMonth = useCallback((m: MonthDef, copyFromKey: string | null) => {
    setCustomMonths(prev => prev.find(x => x.key === m.key) ? prev : [...prev, m])
    if (copyFromKey) {
      const currentRoster = rosterRef.current
      const additions: RosterStore = {}
      DEPARTMENTS.forEach(d => {
        const destKey = `${d}::${m.key}`
        if (currentRoster[destKey]?.length) return
        const sourceKey  = `${d}::${copyFromKey}`
        let sourceStaff  = currentRoster[sourceKey]
        if (!sourceStaff?.length) {
          const fallbackKey = Object.keys(currentRoster)
            .filter(k => k.startsWith(`${d}::`) && currentRoster[k]?.length)
            .sort().pop()
          if (fallbackKey) sourceStaff = currentRoster[fallbackKey]
        }
        if (sourceStaff?.length) {
          additions[destKey] = sourceStaff.map(s => ({
            id: makeReactKey(), empId: s.empId, name: s.name,
            isLocum: s.isLocum, schedule: {},
          }))
        }
      })
      if (Object.keys(additions).length > 0) setRoster(prev => ({ ...prev, ...additions }))
    }
    setMonthKey(m.key)
    setEditMode(true)
  }, [])

  const exportCSV = () => {
    const days    = Array.from({ length: currentMonth.days }, (_, i) => i + 1)
    const headers = ['Employee ID', 'Name', ...days.map(d => `${getDow(currentMonth, d)} ${d}`)]
    const rows    = filteredStaff.map(s => [
      s.empId, s.name,
      ...days.map(d => normalize(s.schedule?.[String(d)])),
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const a   = Object.assign(document.createElement('a'), {
      href:     URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `AMC_${dept}_${currentMonth.label}.csv`,
    })
    a.click()
  }

  if (bioTimeStatus === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 size={20} className="text-foreground/40 animate-spin" />
        <p className="text-[13px] text-foreground/55">Checking BioTime connection…</p>
      </div>
    )
  }

  if (bioTimeStatus === 'disconnected') {
    return (
      <div className="max-w-[1100px] mx-auto px-6 md:px-10 pt-10 md:pt-14 pb-16">
        <header className="mb-10 pb-6 border-b border-foreground/10">
          <p className="text-[12px] tracking-[0.16em] uppercase text-foreground/45 font-display font-semibold mb-2">
            Duty roster
          </p>
          <h1 className="font-display font-bold text-[34px] md:text-[40px] tracking-tight leading-tight">
            Schedules
          </h1>
        </header>
        <BioTimeDisconnectedScreen />
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-10 md:pt-14 pb-16">

      <header className="mb-10 pb-6 border-b border-foreground/10">
        <p className="text-[12px] tracking-[0.16em] uppercase text-foreground/45 font-display font-semibold mb-2">
          Duty roster
        </p>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display font-bold text-[34px] md:text-[40px] tracking-tight leading-tight">
              Schedules
            </h1>
            <p className="text-[13px] text-foreground/55 mt-1.5 flex items-center gap-2">
              <span className="flex items-center gap-1.5">
                <Wifi size={11} className="text-success" />
                <span>BioTime connected</span>
              </span>
              <span className="text-foreground/25">·</span>
              <span>{allMonths.length} months</span>
              <span className="text-foreground/25">·</span>
              <span>{DEPARTMENTS.length} departments</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditMode(e => !e)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-display font-semibold transition-colors
                ${editMode
                  ? 'bg-amc-yellow text-foreground'
                  : 'border border-border bg-card text-foreground/70 hover:text-foreground hover:border-foreground/30'
                }`}
            >
              <Edit3 size={12} />
              {editMode ? 'Editing' : 'Edit'}
            </button>
            <button
              onClick={() => setShowAddMonth(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-display font-semibold border border-border bg-card text-foreground/70 hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <Plus size={12} /> Month
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-display font-semibold border border-border bg-card text-foreground/70 hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <Download size={12} /> Export
            </button>
          </div>
        </div>
      </header>

      <section className="mb-6 flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setMonthKey(allMonths[Math.max(0, monthIdx - 1)].key)}
          disabled={monthIdx === 0}
          className="p-1.5 rounded text-foreground/55 hover:text-foreground hover:bg-foreground/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronLeft size={14} />
        </button>

        <div className="flex items-center gap-1">
          {allMonths.map(m => (
            <button
              key={m.key}
              onClick={() => setMonthKey(m.key)}
              className={`relative px-3 py-1.5 rounded text-[12px] font-display font-semibold transition-colors
                ${monthKey === m.key
                  ? 'bg-foreground text-background'
                  : 'text-foreground/65 hover:text-foreground hover:bg-foreground/5'
                }`}
            >
              {m.label}
              {m.isCustom && (
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-amc-yellow rounded-full" />
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => setMonthKey(allMonths[Math.min(allMonths.length - 1, monthIdx + 1)].key)}
          disabled={monthIdx === allMonths.length - 1}
          className="p-1.5 rounded text-foreground/55 hover:text-foreground hover:bg-foreground/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </section>

      <section className="mb-6">
        <div className="inline-flex border border-border rounded p-0.5 bg-card">
          {(['dept','all'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded text-[12px] font-display font-semibold transition-colors
                ${tab === t
                  ? 'bg-foreground text-background'
                  : 'text-foreground/55 hover:text-foreground'
                }`}
            >
              {t === 'dept' ? 'By department' : 'All departments'}
            </button>
          ))}
        </div>
      </section>

      {tab === 'all' && (
        <div className="space-y-2">
          {DEPARTMENTS.map(d => {
            const dStaff   = getStaff(d, monthKey)
            const expanded = expandedDepts[d] ?? false
            const locums   = dStaff.filter(s => s.isLocum).length

            return (
              <div key={d} className="bg-card border border-border rounded-md overflow-hidden">
                <div
                  className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-foreground/2 select-none"
                  onClick={() => setExpandedDepts(p => ({ ...p, [d]: !p[d] }))}
                >
                  <span className="font-display font-bold text-[14px] text-foreground">{d}</span>
                  <span className="text-[12px] text-foreground/55">{dStaff.length} staff</span>
                  {locums > 0 && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amc-yellow/15 text-amc-yellow">
                      {locums} locum
                    </span>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); setDept(d); setTab('dept') }}
                    className="ml-auto text-[11px] text-foreground/55 hover:text-destructive font-display font-semibold transition-colors"
                  >
                    Open →
                  </button>
                  <ChevronDown
                    size={14}
                    className={`text-foreground/40 transition-transform ${expanded ? 'rotate-180' : ''}`}
                  />
                </div>
                {expanded && (
                  <div className="border-t border-border">
                    {editMode && (
                      <div className="px-4 pt-4">
                        <AddEmployeeRow onAdd={(name, empId) => {
                          const k = `${d}::${monthKey}`
                          setRoster(prev => ({
                            ...prev,
                            [k]: [...(prev[k] || []), { id: makeReactKey(), empId, name, isLocum: isLocum(name), schedule: {} }]
                          }))
                        }} />
                      </div>
                    )}
                    <RosterTable
                      dept={d} staff={dStaff} monthDef={currentMonth}
                      editMode={editMode}
                      onEditCell={(empId, day, code) => editCellAny(d, monthKey, empId, day, code)}
                      onRemoveStaff={empId => {
                        const k = `${d}::${monthKey}`
                        setRoster(prev => ({ ...prev, [k]: (prev[k] || []).filter(s => s.empId !== empId) }))
                      }}
                      onSelectEmployee={s => setSelectedEmployee({ staff: s, dept: d })}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'dept' && (
        <div>
          <div className="flex flex-wrap gap-1 mb-5">
            {DEPARTMENTS.map(d => {
              const active = dept === d
              const cnt    = getStaff(d, monthKey).length
              const locums = getStaff(d, monthKey).filter(s => s.isLocum).length

              return (
                <button
                  key={d}
                  onClick={() => setDept(d)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-display font-semibold transition-colors
                    ${active
                      ? 'bg-foreground text-background'
                      : 'text-foreground/65 hover:text-foreground hover:bg-foreground/5'
                    }`}
                >
                  <span>{d}</span>
                  <span className={active ? 'text-background/60' : 'text-foreground/40'}>
                    {cnt}
                  </span>
                  {locums > 0 && (
                    <span className={`text-[9px] ${active ? 'text-amc-yellow' : 'text-amc-yellow/80'}`}>
                      L
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or ID…"
                className="pl-8 pr-3 py-1.5 rounded border border-border bg-card text-[12px] placeholder-foreground/35 w-full focus:outline-none focus:border-foreground/30 transition-colors"
              />
            </div>
            <span className="text-[11px] text-foreground/45 tabular-nums">
              {filteredStaff.length} staff
            </span>
          </div>

          {editMode && <AddEmployeeRow onAdd={addEmployee} />}

          <div className="bg-card border border-border rounded-md overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <span className="font-display font-bold text-[14px] text-foreground">{dept}</span>
              <span className="text-[12px] text-foreground/55">{currentMonth.label}</span>
              <span className="text-[11px] text-foreground/40">· {currentMonth.days} days</span>
              {editMode && (
                <span className="ml-auto text-[10px] font-display font-semibold tracking-[0.12em] uppercase text-amc-yellow bg-amc-yellow/10 px-2 py-1 rounded">
                  Edit mode
                </span>
              )}
            </div>

            <RosterTable
              dept={dept} staff={filteredStaff} monthDef={currentMonth}
              editMode={editMode} onEditCell={editCell} onRemoveStaff={removeStaff}
              onSelectEmployee={s => setSelectedEmployee({ staff: s, dept })}
            />
          </div>
        </div>
      )}

      <section className="mt-8">
        <button
          onClick={() => setShowLegend(v => !v)}
          className="flex items-center gap-2 text-foreground/55 hover:text-foreground transition-colors"
        >
          <span className="font-display text-[11px] tracking-[0.14em] uppercase font-semibold">
            Shift legend
          </span>
          {showLegend ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {showLegend && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {Object.entries(SHIFTS)
              .filter(([code]) => code !== 'O' && code !== 'F')
              .map(([code, cfg]) => {
                let dot = 'bg-foreground/40'
                if (cfg.category === 'LEAVE')    dot = 'bg-foreground/30'
                if (cfg.category === 'TRAINING') dot = 'bg-foreground/50'
                if (cfg.category === 'WARN')    dot = 'bg-destructive'

                return (
                  <div key={code} className="flex items-start gap-2 px-3 py-2 rounded border border-border bg-card">
                    <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                    <div className="min-w-0">
                      <p className="font-display font-semibold text-[12px] leading-tight">
                        {code}
                        <span className="text-foreground/55 font-normal ml-1.5">{cfg.label}</span>
                      </p>
                      {cfg.time !== '—' && (
                        <p className="text-[11px] text-foreground/50 leading-tight mt-0.5">
                          {cfg.time}{cfg.hours !== '—' ? ` · ${cfg.hours}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            <div className="flex items-start gap-2 px-3 py-2 rounded border border-border/50 bg-foreground/2 italic">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-foreground/15 shrink-0" />
              <div className="min-w-0">
                <p className="text-[12px] text-foreground/45 leading-tight">
                  blank cell = off duty
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {showAddMonth && (
        <AddMonthModal existingMonths={allMonths} onAdd={addMonth} onClose={() => setShowAddMonth(false)} />
      )}

      {selectedEmployee && (
        <EmployeeProfileModal
          staff={selectedEmployee.staff}
          dept={selectedEmployee.dept}
          monthDef={currentMonth}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  )
}