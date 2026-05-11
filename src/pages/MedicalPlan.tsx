import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, ShieldPlus, BedDouble } from "lucide-react";

const fmt = (n: number | null) =>
  n === null ? "-" : n.toLocaleString("en-GH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const fmtGHS = (n: number | null) =>
  n === null ? "-" : `${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface Row {
  month: string;
  bill2025: number | null;
  att2025: number | null;
  att2026: number | null;
  bill2026: number | null;
  utilization: number | null;
  coverExemptions: number | null;
  payment: number | null;
}

const ROWS: Row[] = [
  { month: "April",     bill2025: 52056.50, att2025: 86,  att2026: 53,  bill2026: 37589,   utilization: 28172,     coverExemptions: 9417,   payment: null    },
  { month: "May",       bill2025: 91068.34, att2025: 109, att2026: 71,  bill2026: 46895,   utilization: 35641,     coverExemptions: 11254,  payment: null    },
  { month: "June",      bill2025: 77283.11, att2025: 113, att2026: 81,  bill2026: 115437,  utilization: 66331,     coverExemptions: 17875,  payment: 31230   },
  { month: "July",      bill2025: 62652.09, att2025: 119, att2026: 100, bill2026: 118478,  utilization: 64313,     coverExemptions: 15668,  payment: 38497   },
  { month: "August",    bill2025: 45403.82, att2025: 76,  att2026: 61,  bill2026: 79868,   utilization: 51260,     coverExemptions: 16934,  payment: 11675   },
  { month: "September", bill2025: 24088.34, att2025: 57,  att2026: 72,  bill2026: 43454,   utilization: 33838,     coverExemptions: 9616,   payment: null    },
  { month: "October",   bill2025: 33718.52, att2025: 53,  att2026: 64,  bill2026: 54079,   utilization: 38460,     coverExemptions: 15619,  payment: null    },
  { month: "November",  bill2025: 26484.85, att2025: 62,  att2026: 71,  bill2026: 52361,   utilization: 36792,     coverExemptions: 15569,  payment: null    },
  { month: "December",  bill2025: 20484.99, att2025: 46,  att2026: 48,  bill2026: 56242,   utilization: 37045,     coverExemptions: 8207,   payment: 10990   },
  { month: "January",   bill2025: 32272.58, att2025: 50,  att2026: 60,  bill2026: 73306,   utilization: 48891,     coverExemptions: 20415,  payment: 4000    },
  { month: "February",  bill2025: 35364.54, att2025: 38,  att2026: null, bill2026: null,   utilization: null,      coverExemptions: null,   payment: null    },
  { month: "March",     bill2025: 57290.67, att2025: 63,  att2026: null, bill2026: null,   utilization: null,      coverExemptions: null,   payment: null    },
];

const TOTALS = {
  bill2025:       558168.35,
  att2025:        872,
  att2026:        681,
  bill2026:       677709.13,
  utilization:    440741.94,
  coverExemptions:140574.75,
  payment:        96392.44,
};

export default function MedicalCostPage() {
  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Stethoscope className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Staff Medical Plan</h1>
          <p className="text-sm text-muted-foreground">AMC medical billing summary — April 2025 to March 2026</p>
        </div>
      </div>

      {/* Benefit limit cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-green-200 dark:border-green-800/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShieldPlus className="h-4 w-4 text-green-600 dark:text-green-400" />
              Outpatient Cover per Employee
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight">GHS 6,000</p>
            <p className="text-xs text-muted-foreground mt-1">Annual outpatient limit per staff member</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BedDouble className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Inpatient Cover per Employee
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight">GHS 12,000</p>
            <p className="text-xs text-muted-foreground mt-1">Annual inpatient limit per staff member</p>
          </CardContent>
        </Card>
      </div>

      {/* Main table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              {/* Year header row */}
              <tr className="bg-muted/60 border-b">
                <th rowSpan={2} className="px-4 py-3 text-left font-semibold whitespace-nowrap border-r">
                  Month / Period
                </th>
                <th colSpan={2} className="px-4 py-2 text-center font-semibold border-r border-b">
                  2025
                </th>
                <th colSpan={5} className="px-4 py-2 text-center font-semibold">
                  2026
                </th>
              </tr>
              {/* Column sub-header row */}
              <tr className="bg-muted/40 border-b text-xs text-muted-foreground">
                <th className="px-4 py-2 text-right font-medium whitespace-nowrap">Total Bill Amount (GHC)</th>
                <th className="px-4 py-2 text-right font-medium border-r">Attendance</th>
                <th className="px-4 py-2 text-right font-medium">Attendance</th>
                <th className="px-4 py-2 text-right font-medium whitespace-nowrap">Total Bill Amount (GHC)</th>
                <th className="px-4 py-2 text-right font-medium whitespace-nowrap">Medical Plan Utilization (GHC)</th>
                <th className="px-4 py-2 text-right font-medium whitespace-nowrap">Cover Exemptions (GHC)</th>
                <th className="px-4 py-2 text-right font-medium">Payment (GHC)</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr
                  key={row.month}
                  className={`border-b transition-colors hover:bg-muted/30 ${
                    i % 2 === 0 ? "" : "bg-muted/10"
                  }`}
                >
                  <td className="px-4 py-2.5 font-medium border-r">{row.month}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtGHS(row.bill2025)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums border-r">{fmt(row.att2025)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmt(row.att2026)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtGHS(row.bill2026)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtGHS(row.utilization)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtGHS(row.coverExemptions)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtGHS(row.payment)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/60 font-semibold border-t-2">
                <td className="px-4 py-3 border-r">Total</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtGHS(TOTALS.bill2025)}</td>
                <td className="px-4 py-3 text-right tabular-nums border-r">{fmt(TOTALS.att2025)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(TOTALS.att2026)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtGHS(TOTALS.bill2026)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtGHS(TOTALS.utilization)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtGHS(TOTALS.coverExemptions)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtGHS(TOTALS.payment)}</td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Medical Plan Utilization = portion covered by AMC's health plan. Cover Exemptions = items not covered. Payment = amount paid out this period. Rows with — indicate data not yet available for that period.
      </p>
    </div>
  );
}
