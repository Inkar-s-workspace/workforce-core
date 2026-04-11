/**
 * mockData.ts — Real AMC employee names from ROTA data
 * Replaces the randomly generated fake names with actual staff from rotaData.ts
 * Departments map to the 6 Supabase departments seeded in the migration.
 */

import { Employee, AttendanceRecord, CreditBalance, Department } from "@/types/attendance";

export const mockDepartments: Department[] = [
  { id: "dept-1", name: "Administration" },
  { id: "dept-2", name: "Allied Health" },
  { id: "dept-3", name: "Auxiliary" },
  { id: "dept-4", name: "Medicine" },
  { id: "dept-5", name: "Nursing & Midwifery" },
  { id: "dept-6", name: "Pharmacy" },
];

// Real AMC staff mapped to Supabase departments
// Administration → Front Office staff
// Allied Health  → Imaging + Laboratory staff
// Auxiliary      → Maintenance staff
// Medicine       → Medicine staff
// Nursing        → Ward + HDU/ICU + Emergency staff
// Pharmacy       → Pharmacy staff

const REAL_STAFF: { dept_id: string; dept_name: string; first: string; last: string; position: string; is_head: boolean }[] = [
  // Administration (Front Office)
  { dept_id: "dept-1", dept_name: "Administration", first: "ELLEN",          last: "EKEWORM",          position: "Receptionist",       is_head: true  },
  { dept_id: "dept-1", dept_name: "Administration", first: "BRIDGET",        last: "MORTEY",           position: "Receptionist",       is_head: false },
  { dept_id: "dept-1", dept_name: "Administration", first: "REBECCA",        last: "MACCARTHY",        position: "Admin Officer",      is_head: false },
  { dept_id: "dept-1", dept_name: "Administration", first: "RITA",           last: "BOAKYE",           position: "Admin Officer",      is_head: false },
  { dept_id: "dept-1", dept_name: "Administration", first: "MARY",           last: "OWUSU OSAAH",      position: "Admin Officer",      is_head: false },
  { dept_id: "dept-1", dept_name: "Administration", first: "ADRIANA",        last: "BRENDA ADOM",      position: "Receptionist",       is_head: false },
  { dept_id: "dept-1", dept_name: "Administration", first: "THELMA",         last: "NUTAKOR",          position: "Admin Officer",      is_head: false },
  { dept_id: "dept-1", dept_name: "Administration", first: "PRISCILLA",      last: "SACKEY",           position: "Admin Officer",      is_head: false },
  { dept_id: "dept-1", dept_name: "Administration", first: "SARAH",          last: "AMANATEY",         position: "Admin Officer",      is_head: false },
  { dept_id: "dept-1", dept_name: "Administration", first: "VALERIE",        last: "AMEXO",            position: "Admin Officer",      is_head: false },
  { dept_id: "dept-1", dept_name: "Administration", first: "ROSELINE",       last: "GADAGOE",          position: "Admin Officer",      is_head: false },
  { dept_id: "dept-1", dept_name: "Administration", first: "WILLIAM",        last: "NNURO",            position: "Admin Officer",      is_head: false },

  // Allied Health (Imaging + Laboratory)
  { dept_id: "dept-2", dept_name: "Allied Health",  first: "MATHEW",         last: "THOMAS",           position: "Radiographer",       is_head: true  },
  { dept_id: "dept-2", dept_name: "Allied Health",  first: "SIMON PROSPER",  last: "ANUMAH",           position: "Radiographer",       is_head: false },
  { dept_id: "dept-2", dept_name: "Allied Health",  first: "SAMUEL",         last: "AWURO",            position: "Radiographer",       is_head: false },
  { dept_id: "dept-2", dept_name: "Allied Health",  first: "SAMUEL",         last: "OSEI",             position: "Sonographer",        is_head: false },
  { dept_id: "dept-2", dept_name: "Allied Health",  first: "GIDEON",         last: "TAWIAH",           position: "Sonographer",        is_head: false },
  { dept_id: "dept-2", dept_name: "Allied Health",  first: "ROSINA",         last: "AMPOMAH",          position: "Imaging Nurse",      is_head: false },
  { dept_id: "dept-2", dept_name: "Allied Health",  first: "BENJAMIN",       last: "AKUETTEH",         position: "Lab Scientist",      is_head: false },
  { dept_id: "dept-2", dept_name: "Allied Health",  first: "STEPHANE",       last: "ASARE-BOATENG",    position: "Lab Scientist",      is_head: false },
  { dept_id: "dept-2", dept_name: "Allied Health",  first: "RAPHAEL",        last: "AKORLI AGBESI",    position: "Lab Scientist",      is_head: false },
  { dept_id: "dept-2", dept_name: "Allied Health",  first: "COLLINS",        last: "AMPONSAH",         position: "Lab Technician",     is_head: false },
  { dept_id: "dept-2", dept_name: "Allied Health",  first: "JANET",          last: "BREW-YALLEY",      position: "Lab Technician",     is_head: false },
  { dept_id: "dept-2", dept_name: "Allied Health",  first: "BENEDICT",       last: "BOAMAH",           position: "Lab Technician",     is_head: false },

  // Auxiliary (Maintenance)
  { dept_id: "dept-3", dept_name: "Auxiliary",      first: "FRANCK",         last: "KOUASI HONORE",    position: "Maintenance Officer",is_head: true  },
  { dept_id: "dept-3", dept_name: "Auxiliary",      first: "JOHN",           last: "AGBENYENYAH",      position: "Maintenance Officer",is_head: false },
  { dept_id: "dept-3", dept_name: "Auxiliary",      first: "RICHARD",        last: "MORTEY",           position: "Maintenance Officer",is_head: false },
  { dept_id: "dept-3", dept_name: "Auxiliary",      first: "NANA KWADWO",    last: "FRIMPONG",         position: "Maintenance Officer",is_head: false },
  { dept_id: "dept-3", dept_name: "Auxiliary",      first: "VIVIAN",         last: "RENNER",           position: "Maintenance Officer",is_head: false },

  // Medicine
  { dept_id: "dept-4", dept_name: "Medicine",       first: "EMMANUEL LOUIS", last: "NTERFUL",          position: "Physician",          is_head: true  },
  { dept_id: "dept-4", dept_name: "Medicine",       first: "NANA AKUA",      last: "NTONI",            position: "Physician",          is_head: false },
  { dept_id: "dept-4", dept_name: "Medicine",       first: "JEFFREY",        last: "PARKER",           position: "Physician",          is_head: false },
  { dept_id: "dept-4", dept_name: "Medicine",       first: "JOSEPH",         last: "AVEREYIREH",       position: "Physician",          is_head: false },
  { dept_id: "dept-4", dept_name: "Medicine",       first: "ERNEST",         last: "BOACHIE JNR.",     position: "Physician",          is_head: false },
  { dept_id: "dept-4", dept_name: "Medicine",       first: "SOPHIA",         last: "ACKON",            position: "Physician",          is_head: false },
  { dept_id: "dept-4", dept_name: "Medicine",       first: "NAZEEFA",        last: "YAKUBU",           position: "Physician",          is_head: false },
  { dept_id: "dept-4", dept_name: "Medicine",       first: "NATHANIEL",      last: "ATTOH",            position: "Physician",          is_head: false },
  { dept_id: "dept-4", dept_name: "Medicine",       first: "TAMNIBIM",       last: "COOKEY",           position: "Physician",          is_head: false },
  { dept_id: "dept-4", dept_name: "Medicine",       first: "AKOSUA",         last: "ANANE-DARKO",      position: "Physician",          is_head: false },
  { dept_id: "dept-4", dept_name: "Medicine",       first: "ISAAC",          last: "OPOKU FOFIE",      position: "Physician",          is_head: false },
  { dept_id: "dept-4", dept_name: "Medicine",       first: "SARAH",          last: "TOSEAFA",          position: "Physician",          is_head: false },
  { dept_id: "dept-4", dept_name: "Medicine",       first: "RAPHAELA",       last: "AGYARKO",          position: "Physician",          is_head: false },
  { dept_id: "dept-4", dept_name: "Medicine",       first: "SYLVESTER",      last: "NAKOTEY",          position: "Physician",          is_head: false },

  // Nursing & Midwifery (Ward + HDU/ICU + Emergency)
  { dept_id: "dept-5", dept_name: "Nursing & Midwifery", first: "AKUA",          last: "ASAMOAH-FREMPONG", position: "Registered Nurse",   is_head: true  },
  { dept_id: "dept-5", dept_name: "Nursing & Midwifery", first: "DEBORAH",       last: "QUARTEY",          position: "Registered Nurse",   is_head: false },
  { dept_id: "dept-5", dept_name: "Nursing & Midwifery", first: "ANGELA",        last: "YEVU",             position: "Registered Nurse",   is_head: false },
  { dept_id: "dept-5", dept_name: "Nursing & Midwifery", first: "ANITA",         last: "BANAALEH",         position: "Registered Nurse",   is_head: false },
  { dept_id: "dept-5", dept_name: "Nursing & Midwifery", first: "ANITA",         last: "OSEI",             position: "Registered Nurse",   is_head: false },
  { dept_id: "dept-5", dept_name: "Nursing & Midwifery", first: "CASSANDRA",     last: "MENSAH",           position: "Registered Nurse",   is_head: false },
  { dept_id: "dept-5", dept_name: "Nursing & Midwifery", first: "JOSEPHINE",     last: "TUFFOUR",          position: "Midwife",            is_head: false },
  { dept_id: "dept-5", dept_name: "Nursing & Midwifery", first: "MAVIS",         last: "MIREKU",           position: "Registered Nurse",   is_head: false },
  { dept_id: "dept-5", dept_name: "Nursing & Midwifery", first: "RHODA",         last: "ACKON",            position: "Registered Nurse",   is_head: false },
  { dept_id: "dept-5", dept_name: "Nursing & Midwifery", first: "ANNA",          last: "QUANSAH",          position: "Registered Nurse",   is_head: false },
  { dept_id: "dept-5", dept_name: "Nursing & Midwifery", first: "EMMANUELLA",    last: "BOAKYE",           position: "Registered Nurse",   is_head: false },
  { dept_id: "dept-5", dept_name: "Nursing & Midwifery", first: "GLORIA",        last: "ANNAN",            position: "Registered Nurse",   is_head: false },
  { dept_id: "dept-5", dept_name: "Nursing & Midwifery", first: "JEMMIMAH",      last: "AGBODZAH",         position: "Registered Nurse",   is_head: false },
  { dept_id: "dept-5", dept_name: "Nursing & Midwifery", first: "THERESA DEDE",  last: "TUTU",             position: "Night Supervisor",   is_head: false },
  { dept_id: "dept-5", dept_name: "Nursing & Midwifery", first: "IRENE",         last: "BOTCHEAY",         position: "Registered Nurse",   is_head: false },
  { dept_id: "dept-5", dept_name: "Nursing & Midwifery", first: "JAHEL",         last: "DODOO",            position: "Registered Nurse",   is_head: false },
  { dept_id: "dept-5", dept_name: "Nursing & Midwifery", first: "GLORIA",        last: "TETTEH",           position: "Registered Nurse",   is_head: false },
  { dept_id: "dept-5", dept_name: "Nursing & Midwifery", first: "DZIDZOR",       last: "KPODO-TAY",        position: "Registered Nurse",   is_head: false },
  { dept_id: "dept-5", dept_name: "Nursing & Midwifery", first: "RICHARD",       last: "OBLIE",            position: "Registered Nurse",   is_head: false },
  { dept_id: "dept-5", dept_name: "Nursing & Midwifery", first: "ANITA LEBENE",  last: "AZAGLO-TAY",       position: "Clinical Nurse",     is_head: false },
  { dept_id: "dept-5", dept_name: "Nursing & Midwifery", first: "SANDRA",        last: "OTCHERE",          position: "Registered Nurse",   is_head: false },
  { dept_id: "dept-5", dept_name: "Nursing & Midwifery", first: "JOHN",          last: "ATUKUMAH",         position: "Registered Nurse",   is_head: false },
  { dept_id: "dept-5", dept_name: "Nursing & Midwifery", first: "MARGARET",      last: "AYIM",             position: "Registered Nurse",   is_head: false },
  { dept_id: "dept-5", dept_name: "Nursing & Midwifery", first: "ETHEL",         last: "BAIDOO-KONDUAH",   position: "Registered Nurse",   is_head: false },
  { dept_id: "dept-5", dept_name: "Nursing & Midwifery", first: "DEBORAH",       last: "MENSAH",           position: "Registered Nurse",   is_head: false },

  // Pharmacy
  { dept_id: "dept-6", dept_name: "Pharmacy",       first: "MARIETTE ABU",   last: "SARPONG",          position: "Pharmacist",         is_head: true  },
  { dept_id: "dept-6", dept_name: "Pharmacy",       first: "JOSEPHINE",      last: "ODURO",            position: "Pharmacist",         is_head: false },
  { dept_id: "dept-6", dept_name: "Pharmacy",       first: "MABEL",          last: "YEBOAH",           position: "Pharmacy Technician",is_head: false },
  { dept_id: "dept-6", dept_name: "Pharmacy",       first: "DOROTHY",        last: "ASARE",            position: "Pharmacy Technician",is_head: false },
  { dept_id: "dept-6", dept_name: "Pharmacy",       first: "ANBREW",         last: "BOAKYE-BOAMPONG",  position: "Pharmacy Technician",is_head: false },
  { dept_id: "dept-6", dept_name: "Pharmacy",       first: "SIMEON",         last: "BOAKYE YIADOM",    position: "Pharmacy Technician",is_head: false },
  { dept_id: "dept-6", dept_name: "Pharmacy",       first: "PHOEBE",         last: "TIAH",             position: "Pharmacy Technician",is_head: false },
  { dept_id: "dept-6", dept_name: "Pharmacy",       first: "MAC NOBERT",     last: "BAH",              position: "Pharmacy Technician",is_head: false },
];

