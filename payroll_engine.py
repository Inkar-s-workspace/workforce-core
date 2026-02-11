from __future__ import annotations
from dataclasses import dataclass
from datetime import date

REQUIRED_MINUTES = 180 * 60  

@dataclass
class AttendanceDay:
    employee_id: int
    day: date
    minutes: int
    disputed: bool = False

def classify(minutes_total: int) -> str:
    if minutes_total < REQUIRED_MINUTES:
        return "UNDER"
    if minutes_total == REQUIRED_MINUTES:
        return "EXACT"
    return "OVER"

def overtime_minutes(minutes_total: int, approved_minutes: int) -> int:
    extra = minutes_total - REQUIRED_MINUTES
    extra = max(0, extra)
    return min(extra, approved_minutes)

def apply_cutoff(records: list[AttendanceDay], cutoff_day: int = 25) -> list[AttendanceDay]:
    return [r for r in records if r.day.day <= cutoff_day]

def compute_payroll(records: list[AttendanceDay], approved_ot_minutes: int, cutoff_day: int = 25) -> dict:
    records = apply_cutoff(records, cutoff_day=cutoff_day)

    payable_total = sum(r.minutes for r in records if not r.disputed)

    return {
        "payable_total_minutes": payable_total,
        "classification": classify(payable_total),
        "overtime_minutes": overtime_minutes(payable_total, approved_ot_minutes),
        "approved_ot_minutes": approved_ot_minutes,
    }

if __name__ == "__main__":
    sample = [
        AttendanceDay(1, date(2026, 2, 10), 9 * 60),
        AttendanceDay(1, date(2026, 2, 11), 9 * 60),
        AttendanceDay(1, date(2026, 2, 26), 10 * 60),            #after cutoff
        AttendanceDay(1, date(2026, 2, 12), 8 * 60, disputed=True),  #disputed
    ]

    print(compute_payroll(sample, approved_ot_minutes=120))
