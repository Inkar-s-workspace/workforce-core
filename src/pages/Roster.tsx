/**
 * AMC Duty Roster — Roster.tsx
 *
 * CHANGES IN THIS VERSION:
 * ─────────────────────────────────────────────────────────────────────────────
 * [BIOTIME GATE] The page now checks whether BioTime is connected before
 *   rendering roster content. If BioTime is NOT connected, a placeholder
 *   screen is shown with instructions to connect. This check reads from
 *   Supabase (the `biotime_config` table). While checking, a spinner is shown.
 *
 * [REAL EMP CODES] Employee IDs now use the real AMC emp_code (e.g.
 *   "AMC/ACC/ADM/005") from rotaData rather than the generated "AMC-XXXX"
 *   runtime IDs. This means IDs are stable across page reloads and match
 *   what BioTime and Supabase use.
 *
 * [EMAIL DISPLAY] The BioTime disconnected screen includes the IT contact
 *   email for requesting connection setup.
 *
 * All previous changes (locum detection, legend filtering, rosterRef copy fix,
 * empId-keyed mutations, legend grid, header layout) are preserved.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  Calendar, ChevronLeft, ChevronRight, Search, Download,
  Users, Plus, X, Edit3, Layers, ChevronDown, Trash2, UserPlus, Check,
  Wifi, WifiOff, Loader2, Mail, Settings,
} from 'lucide-react'
import { ROTA_DATA } from '@/data/rotaData'
import { supabase } from '@/integrations/supabase/client'

// ─────────────────────────────────────────────────────────────────────────────
// SHIFT DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
const SHIFTS: Record<string, {
  label: string; time: string; hours: string
  bg: string; text: string; border: string; dot: string
}> = {
  M:     { label: 'Morning',      time: '8:00 AM – 2:00 PM',          hours: '6 hrs',  bg: 'bg-blue-500/20',    text: 'text-blue-200',    border: 'border-blue-500/40',   dot: 'bg-blue-400'    },
  A:     { label: 'Afternoon',    time: '2:00 PM – 8:00 PM',          hours: '6 hrs',  bg: 'bg-amber-500/20',   text: 'text-amber-200',   border: 'border-amber-500/40',  dot: 'bg-amber-400'   },
  N:     { label: 'Night',        time: 'Night shift',                 hours: '12 hrs', bg: 'bg-purple-500/20',  text: 'text-purple-200',  border: 'border-purple-500/40', dot: 'bg-purple-400'  },
  D:     { label: 'Day',          time: '8:00 AM – 5:00 PM',          hours: '9 hrs',  bg: 'bg-emerald-500/20', text: 'text-emerald-200', border: 'border-emerald-500/40',dot: 'bg-emerald-400' },
  L:     { label: 'Long / Leave', time: '7:00 AM – 7:00 PM or Leave', hours: '12 hrs', bg: 'bg-cyan-500/20',    text: 'text-cyan-200',    border: 'border-cyan-500/40',   dot: 'bg-cyan-400'    },
  W:     { label: 'Ward Duty',    time: 'Ward assignment',             hours: '—',      bg: 'bg-teal-500/20',    text: 'text-teal-200',    border: 'border-teal-500/40',   dot: 'bg-teal-400'    },
  SUS:   { label: 'Suspended',    time: 'Not on duty',                 hours: '—',      bg: 'bg-red-500/20',     text: 'text-red-300',     border: 'border-red-500/40',    dot: 'bg-red-500'     },
  AL:    { label: 'Annual Leave', time: '—',                           hours: '—',      bg: 'bg-pink-500/20',    text: 'text-pink-300',    border: 'border-pink-500/40',   dot: 'bg-pink-400'    },
  ML:    { label: 'Mat. Leave',   time: '—',                           hours: '—',      bg: 'bg-pink-400/15',    text: 'text-pink-300',    border: 'border-pink-400/30',   dot: 'bg-pink-400'    },
  PL:    { label: 'Pat. Leave',   time: '—',                           hours: '—',      bg: 'bg-pink-400/15',    text: 'text-pink-300',    border: 'border-pink-400/30',   dot: 'bg-pink-400'    },
  T:     { label: 'Training',     time: '—',                           hours: '—',      bg: 'bg-orange-500/20',  text: 'text-orange-300',  border: 'border-orange-500/40', dot: 'bg-orange-400'  },
  'L/B': { label: 'Long/Break',   time: '12-hr + break',               hours: '12 hrs', bg: 'bg-sky-500/20',     text: 'text-sky-200',     border: 'border-sky-500/40',    dot: 'bg-sky-400'     },
  'N/B': { label: 'Night/Break',  time: 'Night + break',               hours: '12 hrs', bg: 'bg-violet-500/20',  text: 'text-violet-200',  border: 'border-violet-500/40', dot: 'bg-violet-400'  },
  O:     { label: 'Off',          time: '—',                           hours: '—',      bg: 'bg-zinc-800/20',    text: 'text-zinc-500',    border: 'border-zinc-700/20',   dot: 'bg-zinc-700'    },
}
const SHIFT_CODES = Object.keys(SHIFTS)
const DEPARTMENTS  = Object.keys(ROTA_DATA)
const DOW          = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface MonthDef { key: string; label: string; days: number; startDow: number; isCustom?: boolean }

interface StaffRow {
  id:       string          // React key (random, changes on re-mount)
  empId:    string          // Stable HR identifier — real AMC emp_code when available
  name:     string
  isLocum:  boolean
  schedule: Record<string, string>
}
type RosterStore = Record<string, StaffRow[]>   // `dept::monthKey` → rows

// ─────────────────────────────────────────────────────────────────────────────
// BASE MONTHS
// ─────────────────────────────────────────────────────────────────────────────
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
  if (s === 'ML')                         return 'ML'
  if (s === 'PL')                         return 'PL'
  if (s === 'AL')                         return 'AL'
  if (s === 'SL')                         return 'O'   // Sick leave → Off for display
  if (SHIFTS[s])                          return s
  return SHIFTS[s[0]] ? s[0] : 'O'
}

let _idCounter = 1
function makeReactKey() { return `r${(_idCounter++).toString(36)}` }

// [REAL EMP CODES] Use the real emp_code stored on each staff member in
// rotaData. If none is present, fall back to a runtime-generated ID.
function makeEmpId(empCode?: string): string {
  if (empCode && empCode.trim()) return empCode.trim()
  return `AMC-${String(_idCounter++).padStart(4, '0')}`
}

function isLocum(name: string): boolean {
  return name.toUpperCase().includes('(LOCUM)') ||
         name.toUpperCase().startsWith('LOCUM')
}

// Filter out legend/header rows — not real staff
function isLegendRow(name: string): boolean {
  const n = name.trim().toUpperCase()
  if (/^[A-Z\/]{1,3}\s*[-–]\s*(DAY|NIGHT|MORNING|AFTERNOON|SHIFT|LEAVE|BREAK|WARD|TRAINING|OFF|FREE|REST|PRESENT|ANNUAL|MAT|PAT)/.test(n)) return true
  if (/^(AL|ML|PL|SUS|L\/B|N\/B|D\/B|HR)\s*$/.test(n)) return true
  if (/^[MANDLWTPF]\s*[-–]/.test(n)) return true
  // Generic placeholder rows
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

// buildInitialStore: reads rotaData, strips legend rows, assigns emp_codes
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
          // [REAL EMP CODES] Use emp_code from rotaData if present
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
// BIOTIME CONNECTION CHECK
// Reads the `biotime_config` table. If no row exists or connected = false,
// BioTime is considered disconnected.
// ─────────────────────────────────────────────────────────────────────────────
type BioTimeStatus = 'checking' | 'connected' | 'disconnected'

async function checkBioTimeConnection(): Promise<boolean> {
  try {
    // Try to read any biotime_config row
    const { data, error } = await (supabase as any)
      .from('biotime_config')
      .select('connected, host')
      .limit(1)
      .maybeSingle()

    if (error) {
      // Table might not exist yet — treat as disconnected, not an error
      console.warn('biotime_config check:', error.message)
      return false
    }
    return data?.connected === true
  } catch {
    return false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BIOTIME DISCONNECTED SCREEN
// Shown when BioTime is not connected. Includes IT contact email.
// ─────────────────────────────────────────────────────────────────────────────
const IT_CONTACT_EMAIL = 'it@accramedicalcentre.com'

function BioTimeDisconnectedScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      {/* Icon */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center">
          <WifiOff size={36} className="text-zinc-500" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-zinc-900 flex items-center justify-center">
          <span className="text-white text-[9px] font-black">!</span>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-xl font-extrabold text-white mb-2">
        BioTime Not Connected
      </h2>
      <p className="text-zinc-400 text-sm max-w-md mb-8 leading-relaxed">
        The Duty Roster requires a live connection to the ZK BioTime 9.0 server
        on the AMC internal network. Attendance data and shift records will
        appear here once the connection is established.
      </p>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-sm mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-left">
          <div className="flex items-center gap-2 mb-1.5">
            <Wifi size={13} className="text-amber-400" />
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Network</span>
          </div>
          <p className="text-zinc-500 text-xs leading-relaxed">
            Must be on the AMC internal network or connected via VPN
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-left">
          <div className="flex items-center gap-2 mb-1.5">
            <Settings size={13} className="text-amber-400" />
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Setup</span>
          </div>
          <p className="text-zinc-500 text-xs leading-relaxed">
            BioTime server host and API key must be configured in Settings
          </p>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0">
          <Mail size={15} className="text-amber-400" />
        </div>
        <div className="text-left">
          <p className="text-xs text-zinc-500 leading-tight">Need help setting up? Contact IT support</p>
          <a
            href={`mailto:${IT_CONTACT_EMAIL}`}
            className="text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            {IT_CONTACT_EMAIL}
          </a>
        </div>
      </div>

      {/* Retry hint */}
      <p className="text-zinc-700 text-xs mt-6">
        This page will automatically refresh once a connection is detected
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SHIFT PICKER CELL
// ─────────────────────────────────────────────────────────────────────────────
function ShiftCell({ code, editable, onEdit, day, dow, name, empId }: {
  code: string; editable: boolean; onEdit: (c: string) => void
  day: number; dow: string; name: string; empId: string
}) {
  const [open, setOpen] = useState(false)
  const cfg   = SHIFTS[code] || SHIFTS.O
  const isOff = code === 'O'

  return (
    <td className={`px-0.5 py-1 relative align-middle ${isWknd(dow) ? 'bg-zinc-800/20' : ''}`}>
      <div
        title={`${name} (${empId}) · ${dow} ${day} · ${cfg.label}`}
        onClick={() => editable && setOpen(o => !o)}
        className={`h-11 w-[52px] rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all select-none
          ${isOff ? 'bg-zinc-800/20 border-zinc-800/30' : `${cfg.bg} ${cfg.border}`}
          ${editable ? 'cursor-pointer hover:ring-2 hover:ring-amber-400/50 active:scale-95' : 'cursor-default'}
        `}
      >
        {isOff
          ? <span className="text-zinc-700 text-[10px] font-bold">—</span>
          : <>
              <span className={`text-[11px] font-extrabold leading-none ${cfg.text}`}>{code}</span>
              <span className={`text-[8px] leading-none ${cfg.text} opacity-70`}>{cfg.label.slice(0,5)}</span>
            </>
        }
        {editable && <Edit3 size={7} className="text-zinc-600 absolute top-1 right-1 opacity-40" />}
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-12 left-0 bg-zinc-800 border border-zinc-600 rounded-2xl shadow-2xl p-2.5 w-64">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-1 pb-2">
              {name} · {dow} {day}
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {SHIFT_CODES.map(c => {
                const s = SHIFTS[c]
                return (
                  <button key={c} onClick={() => { onEdit(c); setOpen(false) }}
                    className={`flex flex-col items-center py-2 rounded-xl border font-bold transition-all hover:brightness-125 active:scale-95
                      ${c === code ? 'ring-2 ring-amber-400' : ''} ${s.bg} ${s.border} ${s.text} text-[10px]`}>
                    {c}
                    <span className="font-normal opacity-60 text-[7px] mt-0.5">{s.label.slice(0,5)}</span>
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
function AddMonthModal({ existingMonths, onAdd, onClose }: {
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
    const m: MonthDef = {
      key: `custom-${val}`, label: label.trim() || autoLabel,
      days, startDow, isCustom: true,
    }
    onAdd(m, copyFrom || null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Plus size={18} className="text-amber-400" /> Add Month
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Month *</label>
            <input type="month" value={val} onChange={e => setVal(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-amber-500/60 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Copy staff from</label>
            <select value={copyFrom} onChange={e => setCopyFrom(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-amber-500/60 transition-all">
              <option value="">Start empty</option>
              {existingMonths.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
            <p className="text-zinc-600 text-[10px] mt-1">
              Staff names &amp; IDs from that month are copied. Shifts start as Off.
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Label (optional)</label>
            <input type="text" placeholder="e.g. April 2026" value={label} onChange={e => setLabel(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-amber-500/60 transition-all" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 font-semibold text-sm hover:text-white transition-all">
            Cancel
          </button>
          <button onClick={handleAdd} disabled={!val}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm disabled:opacity-40 transition-all">
            Add Month
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD EMPLOYEE PANEL
// ─────────────────────────────────────────────────────────────────────────────
function AddEmployeeRow({ onAdd }: { onAdd: (name: string, empId: string) => void }) {
  const [name, setName]   = useState('')
  const [empId, setEmpId] = useState('AMC/')

  const submit = () => {
    const n = name.trim()
    const e = empId.trim() || `AMC-NEW-${Date.now()}`
    if (!n) return
    onAdd(n, e)
    setName('')
    setEmpId('AMC/')
  }

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
      <UserPlus size={14} className="text-amber-400 shrink-0" />
      <input value={name} onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder="Employee full name"
        className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition-all"
        style={{ minWidth: 180 }} />
      <input value={empId} onChange={e => setEmpId(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder="AMC/ACC/…"
        className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-amber-500/50 transition-all w-40" />
      <button onClick={submit} disabled={!name.trim()}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm disabled:opacity-40 transition-all shrink-0">
        <Check size={12} /> Add Employee
      </button>
      <span className="text-zinc-600 text-[10px]">Press Enter to submit</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ROSTER TABLE
// ─────────────────────────────────────────────────────────────────────────────
function RosterTable({ dept, staff, monthDef, editMode, onEditCell, onRemoveStaff }: {
  dept: string; staff: StaffRow[]; monthDef: MonthDef; editMode: boolean
  onEditCell:    (empId: string, day: string, code: string) => void
  onRemoveStaff: (empId: string) => void
}) {
  const color       = ROTA_DATA[dept]?.color || '#6b7280'
  const days        = Array.from({ length: monthDef.days }, (_, i) => i + 1)
  const sortedStaff = sortStaff(staff)
  const locumCount  = sortedStaff.filter(s => s.isLocum).length

  if (staff.length === 0) return (
    <div className="py-12 text-center">
      <Users size={28} className="text-zinc-700 mx-auto mb-2" />
      <p className="text-zinc-500 text-sm font-semibold">No staff in this roster</p>
      {editMode && <p className="text-zinc-700 text-xs mt-1">Use the "Add Employee" form above to add staff</p>}
    </div>
  )

  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse" style={{ minWidth: `${220 + monthDef.days * 54}px` }}>
        <thead>
          <tr className="bg-zinc-800/50 border-b border-zinc-800">
            <th className="sticky left-0 bg-zinc-800/95 backdrop-blur text-left px-4 py-3 font-bold text-[11px] uppercase tracking-wider text-zinc-400 border-r border-zinc-700 z-10" style={{ minWidth: 220 }}>
              Staff
              {locumCount > 0 && (
                <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20 normal-case tracking-normal">
                  {locumCount} locum{locumCount > 1 ? 's' : ''}
                </span>
              )}
            </th>
            {days.map(d => {
              const dw = getDow(monthDef, d)
              return (
                <th key={d} className={`text-center py-2 px-0.5 min-w-[52px] ${isWknd(dw) ? 'bg-zinc-800/30' : ''}`}>
                  <div className={`text-[9px] font-bold uppercase ${isWknd(dw) ? 'text-zinc-600' : 'text-zinc-500'}`}>{dw}</div>
                  <div className={`text-sm font-extrabold mt-0.5 ${isWknd(dw) ? 'text-zinc-600' : 'text-zinc-300'}`}>{d}</div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sortedStaff.map((s, i) => {
            const isFirstLocum = s.isLocum && (i === 0 || !sortedStaff[i - 1].isLocum)
            return (
              <>
                {isFirstLocum && (
                  <tr key={`divider-${s.empId}`} className="border-b border-orange-500/20">
                    <td colSpan={days.length + 1} className="px-4 py-1.5 bg-orange-500/5 border-t border-orange-500/20">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400/70 flex items-center gap-1.5">
                        <span className="inline-block w-4 h-px bg-orange-500/40" />
                        Locum Staff
                        <span className="inline-block flex-1 h-px bg-orange-500/20" />
                      </span>
                    </td>
                  </tr>
                )}
                <tr key={s.empId}
                  className={`border-b transition-colors ${
                    s.isLocum
                      ? 'border-orange-500/10 bg-orange-500/5 hover:bg-orange-500/10'
                      : `border-zinc-800/40 hover:bg-zinc-800/20 ${i % 2 === 1 ? 'bg-zinc-800/10' : ''}`
                  }`}
                >
                  <td className={`sticky left-0 px-3 py-1 border-r z-10 ${
                    s.isLocum ? 'bg-orange-950/40 border-orange-500/20' : 'bg-zinc-900 border-zinc-800'
                  }`} style={{ minWidth: 220 }}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-extrabold shrink-0"
                        style={{
                          background: s.isLocum ? 'rgba(249,115,22,0.25)' : color + '55',
                          color:      s.isLocum ? '#fb923c' : '#fff',
                        }}>
                        {s.name.replace(/\s*\(LOCUM\)/gi, '').split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className={`font-semibold text-xs leading-tight truncate ${s.isLocum ? 'text-orange-200' : 'text-zinc-200'}`}>
                            {s.name.replace(/\s*\(LOCUM\)/gi, '')}
                          </p>
                          {s.isLocum && (
                            <span className="shrink-0 text-[8px] font-black px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase tracking-wide">
                              Locum
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] font-mono leading-tight ${s.isLocum ? 'text-orange-500/60' : 'text-zinc-500'}`}>
                          {s.empId}
                        </p>
                      </div>
                      {editMode && (
                        <button onClick={() => onRemoveStaff(s.empId)}
                          title={`Remove ${s.name}`}
                          className="ml-auto shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-all">
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  </td>
                  {days.map(d => {
                    const ds   = String(d)
                    const code = normalize(s.schedule?.[ds])
                    return (
                      <ShiftCell key={d} code={code} editable={editMode}
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
  // ── [BIOTIME GATE] Check connection on mount ──────────────────────────────
  const [bioTimeStatus, setBioTimeStatus] = useState<BioTimeStatus>('checking')

  useEffect(() => {
    let cancelled = false
    checkBioTimeConnection().then(connected => {
      if (!cancelled) setBioTimeStatus(connected ? 'connected' : 'disconnected')
    })
    // Poll every 30s in case connection is established while page is open
    const interval = setInterval(() => {
      checkBioTimeConnection().then(connected => {
        if (!cancelled) setBioTimeStatus(connected ? 'connected' : 'disconnected')
      })
    }, 30_000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  const [tab, setTab]           = useState<'dept' | 'all'>('dept')
  const [dept, setDept]         = useState('Pharmacy')
  const [monthKey, setMonthKey] = useState('jan')
  const [search, setSearch]     = useState('')
  const [editMode, setEditMode] = useState(false)
  const [showLegend, setShowLegend]     = useState(true)
  const [showAddMonth, setShowAddMonth] = useState(false)
  const [customMonths, setCustomMonths] = useState<MonthDef[]>([])
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({})

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
  }, [])

  const shiftSummary = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredStaff.forEach(s => {
      for (let d = 1; d <= currentMonth.days; d++) {
        const code = normalize(s.schedule?.[String(d)])
        if (code !== 'O') counts[code] = (counts[code] || 0) + 1
      }
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [filteredStaff, currentMonth])

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

  // ── [BIOTIME GATE] Render gate screens before roster content ──────────────
  if (bioTimeStatus === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 size={28} className="text-amber-400 animate-spin" />
        <p className="text-zinc-500 text-sm">Checking BioTime connection…</p>
      </div>
    )
  }

  if (bioTimeStatus === 'disconnected') {
    return (
      <div style={{ padding: '16px 24px', maxWidth: '100%', boxSizing: 'border-box' }}>
        {/* Page header — still visible so the user knows which page they're on */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
            <Calendar size={19} className="text-amber-400 shrink-0" /> Duty Roster
          </h1>
          <p className="text-zinc-500 text-xs">Accra Medical Centre</p>
        </div>
        <BioTimeDisconnectedScreen />
      </div>
    )
  }

  // ── CONNECTED — render full roster ────────────────────────────────────────
  return (
    <div style={{ padding: '16px 24px', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
    <div className="space-y-4" style={{ maxWidth: '100%', minWidth: 0 }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
          <Calendar size={19} className="text-amber-400 shrink-0" /> Duty Roster
          {/* BioTime connected badge */}
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            <Wifi size={9} /> BioTime Connected
          </span>
        </h1>
        <p className="text-zinc-500 text-xs mb-3">
          {allMonths.length} months · {DEPARTMENTS.length} departments · Accra Medical Centre
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setEditMode(e => !e)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${
              editMode
                ? 'bg-amber-500 border-amber-500 text-black'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
            }`}>
            <Edit3 size={13} /> {editMode ? '✓ Editing On' : 'Edit Rota'}
          </button>
          <button onClick={() => setShowAddMonth(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold text-sm hover:text-white transition-all">
            <Plus size={13} /> Add Month
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-700 border border-zinc-600 text-zinc-200 font-bold text-sm hover:bg-zinc-600 transition-all">
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* ── MONTH TABS ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button onClick={() => setMonthKey(allMonths[Math.max(0, monthIdx - 1)].key)}
          disabled={monthIdx === 0}
          className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 transition-all shrink-0">
          <ChevronLeft size={13} />
        </button>
        <div className="flex flex-wrap gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          {allMonths.map(m => (
            <button key={m.key} onClick={() => setMonthKey(m.key)}
              className={`relative px-3 py-1.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                monthKey === m.key ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}>
              {m.label}
              {m.isCustom && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full border-2 border-zinc-900" />
              )}
            </button>
          ))}
        </div>
        <button onClick={() => setMonthKey(allMonths[Math.min(allMonths.length - 1, monthIdx + 1)].key)}
          disabled={monthIdx === allMonths.length - 1}
          className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 transition-all shrink-0">
          <ChevronRight size={13} />
        </button>
      </div>

      {/* ── VIEW TABS ──────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
        {(['dept','all'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              tab === t ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
            }`}>
            {t === 'dept' ? <><Users size={13} /> Department</> : <><Layers size={13} /> All Departments</>}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ALL DEPARTMENTS TAB
      ════════════════════════════════════════════════════════════════════ */}
      {tab === 'all' && (
        <div className="space-y-3">
          {DEPARTMENTS.map(d => {
            const dStaff   = getStaff(d, monthKey)
            const color    = ROTA_DATA[d]?.color || '#6b7280'
            const expanded = expandedDepts[d] ?? false
            const counts: Record<string, number> = {}
            dStaff.forEach(s => {
              for (let day = 1; day <= currentMonth.days; day++) {
                const code = normalize(s.schedule?.[String(day)])
                if (code !== 'O') counts[code] = (counts[code] || 0) + 1
              }
            })
            return (
              <div key={d} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-zinc-800/20 select-none"
                  style={{ borderLeft: `3px solid ${color}` }}
                  onClick={() => setExpandedDepts(p => ({ ...p, [d]: !p[d] }))}>
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                  <span className="font-bold text-white text-sm">{d}</span>
                  <span className="text-zinc-500 text-xs">{dStaff.length} staff</span>
                  {dStaff.filter(s => s.isLocum).length > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20">
                      {dStaff.filter(s => s.isLocum).length} locum
                    </span>
                  )}
                  <div className="flex flex-wrap gap-1 ml-2 flex-1 min-w-0">
                    {Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([c, n]) => {
                      const cfg = SHIFTS[c] || SHIFTS.O
                      return <span key={c} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.text}`}>{c} {n}</span>
                    })}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={e => { e.stopPropagation(); setDept(d); setTab('dept') }}
                      className="text-xs text-zinc-500 hover:text-amber-400 font-semibold transition-colors">
                      View →
                    </button>
                    <ChevronDown size={13} className={`text-zinc-600 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                {expanded && (
                  <div className="border-t border-zinc-800">
                    {editMode && (
                      <div className="px-4 pt-3">
                        <AddEmployeeRow onAdd={(name, empId) => {
                          const k = `${d}::${monthKey}`
                          setRoster(prev => ({
                            ...prev,
                            [k]: [...(prev[k]||[]), { id: makeReactKey(), empId, name, isLocum: isLocum(name), schedule: {} }]
                          }))
                        }} />
                      </div>
                    )}
                    <RosterTable dept={d} staff={dStaff} monthDef={currentMonth}
                      editMode={editMode}
                      onEditCell={(empId, day, code) => editCellAny(d, monthKey, empId, day, code)}
                      onRemoveStaff={empId => {
                        const k = `${d}::${monthKey}`
                        setRoster(prev => ({ ...prev, [k]: (prev[k] || []).filter(s => s.empId !== empId) }))
                      }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          DEPARTMENT TAB
      ════════════════════════════════════════════════════════════════════ */}
      {tab === 'dept' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {DEPARTMENTS.map(d => {
              const active = dept === d
              const color  = ROTA_DATA[d]?.color || '#6b7280'
              const cnt    = getStaff(d, monthKey).length
              const locums = getStaff(d, monthKey).filter(s => s.isLocum).length
              return (
                <button key={d} onClick={() => setDept(d)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    active ? 'text-white' : 'text-zinc-400 border-zinc-700/60 bg-zinc-800/40 hover:text-white hover:border-zinc-600'
                  }`}
                  style={active ? { background: color + '33', borderColor: color + '66' } : {}}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: active ? color : '#52525b' }} />
                  {d} <span className="opacity-60">{cnt}</span>
                  {locums > 0 && <span className="text-[8px] font-black px-1 py-0.5 rounded-full bg-orange-500/20 text-orange-400">L</span>}
                </button>
              )
            })}
          </div>

          {editMode && <AddEmployeeRow onAdd={addEmployee} />}

          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or ID…"
                className="pl-8 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 w-full transition-all" />
            </div>
            <span className="text-zinc-600 text-xs flex items-center gap-1">
              <Users size={12} /> {filteredStaff.length}
            </span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl" style={{ overflow: 'hidden', minWidth: 0 }}>
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2"
              style={{ borderLeft: `3px solid ${ROTA_DATA[dept]?.color || '#6b7280'}` }}>
              <span className="font-extrabold text-white">{dept}</span>
              <span className="text-zinc-400 text-sm">{currentMonth.label}</span>
              <span className="text-zinc-600 text-xs">· {currentMonth.days} days</span>
              {editMode && (
                <span className="ml-auto text-amber-400 text-xs font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                  Edit Mode
                </span>
              )}
            </div>
            <RosterTable dept={dept} staff={filteredStaff} monthDef={currentMonth}
              editMode={editMode} onEditCell={editCell} onRemoveStaff={removeStaff} />
            <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-800/20">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-2">Monthly Shift Totals</p>
              {shiftSummary.length === 0
                ? <p className="text-zinc-700 text-xs">No shifts set — add employees and assign shifts</p>
                : <div className="flex flex-wrap gap-1.5">
                    {shiftSummary.map(([code, count]) => {
                      const cfg = SHIFTS[code] || SHIFTS.O
                      return (
                        <span key={code} className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-bold ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                          {code} · {cfg.label} · {count}
                        </span>
                      )
                    })}
                  </div>
              }
            </div>
          </div>
        </div>
      )}

      {/* ── SHIFT LEGEND ───────────────────────────────────────────────────── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl" style={{ overflow: 'hidden', minWidth: 0, maxWidth: '100%' }}>
        <button onClick={() => setShowLegend(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/30 transition-all">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Shift Legend</span>
          <ChevronDown size={14} className={`text-zinc-500 transition-transform ${showLegend ? 'rotate-180' : ''}`} />
        </button>
        {showLegend && (
          <div className="border-t border-zinc-800/50" style={{ padding: '12px 16px 16px', minWidth: 0 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '6px', width: '100%', minWidth: 0,
            }}>
              {Object.entries(SHIFTS).map(([code, cfg]) => (
                <div key={code} className={`flex items-center gap-2 rounded-xl border ${cfg.bg} ${cfg.border}`}
                  style={{ padding: '8px 12px', minWidth: 0, overflow: 'hidden' }}>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <p className={`text-xs font-extrabold truncate ${cfg.text}`}>{code} — {cfg.label}</p>
                    {cfg.time !== '—' && (
                      <p className="text-zinc-500 text-[10px] leading-tight truncate">
                        {cfg.time}{cfg.hours !== '—' ? ` · ${cfg.hours}` : ''}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-zinc-600 text-[10px] mt-2">
              * W = Ward Duty · SUS = Suspended · L/B = Long + Break · N/B = Night + Break
            </p>
          </div>
        )}
      </div>

      {showAddMonth && (
        <AddMonthModal existingMonths={allMonths} onAdd={addMonth} onClose={() => setShowAddMonth(false)} />
      )}
    </div>
    </div>
  )
}