function generateEmployees(): Employee[] {
  return REAL_STAFF.map((s, i) => ({
    id:              `emp-${i + 1}`,
    department_id:   s.dept_id,
    department_name: s.dept_name,
    emp_code:        `EMP${String(i + 1).padStart(4, "0")}`,
    first_name:      s.first,
    last_name:       s.last,
    position:        s.position,
    is_department_head: s.is_head,
  }));
}

function generateAttendance(employees: Employee[]): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const today = new Date();

  employees.forEach((emp) => {
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      const missedIn  = Math.random() < 0.08;
      const missedOut = Math.random() < 0.08;
      const clockInHour = 7 + Math.floor(Math.random() * 2);
      const clockInMin  = Math.floor(Math.random() * 60);
      const hoursWorked = 8 + Math.random() * 4 - 1;

      const clockIn  = missedIn  ? null : new Date(date.getFullYear(), date.getMonth(), date.getDate(), clockInHour, clockInMin).toISOString();
      const clockOut = missedOut ? null : (clockIn ? new Date(new Date(clockIn).getTime() + hoursWorked * 3600000).toISOString() : null);

      records.push({
        id:               `att-${emp.id}-${d}`,
        employee_id:      emp.id,
        date:             date.toISOString().split("T")[0],
        clock_in:         clockIn,
        clock_out:        clockOut,
        missed_clock_in:  missedIn,
        missed_clock_out: missedOut,
        hours_worked:     (!missedIn && !missedOut) ? Number(hoursWorked.toFixed(2)) : 0,
        is_overtime:      hoursWorked > 10,
        overtime_approved: false,
      });
    }
  });
  return records;
}

