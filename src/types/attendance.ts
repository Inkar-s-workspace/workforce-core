export interface Department {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  department_id: string;
  department_name: string;
  emp_code: string;
  first_name: string;
  last_name: string;
  position: string | null;
  is_department_head: boolean;
}

export type ShiftType = "day" | "long_day" | "morning" | "night";

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  shift_type: ShiftType;
  clock_in: string | null;
  clock_out: string | null;
  missed_clock_in: boolean;
  missed_clock_out: boolean;
  hours_worked: number;
  is_overtime: boolean;
  overtime_approved: boolean;
}

export interface CreditBalance {
  id: string;
  employee_id: string;
  month: number;
  year: number;
  initial_credit: number;
  deductions: number;
  overtime_credits: number;
  final_credit: number;
  total_hours_worked: number;
  target_hours: number;
}

export type AttendanceFilter = "all" | "missed_clock_in" | "missed_clock_out" | "missed_both" | "overtime";

export type LeaveType = "annual" | "sick" | "maternity" | "paternity" | "study" | "compassionate" | "casual";
export type LeaveStatus = "approved" | "pending" | "rejected" | "cancelled";

export interface LeaveRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  emp_code: string;
  department_id: string;
  department_name: string;
  position: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  duration_days: number;
  status: LeaveStatus;
  reason: string;
  applied_date: string;
  approved_by?: string;
  notes?: string;
}

export interface LeaveBalance {
  employee_id: string;
  employee_name: string;
  emp_code: string;
  department_id: string;
  department_name: string;
  position: string;
  is_probation: boolean;
  annual_entitlement: number;
  annual_taken: number;
  accumulated_carry_forward: number;
  accumulated_holidays: number;
  sick_entitlement: number;
  sick_taken: number;
}
