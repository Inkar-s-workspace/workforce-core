/**
 * mockLeaveData.ts
 * Leave balances and records derived from the AMC Leave Data 2026 spreadsheet (PDF).
 *
 * Balance data:  annual entitlement, accumulated carry-forward, sick entitlement, sick taken.
 * Record data:   actual sick-leave requests with specific dates from the "Sick Leave Requested" column.
 * Maternity:     Sharon Sackey (Medicine) – documented multi-segment maternity leave 2025.
 *
 * Employees marked is_probation = true are those highlighted in yellow in the original PDF.
 */

import { LeaveBalance, LeaveRecord } from "@/types/attendance";

// ─── Leave Balances ───────────────────────────────────────────────────────────
// Columns from PDF:  annual_entitlement | annual_taken | accumulated_carry_forward
//                    accumulated_holidays | sick_entitlement | sick_taken
// is_probation = true for yellow-highlighted rows in the PDF.

export const mockLeaveBalances: LeaveBalance[] = [
  // ── Administration ──────────────────────────────────────────────────────────
  { employee_id:"emp-1",  employee_name:"Eunice Akorfa Togoh",        emp_code:"AMC/ACC/ADM/044", department_id:"dept-1", department_name:"Administration",     position:"Accounting Manager",                     is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:2  },
  { employee_id:"emp-2",  employee_name:"Doris Appiah Ewusi",          emp_code:"AMC/ACC/ADM/053", department_id:"dept-1", department_name:"Administration",     position:"Quality Assurance & L&D Head",           is_probation:true,  annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-3",  employee_name:"Moses Clocuh",                emp_code:"AMC/ACC/ADM/001", department_id:"dept-1", department_name:"Administration",     position:"Health Service Administrator",           is_probation:false, annual_entitlement:30, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:23, sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-4",  employee_name:"Priscilla Sackey",            emp_code:"AMC/ACC/ADM/005", department_id:"dept-1", department_name:"Administration",     position:"Administrative Assistant - Front Desk",  is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-5",  employee_name:"Ellen Ekeworm",               emp_code:"AMC/ACC/ADM/006", department_id:"dept-1", department_name:"Administration",     position:"Administrative Assistant - Front Desk",  is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-6",  employee_name:"Michael Ankomah",             emp_code:"AMC/ACC/ADM/017", department_id:"dept-1", department_name:"Administration",     position:"Billing & Claims Coordinator",           is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-7",  employee_name:"Nuella Anyeley Odonkor",      emp_code:"AMC/ACC/ADM/019", department_id:"dept-1", department_name:"Administration",     position:"Billing & Claims Officer",               is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-8",  employee_name:"Thelma Akushika Nutakor",     emp_code:"AMC/ACC/ADM/023", department_id:"dept-1", department_name:"Administration",     position:"Medical Co-Ordinator",                   is_probation:false, annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-9",  employee_name:"Honore Tassi Folly Kouassi",  emp_code:"AMC/ACC/ADM/026", department_id:"dept-1", department_name:"Administration",     position:"Maintenance Officer",                    is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:9,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-10", employee_name:"Josephine Afia Soley",        emp_code:"AMC/ACC/ADM/029", department_id:"dept-1", department_name:"Administration",     position:"Accounts Officer",                       is_probation:false, annual_entitlement:25, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-11", employee_name:"Bridget Abra Mortey",         emp_code:"AMC/ACC/ADM/031", department_id:"dept-1", department_name:"Administration",     position:"Client Service Associate",               is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-12", employee_name:"Elizabeth Sena Nyadroh",      emp_code:"AMC/ACC/ADM/032", department_id:"dept-1", department_name:"Administration",     position:"Accounts Assistant",                     is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-13", employee_name:"Rebecca Ohui Maccarthy",      emp_code:"AMC/ACC/ADM/035", department_id:"dept-1", department_name:"Administration",     position:"Client Service Executive",               is_probation:false, annual_entitlement:17, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:9,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-14", employee_name:"Christopher Odei",            emp_code:"AMC/ACC/ADM/036", department_id:"dept-1", department_name:"Administration",     position:"Senior HR Officer",                      is_probation:false, annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:1  },
  { employee_id:"emp-15", employee_name:"Valerie Amexo",               emp_code:"AMC/ACC/ADM/038", department_id:"dept-1", department_name:"Administration",     position:"Client Service Executive",               is_probation:false, annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-16", employee_name:"Rita Pokua Boakye",           emp_code:"AMC/ACC/ADM/039", department_id:"dept-1", department_name:"Administration",     position:"Client Service Executive",               is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-17", employee_name:"Gloria Amenuku",              emp_code:"AMC/ACC/ADM/041", department_id:"dept-1", department_name:"Administration",     position:"Senior Procurement Officer",             is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:4,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-18", employee_name:"Roseline Gadagoe",            emp_code:"AMC/ACC/ADM/042", department_id:"dept-1", department_name:"Administration",     position:"Client Service Executive",               is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-19", employee_name:"Gertrude Exornam Agbegoe",    emp_code:"AMC/ACC/ADM/043", department_id:"dept-1", department_name:"Administration",     position:"Billing & Claims Officer",               is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:3  },
  { employee_id:"emp-20", employee_name:"Joseph Fosu Essel",           emp_code:"AMC/ACC/ADM/045", department_id:"dept-1", department_name:"Administration",     position:"Senior Systems & IT Officer",            is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-21", employee_name:"Stanley Quartey",             emp_code:"AMC/ACC/ADM/047", department_id:"dept-1", department_name:"Administration",     position:"Senior Business Development Officer",    is_probation:false, annual_entitlement:16, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:3,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-22", employee_name:"Sinare Raji",                 emp_code:"AMC/ACC/ADM/048", department_id:"dept-1", department_name:"Administration",     position:"Accounts Assistant",                     is_probation:false, annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:25, sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-23", employee_name:"Sarah Amonorkie Amanatey",    emp_code:"AMC/ACC/ADM/050", department_id:"dept-1", department_name:"Administration",     position:"Client Service Executive",               is_probation:true,  annual_entitlement:20, annual_taken:0, accumulated_carry_forward:7,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:1  },
  { employee_id:"emp-24", employee_name:"Dennis Horsey",               emp_code:"AMC/ACC/ADM/051", department_id:"dept-1", department_name:"Administration",     position:"Accounts Assistant",                     is_probation:true,  annual_entitlement:20, annual_taken:0, accumulated_carry_forward:15, accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-25", employee_name:"Mary Osaah Owusu",            emp_code:"AMC/ACC/ADM/052", department_id:"dept-1", department_name:"Administration",     position:"Client Service Executive",               is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-26", employee_name:"Noble Elikplim Opare",        emp_code:"AMC/ACC/ADM/054", department_id:"dept-1", department_name:"Administration",     position:"Senior Business Dev & Sales Officer",    is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-27", employee_name:"Shefali Bhadauria",           emp_code:"AMC/ACC/ADM/055", department_id:"dept-1", department_name:"Administration",     position:"Excellence & Compliance Manager",        is_probation:true,  annual_entitlement:20, annual_taken:0, accumulated_carry_forward:7,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-28", employee_name:"Vivian Renner",               emp_code:"AMC/ACC/ADM/056", department_id:"dept-1", department_name:"Administration",     position:"Biomedical Engineer Senior Field Officer",is_probation:true, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-29", employee_name:"Adriana Brenda Adom",         emp_code:"AMC/ACC/ADM/057", department_id:"dept-1", department_name:"Administration",     position:"Client Service Executive",               is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-30", employee_name:"Alfred Mensah",               emp_code:"AMC/ACC/ADM/058", department_id:"dept-1", department_name:"Administration",     position:"Accounts Assistant",                     is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-31", employee_name:"Richard Mortey",              emp_code:"AMC/ACC/ADM/060", department_id:"dept-1", department_name:"Administration",     position:"Facilities Management Assistant",        is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-32", employee_name:"John Agbenyenyah",            emp_code:"AMC/ACC/ADM/061", department_id:"dept-1", department_name:"Administration",     position:"Facilities Management Assistant",        is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-33", employee_name:"Emmanuel Kwesi Owusu",        emp_code:"AMC/ACC/ADM/062", department_id:"dept-1", department_name:"Administration",     position:"Store Officer",                          is_probation:true,  annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-34", employee_name:"Enock Yeboah",                emp_code:"AMC/ACC/ADM/063", department_id:"dept-1", department_name:"Administration",     position:"Store Assistant",                        is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:6,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },

  // ── Allied Health ────────────────────────────────────────────────────────────
  { employee_id:"emp-35", employee_name:"Benjamin Konney Akuetteh",    emp_code:"AMC/ACC/ALI/010", department_id:"dept-2", department_name:"Allied Health",     position:"Laboratory Manager",                    is_probation:false, annual_entitlement:26, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:30, sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-36", employee_name:"Janet Brew-Yalley",           emp_code:"AMC/ACC/ALI/003", department_id:"dept-2", department_name:"Allied Health",     position:"Senior Laboratory Scientist",           is_probation:false, annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:10, sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-37", employee_name:"David Tei",                   emp_code:"AMC/ACC/ALI/006", department_id:"dept-2", department_name:"Allied Health",     position:"Senior Medical Laboratory Scientist",   is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-38", employee_name:"Collins Amponsah",            emp_code:"AMC/ACC/ALI/009", department_id:"dept-2", department_name:"Allied Health",     position:"Senior Laboratory Scientist",           is_probation:false, annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-39", employee_name:"Stephane Asare-Boateng",      emp_code:"AMC/ACC/ALI/011", department_id:"dept-2", department_name:"Allied Health",     position:"Medical Laboratory Scientist",          is_probation:false, annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-40", employee_name:"Salford Issah",               emp_code:"AMC/ACC/ALI/015", department_id:"dept-2", department_name:"Allied Health",     position:"EMT Paramedic",                         is_probation:false, annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-41", employee_name:"Stanley Ewordafe",            emp_code:"AMC/ACC/ALI/016", department_id:"dept-2", department_name:"Allied Health",     position:"Senior Business Development Officer",   is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-42", employee_name:"Isaac Tetteh",                emp_code:"AMC/ACC/ALI/017", department_id:"dept-2", department_name:"Allied Health",     position:"EMT Paramedic",                         is_probation:false, annual_entitlement:16, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:12, sick_entitlement:12, sick_taken:3  },
  { employee_id:"emp-43", employee_name:"Ebenezer Ketor",              emp_code:"AMC/ACC/ALI/018", department_id:"dept-2", department_name:"Allied Health",     position:"EMT Paramedic",                         is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:1,  sick_entitlement:12, sick_taken:1  },
  { employee_id:"emp-44", employee_name:"Edem Moses Aggor",            emp_code:"AMC/ACC/ALI/020", department_id:"dept-2", department_name:"Allied Health",     position:"Radiographer",                          is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:12, sick_entitlement:12, sick_taken:3  },
  { employee_id:"emp-45", employee_name:"Emmanuel Sika Tetteh",        emp_code:"AMC/ACC/ALI/022", department_id:"dept-2", department_name:"Allied Health",     position:"Senior Medical Laboratory Scientist",   is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:1,  sick_entitlement:12, sick_taken:5  },
  { employee_id:"emp-46", employee_name:"Kwame Delasi Galley",         emp_code:"AMC/ACC/ALI/023", department_id:"dept-2", department_name:"Allied Health",     position:"Senior Medical Laboratory Scientist",   is_probation:false, annual_entitlement:16, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:4,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-47", employee_name:"Raphael Agbesi Akorli",       emp_code:"AMC/ACC/ALI/024", department_id:"dept-2", department_name:"Allied Health",     position:"Medical Laboratory Technologist",       is_probation:false, annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:25, sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-48", employee_name:"Farida Sanni Sulley",         emp_code:"AMC/ACC/ALI/026", department_id:"dept-2", department_name:"Allied Health",     position:"Radiographer",                          is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-49", employee_name:"Benedict Nyankson Boamah",    emp_code:"AMC/ACC/ALI/027", department_id:"dept-2", department_name:"Allied Health",     position:"Medical Laboratory Scientist",          is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-50", employee_name:"Mathew Thomas",               emp_code:"AMC/ACC/ALI/028", department_id:"dept-2", department_name:"Allied Health",     position:"Radiographer",                          is_probation:false, annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-51", employee_name:"Samuel Osei Sackey",          emp_code:"AMC/ACC/ALI/029", department_id:"dept-2", department_name:"Allied Health",     position:"Senior Sonographer",                    is_probation:false, annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-52", employee_name:"Andrews Appiah Asante",       emp_code:"AMC/ACC/ALI/030", department_id:"dept-2", department_name:"Allied Health",     position:"Dietician",                             is_probation:true,  annual_entitlement:20, annual_taken:0, accumulated_carry_forward:7,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-53", employee_name:"Florence Nayo",               emp_code:"AMC/ACC/ALI/031", department_id:"dept-2", department_name:"Allied Health",     position:"Diet Cook",                             is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-54", employee_name:"Evelyn Nankani",              emp_code:"AMC/ACC/ALI/032", department_id:"dept-2", department_name:"Allied Health",     position:"Diet Cook",                             is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-55", employee_name:"Sebastian Sebin",             emp_code:"AMC/ACC/ALI/035", department_id:"dept-2", department_name:"Allied Health",     position:"Radiographer",                          is_probation:false, annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-56", employee_name:"Luther Kpakpa Quartey",       emp_code:"AMC/ACC/ALI/036", department_id:"dept-2", department_name:"Allied Health",     position:"Medical Phlebotomist",                  is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },

  // ── Auxiliary ────────────────────────────────────────────────────────────────
  { employee_id:"emp-57", employee_name:"Francis Bissue",              emp_code:"AMC/ACC/AUX/003", department_id:"dept-3", department_name:"Auxiliary",         position:"Stores Assistant",                      is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:10, sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-58", employee_name:"Grace Appiah",                emp_code:"AMC/ACC/AUX/005", department_id:"dept-3", department_name:"Auxiliary",         position:"Cook",                                  is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:3,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-59", employee_name:"Theresa Oppong",              emp_code:"AMC/ACC/AUX/006", department_id:"dept-3", department_name:"Auxiliary",         position:"Cook",                                  is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-60", employee_name:"Jonathan Caleb Kotey",        emp_code:"AMC/ACC/AUX/008", department_id:"dept-3", department_name:"Auxiliary",         position:"Security Guard",                        is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-61", employee_name:"Joseph Bondzie Aidoo",        emp_code:"AMC/ACC/AUX/009", department_id:"dept-3", department_name:"Auxiliary",         position:"Security Guard",                        is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:7,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-62", employee_name:"Patrick Dampson",             emp_code:"AMC/ACC/AUX/011", department_id:"dept-3", department_name:"Auxiliary",         position:"Security Guard",                        is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-63", employee_name:"Mohammed Ahmed",              emp_code:"AMC/ACC/AUX/012", department_id:"dept-3", department_name:"Auxiliary",         position:"Security Guard",                        is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-64", employee_name:"Timothy Darbah",              emp_code:"AMC/ACC/AUX/013", department_id:"dept-3", department_name:"Auxiliary",         position:"Security Guard Supervisor",             is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-65", employee_name:"Abigail Aku Adotey-Nyanu",    emp_code:"AMC/ACC/AUX/014", department_id:"dept-3", department_name:"Auxiliary",         position:"Cook",                                  is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-66", employee_name:"Joseph Sackey",               emp_code:"AMC/ACC/AUX/015", department_id:"dept-3", department_name:"Auxiliary",         position:"Security Guard",                        is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-67", employee_name:"Ishaque Obiri-Asamoah",       emp_code:"AMC/ACC/AUX/016", department_id:"dept-3", department_name:"Auxiliary",         position:"Office Assistant - Transport & Logistics",is_probation:true, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:9,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-68", employee_name:"Emmanuel Asante",             emp_code:"AMC/ACC/AUX/017", department_id:"dept-3", department_name:"Auxiliary",         position:"Office Assistant - Transport & Logistics",is_probation:true, annual_entitlement:20, annual_taken:0, accumulated_carry_forward:16, accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-69", employee_name:"Michael Atsyor",              emp_code:"AMC/ACC/AUX/018", department_id:"dept-3", department_name:"Auxiliary",         position:"Security Guard",                        is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-70", employee_name:"Albert Koomson",              emp_code:"AMC/ACC/AUX/019", department_id:"dept-3", department_name:"Auxiliary",         position:"Security Guard",                        is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-71", employee_name:"Alexander Koomson",           emp_code:"AMC/ACC/AUX/020", department_id:"dept-3", department_name:"Auxiliary",         position:"Security Guard",                        is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },

  // ── Medicine ─────────────────────────────────────────────────────────────────
  { employee_id:"emp-72", employee_name:"Cynthia Opoku-Akoto",         emp_code:"AMC/GRP/MED/001", department_id:"dept-4", department_name:"Medicine",          position:"Family Physician - CEO",                is_probation:false, annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-73", employee_name:"Obed Okoe Allotey-Babington", emp_code:"AMC/GRP/MED/002", department_id:"dept-4", department_name:"Medicine",          position:"Medical Director",                      is_probation:false, annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:2  },
  { employee_id:"emp-74", employee_name:"Nyanyuie Kodjo Lovi",         emp_code:"AMC/ACC/MED/001", department_id:"dept-4", department_name:"Medicine",          position:"Physician Specialist - Hospitalist",    is_probation:false, annual_entitlement:25, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:14, sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-75", employee_name:"Harriet Aloribasua Kanlisi",  emp_code:"AMC/ACC/MED/003", department_id:"dept-4", department_name:"Medicine",          position:"Medical Officer",                       is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:14, sick_entitlement:12, sick_taken:5  },
  { employee_id:"emp-76", employee_name:"Sharon Martekie Sackey",      emp_code:"AMC/ACC/MED/004", department_id:"dept-4", department_name:"Medicine",          position:"Medical Officer",                       is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:12, sick_entitlement:12, sick_taken:3  },
  { employee_id:"emp-77", employee_name:"Josef Wewoli Avereyireh",     emp_code:"AMC/ACC/MED/010", department_id:"dept-4", department_name:"Medicine",          position:"Senior Medical Officer",                is_probation:false, annual_entitlement:25, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:2,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-78", employee_name:"Ernest Junior Boachie",       emp_code:"AMC/ACC/MED/011", department_id:"dept-4", department_name:"Medicine",          position:"Senior Medical Officer",                is_probation:false, annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:6,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-79", employee_name:"Nathaniel Russel Attoh",      emp_code:"AMC/ACC/MED/013", department_id:"dept-4", department_name:"Medicine",          position:"Medical Officer",                       is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:5,  sick_entitlement:12, sick_taken:1  },
  { employee_id:"emp-80", employee_name:"Jeffrey Parker",              emp_code:"AMC/ACC/MED/016", department_id:"dept-4", department_name:"Medicine",          position:"Medical Officer",                       is_probation:true,  annual_entitlement:21, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-81", employee_name:"Emmanuel Louis Nterful Jnr",  emp_code:"AMC/ACC/MED/019", department_id:"dept-4", department_name:"Medicine",          position:"Senior Medical Officer",                is_probation:true,  annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-82", employee_name:"Nana Akua Okai Ntoni",        emp_code:"AMC/ACC/MED/020", department_id:"dept-4", department_name:"Medicine",          position:"Medical Officer",                       is_probation:true,  annual_entitlement:20, annual_taken:0, accumulated_carry_forward:1,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-83", employee_name:"Tamunoibim Cookey",           emp_code:"AMC/ACC/MED/021", department_id:"dept-4", department_name:"Medicine",          position:"Medical Officer",                       is_probation:true,  annual_entitlement:20, annual_taken:0, accumulated_carry_forward:7,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-84", employee_name:"Nazeefa Yakubu",              emp_code:"AMC/ACC/MED/023", department_id:"dept-4", department_name:"Medicine",          position:"Medical Officer",                       is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-85", employee_name:"Loreen Sophia Ackon",         emp_code:"AMC/ACC/MED/024", department_id:"dept-4", department_name:"Medicine",          position:"Medical Officer",                       is_probation:true,  annual_entitlement:20, annual_taken:0, accumulated_carry_forward:2,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-86", employee_name:"Sarah Faakor Toseafa",        emp_code:"AMC/ACC/MED/025", department_id:"dept-4", department_name:"Medicine",          position:"Medical Officer",                       is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-87", employee_name:"Isaac Opoku Fofie",           emp_code:"AMC/ACC/MED/026", department_id:"dept-4", department_name:"Medicine",          position:"Medical Officer",                       is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-88", employee_name:"Raphaela Agyarko",            emp_code:"AMC/ACC/MED/027", department_id:"dept-4", department_name:"Medicine",          position:"Medical Officer",                       is_probation:true,  annual_entitlement:20, annual_taken:0, accumulated_carry_forward:7,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-89", employee_name:"Akosua Anane-Darko",          emp_code:"AMC/ACC/MED/028", department_id:"dept-4", department_name:"Medicine",          position:"Medical Officer",                       is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },

  // ── Nursing & Midwifery ──────────────────────────────────────────────────────
  { employee_id:"emp-90",  employee_name:"Vida Ayegbe",                emp_code:"AMC/ACC/NUR/001", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Nursing Director",                    is_probation:false, annual_entitlement:16, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-91",  employee_name:"Emmanuel Tampah-Naah",       emp_code:"AMC/ACC/NUR/013", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Deputy Nursing Director",             is_probation:false, annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:10, sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-92",  employee_name:"Comfort Bawah",              emp_code:"AMC/ACC/NUR/020", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Principal Nursing Officer",           is_probation:false, annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:10, sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-93",  employee_name:"Anita Lebene Azaglo-Tay",    emp_code:"AMC/ACC/NUR/024", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Principal Nursing Officer",           is_probation:false, annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-94",  employee_name:"Olivia Atsupui Nuworkpor",   emp_code:"AMC/ACC/NUR/027", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Principal Nursing Officer",           is_probation:false, annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-95",  employee_name:"Theresa Dede Tisei",         emp_code:"AMC/ACC/NUR/031", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Principal Nursing Officer",           is_probation:false, annual_entitlement:21, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:9,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-96",  employee_name:"Rita Agbemenu",              emp_code:"AMC/ACC/NUR/039", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Deputy Nursing Director",             is_probation:false, annual_entitlement:25, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:8,  sick_entitlement:12, sick_taken:3  },
  { employee_id:"emp-97",  employee_name:"Margaret Ayim",              emp_code:"AMC/ACC/NUR/005", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Health Assistant Clinical",           is_probation:false, annual_entitlement:7,  annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-98",  employee_name:"Joyce Zurek",                emp_code:"AMC/ACC/NUR/006", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Nursing Officer",                     is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-99",  employee_name:"Sandra Otchere",             emp_code:"AMC/ACC/NUR/007", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Senior Nursing Officer",              is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:2  },
  { employee_id:"emp-100", employee_name:"Jahel Dodoo",                emp_code:"AMC/ACC/NUR/008", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Principal Nursing Officer",           is_probation:false, annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:10, sick_entitlement:11, sick_taken:0  },
  { employee_id:"emp-101", employee_name:"Christiana Brew-Cofie",      emp_code:"AMC/ACC/NUR/009", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Senior Nursing Officer",              is_probation:false, annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:10, sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-102", employee_name:"Godwin Agbewu",              emp_code:"AMC/ACC/NUR/010", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Principal Certified Anaesthetist",    is_probation:false, annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:2  },
  { employee_id:"emp-103", employee_name:"Mustapha Abubakar",          emp_code:"AMC/ACC/NUR/012", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Senior Nursing Officer",              is_probation:false, annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-104", employee_name:"Linda Aboagyewaa Ohene",     emp_code:"AMC/ACC/NUR/018", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Senior Health Assistant",             is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:2  },
  { employee_id:"emp-105", employee_name:"Ivy Nyamekye Ayitey",        emp_code:"AMC/ACC/NUR/021", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Senior Health Assistant",             is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-106", employee_name:"Ramatu Musah",               emp_code:"AMC/ACC/NUR/022", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Senior Health Assistant",             is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:13, sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-107", employee_name:"Gloria Annan",               emp_code:"AMC/ACC/NUR/025", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Senior Health Assistant",             is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:1,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-108", employee_name:"Godwin Kwame Tornyeava",     emp_code:"AMC/ACC/NUR/029", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Senior Nursing Officer",              is_probation:false, annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:5,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-109", employee_name:"Anna Gyekye-Quansah",        emp_code:"AMC/ACC/NUR/035", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Nursing Officer",                     is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-110", employee_name:"Anita Banaaleh",             emp_code:"AMC/ACC/NUR/037", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Staff Midwife",                       is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:10, sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-111", employee_name:"Mercy Oppong",               emp_code:"AMC/ACC/NUR/038", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Senior Health Assistant",             is_probation:false, annual_entitlement:30, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:30, sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-112", employee_name:"Rhoda Ackon",                emp_code:"AMC/ACC/NUR/040", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Midwifery Officer",                   is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:1  },
  { employee_id:"emp-113", employee_name:"Josephine Tuffour Hinson",   emp_code:"AMC/ACC/NUR/044", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Midwifery Officer",                   is_probation:false, annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-114", employee_name:"Gifty Sefakor Attor",        emp_code:"AMC/ACC/NUR/045", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Nursing Officer",                     is_probation:false, annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:8,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-115", employee_name:"Akua Frempong Asamoah",      emp_code:"AMC/ACC/NUR/046", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Nursing Officer",                     is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:10, sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-116", employee_name:"Hilda Ofosuah Agyapong",     emp_code:"AMC/ACC/NUR/050", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Nursing Assistant",                   is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-117", employee_name:"Josephine Awukubea Yeboah",  emp_code:"AMC/ACC/NUR/042", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Senior Certified Anaesthetist",       is_probation:false, annual_entitlement:21, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:9,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-118", employee_name:"Leticia Kaki Adade",         emp_code:"AMC/ACC/NUR/052", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Health Assistant Clinical",           is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:3  },
  { employee_id:"emp-119", employee_name:"Calvin Noble Anane",         emp_code:"AMC/ACC/NUR/053", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Senior Nursing Officer",              is_probation:false, annual_entitlement:20, annual_taken:0, accumulated_carry_forward:24, accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-120", employee_name:"Dzidzor Ablah Kpodo-Tay",    emp_code:"AMC/ACC/NUR/054", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Nursing Officer",                     is_probation:false, annual_entitlement:25, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:14, sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-121", employee_name:"Deborah Rehoboth Quartey",   emp_code:"AMC/ACC/NUR/055", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Nursing Officer",                     is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:9,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-122", employee_name:"Joseph Mabitaab Ponjin",     emp_code:"AMC/ACC/NUR/057", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Senior Nursing Officer",              is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:5,  sick_entitlement:12, sick_taken:12 },
  { employee_id:"emp-123", employee_name:"Lydia Pokuah Asamoah",       emp_code:"AMC/ACC/NUR/059", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Staff Midwife",                       is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-124", employee_name:"Richard Oblie Armah",        emp_code:"AMC/ACC/NUR/060", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Nursing Officer",                     is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:1,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-125", employee_name:"Emmanuel Powers Gyamfi",     emp_code:"AMC/ACC/NUR/061", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Health Assistant Clinical",           is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-126", employee_name:"Bismark Opoku Yeboah",       emp_code:"AMC/ACC/NUR/062", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Health Assistant Clinical",           is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-127", employee_name:"Lydia Lisa Cudjoe",          emp_code:"AMC/ACC/NUR/064", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"PNO - Critical Care",                 is_probation:false, annual_entitlement:20, annual_taken:0, accumulated_carry_forward:5,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-128", employee_name:"Ama Serwah Oteng",           emp_code:"AMC/ACC/NUR/065", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"SNO - Critical Care",                 is_probation:true,  annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-129", employee_name:"Gloria Louisa Tetteh",       emp_code:"AMC/ACC/NUR/067", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"PNO - Critical Care",                 is_probation:true,  annual_entitlement:20, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-130", employee_name:"Deborah Akorkor Mensah",     emp_code:"AMC/ACC/NUR/068", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Health Assistant Clinical",           is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-131", employee_name:"Cassandra Mensah",           emp_code:"AMC/ACC/NUR/069", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Health Assistant Clinical",           is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-132", employee_name:"Jemimah Afi Agbodzah",       emp_code:"AMC/ACC/NUR/070", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Health Assistant Clinical",           is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-133", employee_name:"Perfect Esinam Sedofia",     emp_code:"AMC/ACC/NUR/071", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Health Assistant Preventive",         is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-134", employee_name:"Daniel Assuah",              emp_code:"AMC/ACC/NUR/072", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Senior Staff Nurse",                  is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-135", employee_name:"Emmanuella Boakye-Yiadom",   emp_code:"AMC/ACC/NUR/073", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Staff Nurse",                         is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:7,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-136", employee_name:"Hildagard Acquah",           emp_code:"AMC/ACC/NUR/074", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Nursing Officer",                     is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-137", employee_name:"John Atukumah",              emp_code:"AMC/ACC/NUR/075", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Nursing Officer",                     is_probation:true,  annual_entitlement:20, annual_taken:0, accumulated_carry_forward:7,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-138", employee_name:"Anita Osei",                 emp_code:"AMC/ACC/NUR/076", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Nursing Officer",                     is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-139", employee_name:"Lucky Acquah-Baidoo",        emp_code:"AMC/ACC/NUR/077", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Nursing Officer",                     is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-140", employee_name:"Mercy Dery",                 emp_code:"AMC/ACC/NUR/078", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Nursing Officer",                     is_probation:true,  annual_entitlement:20, annual_taken:0, accumulated_carry_forward:7,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-141", employee_name:"Angela Yevu",                emp_code:"AMC/ACC/NUR/079", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Nursing Officer",                     is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-142", employee_name:"Mavis Opokua-Mireku",        emp_code:"AMC/ACC/NUR/080", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Midwifery Officer",                   is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-143", employee_name:"Daniel D'Almeida",           emp_code:"AMC/ACC/NUR/081", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"PNO - Peri Operative",                is_probation:true,  annual_entitlement:20, annual_taken:0, accumulated_carry_forward:7,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-144", employee_name:"Cecilia Dede Akakpo",        emp_code:"AMC/ACC/NUR/082", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Staff Nurse",                         is_probation:true,  annual_entitlement:20, annual_taken:0, accumulated_carry_forward:7,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-145", employee_name:"Godson Annipah",             emp_code:"AMC/ACC/NUR/083", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Nursing Officer",                     is_probation:true,  annual_entitlement:20, annual_taken:0, accumulated_carry_forward:7,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-146", employee_name:"Rosina Ampomah",             emp_code:"AMC/ACC/NUR/084", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Nursing Officer",                     is_probation:true,  annual_entitlement:20, annual_taken:0, accumulated_carry_forward:7,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-147", employee_name:"Eugene Dodzi Tamakloe",      emp_code:"AMC/ACC/NUR/086", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Nursing Officer",                     is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-148", employee_name:"Morda Habibatu Sulemana",    emp_code:"AMC/ACC/NUR/088", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Health Assistant Clinical",           is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-149", employee_name:"Mercy Ami Addoh",            emp_code:"AMC/ACC/NUR/089", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Staff Nurse",                         is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-150", employee_name:"Antoinette Nyamekye Addae",  emp_code:"AMC/ACC/NUR/090", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Nursing Officer",                     is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-151", employee_name:"Antoinette Akosua Avoryi",   emp_code:"AMC/ACC/NUR/091", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Nursing Officer",                     is_probation:true,  annual_entitlement:20, annual_taken:0, accumulated_carry_forward:7,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-152", employee_name:"Elizabeth Konadu",           emp_code:"AMC/ACC/NUR/092", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Staff Nurse",                         is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:1  },
  { employee_id:"emp-153", employee_name:"Ethel Baidoo-Konduah",       emp_code:"AMC/ACC/NUR/093", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Senior Staff Nurse",                  is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-154", employee_name:"Elizabeth Angeley Ako-Nai",  emp_code:"AMC/ACC/NUR/094", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Senior Staff Midwife",                is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-155", employee_name:"Ethel Kporti",               emp_code:"AMC/ACC/NUR/087", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Health Assistant Clinical",           is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-156", employee_name:"Irene Botchway",             emp_code:"AMC/ACC/NUR/095", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"PNO - Specialist & Surgical Serv",   is_probation:true,  annual_entitlement:20, annual_taken:0, accumulated_carry_forward:7,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-157", employee_name:"Eva Woliso",                 emp_code:"AMC/ACC/NUR/096", department_id:"dept-5", department_name:"Nursing & Midwifery", position:"Midwifery Officer",                   is_probation:true,  annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },

  // ── Pharmacy ─────────────────────────────────────────────────────────────────
  { employee_id:"emp-158", employee_name:"Dorothy Asare",              emp_code:"AMC/ACC/PHA/001", department_id:"dept-6", department_name:"Pharmacy",          position:"Senior Pharmacy Technician",            is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-159", employee_name:"Josephine Oduro",            emp_code:"AMC/ACC/PHA/002", department_id:"dept-6", department_name:"Pharmacy",          position:"Senior Pharmacy Technician",            is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-160", employee_name:"Marriete Abu Sarpong",       emp_code:"AMC/ACC/PHA/004", department_id:"dept-6", department_name:"Pharmacy",          position:"Senior Pharmacist",                     is_probation:false, annual_entitlement:20, annual_taken:0, accumulated_carry_forward:5,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:8  },
  { employee_id:"emp-161", employee_name:"Phoebe Eyram Tiah",          emp_code:"AMC/ACC/PHA/006", department_id:"dept-6", department_name:"Pharmacy",          position:"Senior Pharmacy Technician",            is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:12, sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-162", employee_name:"Andrews Boampong Boakye",    emp_code:"AMC/ACC/PHA/007", department_id:"dept-6", department_name:"Pharmacy",          position:"Senior Pharmacy Technician",            is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-163", employee_name:"Simeon Boakye Yiadom",       emp_code:"AMC/ACC/PHA/008", department_id:"dept-6", department_name:"Pharmacy",          position:"Senior Pharmacy Technician",            is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:11, sick_entitlement:12, sick_taken:0  },
  { employee_id:"emp-164", employee_name:"Mabel Ampofoa Yeboah",       emp_code:"AMC/ACC/PHA/009", department_id:"dept-6", department_name:"Pharmacy",          position:"Pharmacist",                            is_probation:false, annual_entitlement:15, annual_taken:0, accumulated_carry_forward:0,  accumulated_holidays:0,  sick_entitlement:12, sick_taken:0  },
];

// ─── Leave Records ─────────────────────────────────────────────────────────────
// Extracted from the "Sick Leave Requested" column (pages 16-20 of the PDF)
// and maternity leave segments documented therein.
// All sick leave dates from 2025 are approved; 2026 dates are approved where
// the dates have already passed or pending for near-future dates.

export const mockLeaveRecords: LeaveRecord[] = [
  // ── Marriete Abu Sarpong (Pharmacy) – 8 sick days total ─────────────────────
  {
    id: "lv-001", employee_id: "emp-160", employee_name: "Marriete Abu Sarpong",
    emp_code: "AMC/ACC/PHA/004", department_id: "dept-6", department_name: "Pharmacy",
    position: "Senior Pharmacist", leave_type: "sick",
    start_date: "2025-07-28", end_date: "2025-07-30", duration_days: 3,
    status: "approved", reason: "Medical – sick leave", applied_date: "2025-07-25",
    approved_by: "Christopher Odei",
  },
  {
    id: "lv-002", employee_id: "emp-160", employee_name: "Marriete Abu Sarpong",
    emp_code: "AMC/ACC/PHA/004", department_id: "dept-6", department_name: "Pharmacy",
    position: "Senior Pharmacist", leave_type: "sick",
    start_date: "2025-09-10", end_date: "2025-09-12", duration_days: 3,
    status: "approved", reason: "Medical – sick leave", applied_date: "2025-09-09",
    approved_by: "Christopher Odei",
  },
  {
    id: "lv-003", employee_id: "emp-160", employee_name: "Marriete Abu Sarpong",
    emp_code: "AMC/ACC/PHA/004", department_id: "dept-6", department_name: "Pharmacy",
    position: "Senior Pharmacist", leave_type: "sick",
    start_date: "2025-11-06", end_date: "2025-11-07", duration_days: 2,
    status: "approved", reason: "Medical – sick leave", applied_date: "2025-11-05",
    approved_by: "Christopher Odei",
  },

  // ── Rhoda Ackon (Nursing) – 1 sick day ──────────────────────────────────────
  {
    id: "lv-004", employee_id: "emp-112", employee_name: "Rhoda Ackon",
    emp_code: "AMC/ACC/NUR/040", department_id: "dept-5", department_name: "Nursing & Midwifery",
    position: "Midwifery Officer", leave_type: "sick",
    start_date: "2025-07-19", end_date: "2025-07-19", duration_days: 1,
    status: "approved", reason: "Medical – sick leave", applied_date: "2025-07-18",
    approved_by: "Christopher Odei",
  },

  // ── Leticia Kaki Adade (Nursing) – 3 sick days ──────────────────────────────
  {
    id: "lv-005", employee_id: "emp-118", employee_name: "Leticia Kaki Adade",
    emp_code: "AMC/ACC/NUR/052", department_id: "dept-5", department_name: "Nursing & Midwifery",
    position: "Health Assistant Clinical", leave_type: "sick",
    start_date: "2025-06-02", end_date: "2025-06-04", duration_days: 3,
    status: "approved", reason: "Medical – sick leave", applied_date: "2025-06-01",
    approved_by: "Christopher Odei",
  },

  // ── Gertrude Exornam Agbegoe (Administration) – 3 sick days ─────────────────
  {
    id: "lv-006", employee_id: "emp-19", employee_name: "Gertrude Exornam Agbegoe",
    emp_code: "AMC/ACC/ADM/043", department_id: "dept-1", department_name: "Administration",
    position: "Billing & Claims Officer", leave_type: "sick",
    start_date: "2025-07-07", end_date: "2025-07-09", duration_days: 3,
    status: "approved", reason: "Medical – sick leave", applied_date: "2025-07-06",
    approved_by: "Christopher Odei",
  },

  // ── Rita Agbemenu (Nursing) – 3 sick days ───────────────────────────────────
  {
    id: "lv-007", employee_id: "emp-96", employee_name: "Rita Agbemenu",
    emp_code: "AMC/ACC/NUR/039", department_id: "dept-5", department_name: "Nursing & Midwifery",
    position: "Deputy Nursing Director", leave_type: "sick",
    start_date: "2025-07-28", end_date: "2025-07-30", duration_days: 3,
    status: "approved", reason: "Medical – sick leave", applied_date: "2025-07-25",
    approved_by: "Christopher Odei",
  },

  // ── Godwin Agbewu (Nursing) – 2 sick days ───────────────────────────────────
  {
    id: "lv-008", employee_id: "emp-102", employee_name: "Godwin Agbewu",
    emp_code: "AMC/ACC/NUR/010", department_id: "dept-5", department_name: "Nursing & Midwifery",
    position: "Principal Certified Anaesthetist", leave_type: "sick",
    start_date: "2025-04-28", end_date: "2025-04-29", duration_days: 2,
    status: "approved", reason: "Medical – sick leave", applied_date: "2025-04-25",
    approved_by: "Christopher Odei",
  },

  // ── Obed Allotey-Babington (Medicine) – 2 sick days ─────────────────────────
  {
    id: "lv-009", employee_id: "emp-73", employee_name: "Obed Okoe Allotey-Babington",
    emp_code: "AMC/GRP/MED/002", department_id: "dept-4", department_name: "Medicine",
    position: "Medical Director", leave_type: "sick",
    start_date: "2026-02-12", end_date: "2026-02-13", duration_days: 2,
    status: "approved", reason: "Medical – sick leave", applied_date: "2026-02-11",
    approved_by: "Christopher Odei",
  },

  // ── Nathaniel Russel Attoh (Medicine) – 1 sick day ──────────────────────────
  {
    id: "lv-010", employee_id: "emp-79", employee_name: "Nathaniel Russel Attoh",
    emp_code: "AMC/ACC/MED/013", department_id: "dept-4", department_name: "Medicine",
    position: "Medical Officer", leave_type: "sick",
    start_date: "2025-10-09", end_date: "2025-10-09", duration_days: 1,
    status: "approved", reason: "Medical – sick leave", applied_date: "2025-10-08",
    approved_by: "Christopher Odei",
  },

  // ── Raphael Agbesi Akorli (Allied Health) – 3 sick days ─────────────────────
  {
    id: "lv-011", employee_id: "emp-47", employee_name: "Raphael Agbesi Akorli",
    emp_code: "AMC/ACC/ALI/024", department_id: "dept-2", department_name: "Allied Health",
    position: "Medical Laboratory Technologist", leave_type: "sick",
    start_date: "2025-08-03", end_date: "2025-08-05", duration_days: 3,
    status: "approved", reason: "Medical – sick leave", applied_date: "2025-08-01",
    approved_by: "Christopher Odei",
  },

  // ── Christopher Odei (Administration) – 1 sick day ──────────────────────────
  {
    id: "lv-012", employee_id: "emp-14", employee_name: "Christopher Odei",
    emp_code: "AMC/ACC/ADM/036", department_id: "dept-1", department_name: "Administration",
    position: "Senior HR Officer", leave_type: "sick",
    start_date: "2026-02-05", end_date: "2026-02-05", duration_days: 1,
    status: "approved", reason: "Medical – sick leave", applied_date: "2026-02-04",
    approved_by: "Vida Ayegbe",
  },

  // ── Sandra Otchere (Nursing) – 2 sick days ──────────────────────────────────
  {
    id: "lv-013", employee_id: "emp-99", employee_name: "Sandra Otchere",
    emp_code: "AMC/ACC/NUR/007", department_id: "dept-5", department_name: "Nursing & Midwifery",
    position: "Senior Nursing Officer", leave_type: "sick",
    start_date: "2025-06-18", end_date: "2025-06-19", duration_days: 2,
    status: "approved", reason: "Medical – sick leave", applied_date: "2025-06-17",
    approved_by: "Christopher Odei",
  },

  // ── Eunice Akorfa Togoh (Administration) – 2 sick days + 1 pending ──────────
  {
    id: "lv-014", employee_id: "emp-1", employee_name: "Eunice Akorfa Togoh",
    emp_code: "AMC/ACC/ADM/044", department_id: "dept-1", department_name: "Administration",
    position: "Accounting Manager", leave_type: "sick",
    start_date: "2025-12-22", end_date: "2025-12-23", duration_days: 2,
    status: "approved", reason: "Medical – sick leave", applied_date: "2025-12-19",
    approved_by: "Christopher Odei",
  },
  {
    id: "lv-015", employee_id: "emp-1", employee_name: "Eunice Akorfa Togoh",
    emp_code: "AMC/ACC/ADM/044", department_id: "dept-1", department_name: "Administration",
    position: "Accounting Manager", leave_type: "sick",
    start_date: "2026-01-31", end_date: "2026-01-31", duration_days: 1,
    status: "approved", reason: "Medical – sick leave", applied_date: "2026-01-30",
    approved_by: "Christopher Odei",
  },

  // ── Isaac Tetteh (Allied Health) – 3 sick days ──────────────────────────────
  {
    id: "lv-016", employee_id: "emp-42", employee_name: "Isaac Tetteh",
    emp_code: "AMC/ACC/ALI/017", department_id: "dept-2", department_name: "Allied Health",
    position: "EMT Paramedic", leave_type: "sick",
    start_date: "2025-07-06", end_date: "2025-07-08", duration_days: 3,
    status: "approved", reason: "Medical – sick leave", applied_date: "2025-07-05",
    approved_by: "Christopher Odei",
  },

  // ── Emmanuel Sika Tetteh (Allied Health) – 5 sick days ──────────────────────
  {
    id: "lv-017", employee_id: "emp-45", employee_name: "Emmanuel Sika Tetteh",
    emp_code: "AMC/ACC/ALI/022", department_id: "dept-2", department_name: "Allied Health",
    position: "Senior Medical Laboratory Scientist", leave_type: "sick",
    start_date: "2025-05-26", end_date: "2025-05-28", duration_days: 3,
    status: "approved", reason: "Medical – sick leave", applied_date: "2025-05-23",
    approved_by: "Christopher Odei",
  },
  {
    id: "lv-018", employee_id: "emp-45", employee_name: "Emmanuel Sika Tetteh",
    emp_code: "AMC/ACC/ALI/022", department_id: "dept-2", department_name: "Allied Health",
    position: "Senior Medical Laboratory Scientist", leave_type: "sick",
    start_date: "2025-09-10", end_date: "2025-09-11", duration_days: 2,
    status: "approved", reason: "Medical – sick leave", applied_date: "2025-09-09",
    approved_by: "Christopher Odei",
  },

  // ── Joseph Mabitaab Ponjin (Nursing) – 12 sick days across 4 periods ────────
  {
    id: "lv-019", employee_id: "emp-122", employee_name: "Joseph Mabitaab Ponjin",
    emp_code: "AMC/ACC/NUR/057", department_id: "dept-5", department_name: "Nursing & Midwifery",
    position: "Senior Nursing Officer", leave_type: "sick",
    start_date: "2025-04-11", end_date: "2025-04-11", duration_days: 1,
    status: "approved", reason: "Medical – sick leave", applied_date: "2025-04-10",
    approved_by: "Christopher Odei",
  },
  {
    id: "lv-020", employee_id: "emp-122", employee_name: "Joseph Mabitaab Ponjin",
    emp_code: "AMC/ACC/NUR/057", department_id: "dept-5", department_name: "Nursing & Midwifery",
    position: "Senior Nursing Officer", leave_type: "sick",
    start_date: "2025-07-22", end_date: "2025-07-22", duration_days: 1,
    status: "approved", reason: "Medical – sick leave", applied_date: "2025-07-21",
    approved_by: "Christopher Odei",
  },
  {
    id: "lv-021", employee_id: "emp-122", employee_name: "Joseph Mabitaab Ponjin",
    emp_code: "AMC/ACC/NUR/057", department_id: "dept-5", department_name: "Nursing & Midwifery",
    position: "Senior Nursing Officer", leave_type: "sick",
    start_date: "2025-09-12", end_date: "2025-09-16", duration_days: 5,
    status: "approved", reason: "Medical – sick leave", applied_date: "2025-09-11",
    approved_by: "Christopher Odei",
  },
  {
    id: "lv-022", employee_id: "emp-122", employee_name: "Joseph Mabitaab Ponjin",
    emp_code: "AMC/ACC/NUR/057", department_id: "dept-5", department_name: "Nursing & Midwifery",
    position: "Senior Nursing Officer", leave_type: "sick",
    start_date: "2025-11-07", end_date: "2025-11-13", duration_days: 5,
    status: "approved", reason: "Medical – sick leave", applied_date: "2025-11-06",
    approved_by: "Christopher Odei",
  },

  // ── Sharon Martekie Sackey (Medicine) – sick leave + maternity ───────────────
  {
    id: "lv-023", employee_id: "emp-76", employee_name: "Sharon Martekie Sackey",
    emp_code: "AMC/ACC/MED/004", department_id: "dept-4", department_name: "Medicine",
    position: "Medical Officer", leave_type: "sick",
    start_date: "2025-06-03", end_date: "2025-06-05", duration_days: 3,
    status: "approved", reason: "Medical – pre-natal sick leave", applied_date: "2025-06-02",
    approved_by: "Christopher Odei",
  },
  {
    id: "lv-024", employee_id: "emp-76", employee_name: "Sharon Martekie Sackey",
    emp_code: "AMC/ACC/MED/004", department_id: "dept-4", department_name: "Medicine",
    position: "Medical Officer", leave_type: "maternity",
    start_date: "2025-06-06", end_date: "2025-09-21", duration_days: 84,
    status: "approved", reason: "Statutory maternity leave (12 weeks)", applied_date: "2025-06-01",
    approved_by: "Cynthia Opoku-Akoto",
    notes: "Maternity leave: 6 Jun – 21 Sep 2025 (12 weeks)",
  },
  {
    id: "lv-025", employee_id: "emp-76", employee_name: "Sharon Martekie Sackey",
    emp_code: "AMC/ACC/MED/004", department_id: "dept-4", department_name: "Medicine",
    position: "Medical Officer", leave_type: "maternity",
    start_date: "2025-09-22", end_date: "2025-10-19", duration_days: 28,
    status: "approved", reason: "Extended post-natal leave", applied_date: "2025-06-01",
    approved_by: "Cynthia Opoku-Akoto",
    notes: "Post-natal leave: 22 Sep – 19 Oct 2025 (4 weeks)",
  },
  {
    id: "lv-026", employee_id: "emp-76", employee_name: "Sharon Martekie Sackey",
    emp_code: "AMC/ACC/MED/004", department_id: "dept-4", department_name: "Medicine",
    position: "Medical Officer", leave_type: "maternity",
    start_date: "2025-11-19", end_date: "2026-01-11", duration_days: 56,
    status: "approved", reason: "Further maternity extension", applied_date: "2025-11-10",
    approved_by: "Cynthia Opoku-Akoto",
    notes: "Further extension: 19 Nov 2025 – 11 Jan 2026 (8 weeks)",
  },

  // ── Harriet Kanlisi (Medicine) – sick days (from page 13 — 5 sick taken) ─────
  {
    id: "lv-027", employee_id: "emp-75", employee_name: "Harriet Aloribasua Kanlisi",
    emp_code: "AMC/ACC/MED/003", department_id: "dept-4", department_name: "Medicine",
    position: "Medical Officer", leave_type: "sick",
    start_date: "2025-06-15", end_date: "2025-06-15", duration_days: 1,
    status: "approved", reason: "Medical – sick leave", applied_date: "2025-06-14",
    approved_by: "Christopher Odei",
  },
  {
    id: "lv-028", employee_id: "emp-75", employee_name: "Harriet Aloribasua Kanlisi",
    emp_code: "AMC/ACC/MED/003", department_id: "dept-4", department_name: "Medicine",
    position: "Medical Officer", leave_type: "sick",
    start_date: "2025-08-11", end_date: "2025-08-14", duration_days: 4,
    status: "approved", reason: "Medical – sick leave", applied_date: "2025-08-09",
    approved_by: "Christopher Odei",
  },

  // ── Ebenezer Ketor (Allied Health) – 1 sick day ──────────────────────────────
  {
    id: "lv-029", employee_id: "emp-43", employee_name: "Ebenezer Ketor",
    emp_code: "AMC/ACC/ALI/018", department_id: "dept-2", department_name: "Allied Health",
    position: "EMT Paramedic", leave_type: "sick",
    start_date: "2025-09-09", end_date: "2025-09-09", duration_days: 1,
    status: "approved", reason: "Medical – sick leave", applied_date: "2025-09-08",
    approved_by: "Christopher Odei",
  },

  // ── Anita Lebene Azaglo-Tay (Nursing) – 3 sick days ─────────────────────────
  {
    id: "lv-030", employee_id: "emp-93", employee_name: "Anita Lebene Azaglo-Tay",
    emp_code: "AMC/ACC/NUR/024", department_id: "dept-5", department_name: "Nursing & Midwifery",
    position: "Principal Nursing Officer", leave_type: "sick",
    start_date: "2025-05-09", end_date: "2025-05-09", duration_days: 1,
    status: "approved", reason: "Medical – sick leave", applied_date: "2025-05-08",
    approved_by: "Christopher Odei",
  },

  // ── Pending 2026 annual leave applications ────────────────────────────────────
  {
    id: "lv-031", employee_id: "emp-90", employee_name: "Vida Ayegbe",
    emp_code: "AMC/ACC/NUR/001", department_id: "dept-5", department_name: "Nursing & Midwifery",
    position: "Nursing Director", leave_type: "annual",
    start_date: "2026-07-07", end_date: "2026-07-18", duration_days: 10,
    status: "pending", reason: "Annual leave", applied_date: "2026-05-20",
  },
  {
    id: "lv-032", employee_id: "emp-72", employee_name: "Cynthia Opoku-Akoto",
    emp_code: "AMC/GRP/MED/001", department_id: "dept-4", department_name: "Medicine",
    position: "Family Physician – CEO", leave_type: "annual",
    start_date: "2026-08-03", end_date: "2026-08-14", duration_days: 10,
    status: "pending", reason: "Annual leave", applied_date: "2026-05-15",
  },
  {
    id: "lv-033", employee_id: "emp-3", employee_name: "Moses Clocuh",
    emp_code: "AMC/ACC/ADM/001", department_id: "dept-1", department_name: "Administration",
    position: "Health Service Administrator", leave_type: "annual",
    start_date: "2026-07-20", end_date: "2026-08-02", duration_days: 10,
    status: "pending", reason: "Annual leave", applied_date: "2026-05-28",
  },
  {
    id: "lv-034", employee_id: "emp-74", employee_name: "Nyanyuie Kodjo Lovi",
    emp_code: "AMC/ACC/MED/001", department_id: "dept-4", department_name: "Medicine",
    position: "Physician Specialist - Hospitalist", leave_type: "study",
    start_date: "2026-09-01", end_date: "2026-09-05", duration_days: 5,
    status: "pending", reason: "Medical conference", applied_date: "2026-06-01",
  },
  {
    id: "lv-035", employee_id: "emp-35", employee_name: "Benjamin Konney Akuetteh",
    emp_code: "AMC/ACC/ALI/010", department_id: "dept-2", department_name: "Allied Health",
    position: "Laboratory Manager", leave_type: "annual",
    start_date: "2026-08-17", end_date: "2026-09-04", duration_days: 15,
    status: "pending", reason: "Annual leave", applied_date: "2026-05-30",
  },
  // ── Linda Ohene – 2 sick days (Feb 2026) ─────────────────────────────────────
  {
    id: "lv-036", employee_id: "emp-104", employee_name: "Linda Aboagyewaa Ohene",
    emp_code: "AMC/ACC/NUR/018", department_id: "dept-5", department_name: "Nursing & Midwifery",
    position: "Senior Health Assistant", leave_type: "sick",
    start_date: "2026-02-16", end_date: "2026-02-17", duration_days: 2,
    status: "approved", reason: "Medical – sick leave", applied_date: "2026-02-15",
    approved_by: "Christopher Odei",
  },
  // ── Doris Appiah Ewusi – study leave (Quality Assurance) ─────────────────────
  {
    id: "lv-037", employee_id: "emp-2", employee_name: "Doris Appiah Ewusi",
    emp_code: "AMC/ACC/ADM/053", department_id: "dept-1", department_name: "Administration",
    position: "Quality Assurance & L&D Head", leave_type: "study",
    start_date: "2026-06-09", end_date: "2026-06-13", duration_days: 5,
    status: "pending", reason: "Quality management training programme", applied_date: "2026-05-10",
  },
];