function generateCredits(employees: Employee[], attendance: AttendanceRecord[]): CreditBalance[] {
  const now = new Date();
  return employees.map((emp) => {
    const empAtt    = attendance.filter((a) => a.employee_id === emp.id);
    const missedIns  = empAtt.filter((a) => a.missed_clock_in).length;
    const missedOuts = empAtt.filter((a) => a.missed_clock_out).length;
    const missedBoth = empAtt.filter((a) => a.missed_clock_in && a.missed_clock_out).length;
    const deductions = (missedIns - missedBoth) * 100 + (missedOuts - missedBoth) * 100 + missedBoth * 200;
    const totalHours = empAtt.reduce((sum, a) => sum + a.hours_worked, 0);

    return {
      id:                `credit-${emp.id}`,
      employee_id:       emp.id,
      month:             now.getMonth() + 1,
      year:              now.getFullYear(),
      initial_credit:    1500,
      deductions,
      overtime_credits:  0,
      final_credit:      1500 - deductions,
      total_hours_worked: Number(totalHours.toFixed(2)),
      target_hours:      180,
    };
  });
}

export const mockEmployees  = generateEmployees();
export const mockAttendance = generateAttendance(mockEmployees);
export const mockCredits    = generateCredits(mockEmployees, mockAttendance);