from collections import defaultdict

from payroll_engine import compute_payroll, apply_cutoff, REQUIRED_MINUTES


def generate_payroll_results(all_records, approvals_by_employee, cutoff_day=25):
    by_employee = defaultdict(list)

    for record in all_records:
        by_employee[record.employee_id].append(record)

    results = []

    for employee_id, records in by_employee.items():
        approved_ot = approvals_by_employee.get(employee_id, 0)

        payroll = compute_payroll(
            records,
            approved_ot_minutes=approved_ot,
            cutoff_day=cutoff_day,
        )

        filtered = apply_cutoff(records, cutoff_day)
        exceptions_count = sum(1 for r in filtered if r.disputed)

        results.append({
            "employee_id": employee_id,
            "required_minutes": REQUIRED_MINUTES,
            "payable_total_minutes": payroll["payable_total_minutes"],
            "payable_hours": round(payroll["payable_total_minutes"] / 60, 2),
            "classification": payroll["classification"],
            "overtime_minutes": payroll["overtime_minutes"],
            "approved_ot_minutes": approved_ot,
            "exceptions_count": exceptions_count,
        })

    return results

