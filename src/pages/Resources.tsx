import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Scale, ShieldCheck, FileText, ExternalLink, BookOpen,
  Award, AlertTriangle, CheckCircle2, Clock, Calendar, RefreshCw,
  Bell, Building2, Edit2, Save, X, ChevronDown, ChevronUp, Info,
} from "lucide-react";
import { Button }    from "@/components/ui/button";
import { Card }      from "@/components/ui/card";
import { Badge }     from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input }     from "@/components/ui/input";
import { supabase }  from "@/integrations/supabase/client";
import { useAuth }   from "@/hooks/useAuth";

// ─────────────────────────────────────────────────────────────────────────────
// REGULATIONS  (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────
interface Regulation {
  name: string; shortName: string; description: string;
  keyPoints: string[]; link: string;
  category: "privacy" | "labor" | "health" | "data";
}
const regulations: Regulation[] = [
  {
    name: "Health Insurance Portability and Accountability Act", shortName: "HIPAA",
    description: "U.S. federal law protecting sensitive patient health information from disclosure without consent.",
    keyPoints: ["Safeguard Protected Health Information (PHI)", "Implement administrative, physical & technical safeguards", "Ensure minimum necessary access to data", "Report breaches within 60 days"],
    link: "https://www.hhs.gov/hipaa/index.html", category: "privacy",
  },
  {
    name: "Ghana Data Protection Act, 2012 (Act 843)", shortName: "DPA",
    description: "Ghana's primary data protection legislation governing the processing of personal data.",
    keyPoints: ["Register as a data controller with the Data Protection Commission", "Obtain consent before processing personal data", "Ensure data accuracy and secure storage", "Respect data subjects' right to access and correction"],
    link: "https://www.dataprotection.org.gh/", category: "data",
  },
  {
    name: "Ghana Labour Act, 2003 (Act 651)", shortName: "Labour Act",
    description: "Regulates employment relationships, working conditions, hours, and employee rights in Ghana.",
    keyPoints: ["Maximum 8 working hours per day / 40 hours per week", "Overtime must be compensated at 1.5× or 2× rate", "Mandatory rest periods and annual leave entitlements", "Proper record-keeping of working hours and wages"],
    link: "https://www.melr.gov.gh/", category: "labor",
  },
  {
    name: "Health Facilities Regulatory Agency Act (Act 829)", shortName: "HeFRA",
    description: "Governs the licensing and regulation of health facilities in Ghana to ensure quality standards.",
    keyPoints: ["Obtain and renew facility operating license", "Meet minimum staffing and equipment standards", "Maintain hygiene, safety, and infection control protocols", "Submit to periodic inspections and audits"],
    link: "https://hefra.gov.gh/", category: "health",
  },
  {
    name: "Allied Health Professions Act, 2000 (Act 595)", shortName: "AHP Act",
    description: "Regulates allied health professions to ensure practitioners meet qualification and ethical standards.",
    keyPoints: ["All allied health staff must be registered and licensed", "Adhere to professional codes of conduct", "Maintain continuing professional development", "Report malpractice and disciplinary issues"],
    link: "https://ahpc.gov.gh/", category: "health",
  },
  {
    name: "General Data Protection Regulation", shortName: "GDPR",
    description: "EU regulation applicable if handling data of EU nationals; sets strict data processing standards.",
    keyPoints: ["Lawful basis required for all data processing", "Right to erasure ('right to be forgotten')", "72-hour breach notification requirement", "Data Protection Impact Assessments for high-risk processing"],
    link: "https://gdpr.eu/", category: "data",
  },
];
const categoryColors: Record<string, string> = {
  privacy: "bg-primary/10 text-primary", labor: "bg-accent/10 text-accent-foreground",
  health: "bg-destructive/10 text-destructive", data: "bg-secondary text-secondary-foreground",
};
const categoryLabels: Record<string, string> = {
  privacy: "Privacy", labor: "Labour Law", health: "Health Regulation", data: "Data Protection",
};

// ─────────────────────────────────────────────────────────────────────────────
// CERTIFICATIONS TYPES & HELPERS
// ─────────────────────────────────────────────────────────────────────────────
interface Certification {
  id:                  string;
  cert_number:         number;
  name:                string;
  issuing_body:        string;
  validity_period:     string;
  validity_days:       number | null;
  application_process: string;
  owner_role:          string;
  is_one_time:         boolean;
  issue_date:          string | null;
  expiry_date:         string | null;
  notes:               string | null;
  notified_90:         boolean;
  notified_30:         boolean;
}

// Full owner role titles
const OWNER_TITLES: Record<string, string> = {
  CEO: "Chief Executive Officer",
  COO: "Chief Operating Officer",
  DNS: "Director of Nursing Services",
  HMD: "Head of Medical Department",
  PHA: "Chief Pharmacist",
  ENG: "Engineering / Facilities Manager",
  HRD: "Head of Human Resources",
};

// Owner role badge colours
const OWNER_COLORS: Record<string, string> = {
  CEO: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  COO: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  DNS: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  HMD: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  PHA: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  ENG: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  HRD: "bg-pink-500/15 text-pink-400 border-pink-500/30",
};

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const today  = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(dateStr); expiry.setHours(0, 0, 0, 0);
  return Math.round((expiry.getTime() - today.getTime()) / 86400000);
}

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return "Not set";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// Returns status config based on days remaining
function getStatus(cert: Certification): {
  label: string; color: string; bg: string; icon: typeof CheckCircle2; ring: string
} {
  if (cert.is_one_time) return {
    label: "One-time", color: "text-muted-foreground",
    bg: "bg-muted/30", icon: CheckCircle2, ring: "ring-muted/40",
  };
  if (!cert.expiry_date) return {
    label: "Not set", color: "text-muted-foreground",
    bg: "bg-muted/30", icon: Calendar, ring: "ring-muted/40",
  };
  const d = daysUntil(cert.expiry_date) ?? 999;
  if (d < 0)  return { label: "Expired",    color: "text-destructive",   bg: "bg-destructive/10",  icon: X,             ring: "ring-destructive/40" };
  if (d <= 30) return { label: "Due soon",  color: "text-destructive",   bg: "bg-destructive/10",  icon: AlertTriangle, ring: "ring-destructive/40" };
  if (d <= 90) return { label: "Expiring",  color: "text-amber-500",     bg: "bg-amber-500/10",    icon: Clock,         ring: "ring-amber-500/40"   };
  return              { label: "Valid",      color: "text-emerald-500",   bg: "bg-emerald-500/10",  icon: CheckCircle2,  ring: "ring-emerald-500/40" };
}

// ─────────────────────────────────────────────────────────────────────────────
// CERT CARD
// ─────────────────────────────────────────────────────────────────────────────
function CertCard({
  cert, isHR, onSave,
}: {
  cert: Certification;
  isHR: boolean;
  onSave: (id: string, issueDate: string, expiryDate: string, notes: string) => Promise<void>;
}) {
  const [expanded,  setExpanded]  = useState(false);
  const [editing,   setEditing]   = useState(false);
  const [issueDate, setIssueDate] = useState(cert.issue_date ?? "");
  const [expDate,   setExpDate]   = useState(cert.expiry_date ?? "");
  const [notes,     setNotes]     = useState(cert.notes ?? "");
  const [saving,    setSaving]    = useState(false);

  const status  = getStatus(cert);
  const days    = daysUntil(cert.expiry_date);
  const StatusIcon = status.icon;

  // Auto-compute expiry when issue date changes and validity_days is known
  const handleIssueChange = (val: string) => {
    setIssueDate(val);
    if (val && cert.validity_days) {
      const d = new Date(val);
      d.setDate(d.getDate() + cert.validity_days);
      setExpDate(d.toISOString().split("T")[0]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(cert.id, issueDate, expDate, notes);
    setSaving(false);
    setEditing(false);
  };

  return (
    <Card className={`overflow-hidden transition-all ring-1 ${status.ring}`}>
      {/* Header row */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Number badge */}
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 mt-0.5">
            {cert.cert_number}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h3 className="font-semibold text-sm leading-tight">{cert.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{cert.issuing_body}</p>
              </div>
              {/* Status badge */}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${status.bg} ${status.color}`}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </span>
            </div>

            {/* Owner + validity row */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${OWNER_COLORS[cert.owner_role] ?? "bg-muted text-muted-foreground border-border"}`}>
                {cert.owner_role} — {OWNER_TITLES[cert.owner_role] ?? cert.owner_role}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                {cert.validity_period}
              </span>
            </div>

            {/* Expiry info */}
            {!cert.is_one_time && (
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                <span className="text-muted-foreground">
                  Issued: <span className="text-foreground font-medium">{fmtDate(cert.issue_date)}</span>
                </span>
                <span className="text-muted-foreground">
                  Expires: <span className={`font-medium ${days !== null && days <= 90 ? status.color : "text-foreground"}`}>
                    {fmtDate(cert.expiry_date)}
                    {days !== null && days >= 0 && ` (${days}d)`}
                    {days !== null && days < 0 && " (EXPIRED)"}
                  </span>
                </span>
              </div>
            )}

            {/* Notification status */}
            {!cert.is_one_time && cert.expiry_date && (
              <div className="mt-1.5 flex gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${cert.notified_90 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-muted/30 text-muted-foreground border-border"}`}>
                  {cert.notified_90 ? "✓" : "○"} 90-day alert
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${cert.notified_30 ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-muted/30 text-muted-foreground border-border"}`}>
                  {cert.notified_30 ? "✓" : "○"} 30-day alert
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Expand / Edit buttons */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {expanded ? "Less" : "Details & renewal process"}
          </button>
          {isHR && !cert.is_one_time && (
            <Button
              variant="ghost" size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setEditing(e => !e)}
            >
              <Edit2 className="h-3 w-3" />
              {editing ? "Cancel" : "Set dates"}
            </Button>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/50 bg-muted/20">
          <div className="pt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Renewal Process</p>
            <p className="text-xs leading-relaxed">{cert.application_process}</p>
          </div>
          {cert.notes && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Notes</p>
              <p className="text-xs leading-relaxed">{cert.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* HR edit panel */}
      {editing && isHR && (
        <div className="px-4 pb-4 pt-3 border-t border-amber-500/20 bg-amber-500/5 space-y-3">
          <p className="text-xs font-semibold text-amber-600 flex items-center gap-1">
            <Edit2 className="h-3 w-3" /> Set issue &amp; expiry dates
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground block mb-1">
                Issue / Renewal Date
              </label>
              <Input
                type="date" value={issueDate}
                onChange={e => handleIssueChange(e.target.value)}
                className="h-8 text-xs"
              />
              {cert.validity_days && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Expiry auto-calculated from issue date + {cert.validity_period}
                </p>
              )}
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground block mb-1">
                Expiry Date
              </label>
              <Input
                type="date" value={expDate}
                onChange={e => setExpDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground block mb-1">
              Notes (optional)
            </label>
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. submitted for renewal, pending inspection..."
              className="h-8 text-xs"
            />
          </div>
          <Button size="sm" className="h-7 text-xs gap-1" onClick={handleSave} disabled={saving}>
            <Save className="h-3 w-3" />
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CERTIFICATIONS TAB
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACK_CERTS: Certification[] = [
  { id:"1",  cert_number:1,  name:"HeFRA License",                     issuing_body:"Health Facilities Regulatory Agency",  validity_period:"3 years",               validity_days:1095, application_process:"Submit application with docs (facility details, staff credentials, equipment, etc.); inspection by HeFRA", owner_role:"CEO", is_one_time:false, issue_date:null, expiry_date:null, notes:null, notified_90:false, notified_30:false },
  { id:"2",  cert_number:2,  name:"NHIA Credentialing",                issuing_body:"National Health Insurance Authority",   validity_period:"2 years",               validity_days:730,  application_process:"Apply for NHIS accreditation; meet criteria", owner_role:"CEO", is_one_time:false, issue_date:null, expiry_date:null, notes:null, notified_90:false, notified_30:false },
  { id:"3",  cert_number:3,  name:"EPA Clearance",                     issuing_body:"Environmental Protection Agency",       validity_period:"18 months",             validity_days:548,  application_process:"Submit environmental impact assessment; pay fees; inspection", owner_role:"DNS", is_one_time:false, issue_date:null, expiry_date:null, notes:null, notified_90:false, notified_30:false },
  { id:"4",  cert_number:4,  name:"Fire Service Certificate",          issuing_body:"Ghana Fire Service",                   validity_period:"12 months",             validity_days:365,  application_process:"Inspection by Fire Service; pay fees", owner_role:"ENG", is_one_time:false, issue_date:null, expiry_date:null, notes:null, notified_90:false, notified_30:false },
  { id:"5",  cert_number:5,  name:"Business Registration",             issuing_body:"Registrar General's Dept",             validity_period:"One-time registration", validity_days:null, application_process:"Register business; pay fees", owner_role:"COO", is_one_time:true,  issue_date:null, expiry_date:null, notes:null, notified_90:false, notified_30:false },
  { id:"6",  cert_number:6,  name:"Municipal Business Registration",   issuing_body:"Municipal Authority",                  validity_period:"1 year",                validity_days:365,  application_process:"Register business; pay fees", owner_role:"COO", is_one_time:false, issue_date:null, expiry_date:null, notes:null, notified_90:false, notified_30:false },
  { id:"7",  cert_number:7,  name:"Tax Identification Number (TIN)",   issuing_body:"Ghana Revenue Authority",              validity_period:"One-time registration", validity_days:null, application_process:"Register with GRA; get TIN", owner_role:"COO", is_one_time:true,  issue_date:null, expiry_date:null, notes:null, notified_90:false, notified_30:false },
  { id:"8",  cert_number:8,  name:"Nuclear Reg. Authority Certificate",issuing_body:"Nuclear Regulatory Authority",         validity_period:"3 years",               validity_days:1095, application_process:"Apply if using radiation equipment/imaging facilities", owner_role:"COO", is_one_time:false, issue_date:null, expiry_date:null, notes:null, notified_90:false, notified_30:false },
  { id:"9",  cert_number:9,  name:"Pharmacy Council Cert",             issuing_body:"Pharmacy Council",                     validity_period:"1 year",                validity_days:365,  application_process:"Apply with pharmacy details; inspection", owner_role:"PHA", is_one_time:false, issue_date:null, expiry_date:null, notes:null, notified_90:false, notified_30:false },
  { id:"10", cert_number:10, name:"Doctors Certification",             issuing_body:"Medical & Dental Council",             validity_period:"1 year",                validity_days:365,  application_process:"Submit Licensing documents with required CDP credit scores/points for registration", owner_role:"HMD", is_one_time:false, issue_date:null, expiry_date:null, notes:null, notified_90:false, notified_30:false },
  { id:"11", cert_number:11, name:"Nurses & Midwives Certification",   issuing_body:"Nurses & Midwifery Council",           validity_period:"1 year",                validity_days:365,  application_process:"Submit Licensing documents with required CDP credit scores/points for registration", owner_role:"DNS", is_one_time:false, issue_date:null, expiry_date:null, notes:null, notified_90:false, notified_30:false },
  { id:"12", cert_number:12, name:"Allied Health Staff Certification", issuing_body:"Allied Health Professionals Council",  validity_period:"1 year",                validity_days:365,  application_process:"Submit Licensing documents with required CDP credit scores/points for registration", owner_role:"HRD", is_one_time:false, issue_date:null, expiry_date:null, notes:null, notified_90:false, notified_30:false },
  { id:"13", cert_number:13, name:"Work Permits (for expat staff)",    issuing_body:"Ministry of Interior",                 validity_period:"1–2 years",             validity_days:548,  application_process:"Employer applies with staff docs; pay fees", owner_role:"HRD", is_one_time:false, issue_date:null, expiry_date:null, notes:null, notified_90:false, notified_30:false },
]
function CertificationsTab() {
  const { role }                  = useAuth();
  const isHR                      = role === "hr" || role === "admin";
  const [certs, setCerts]         = useState<Certification[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [filter, setFilter]       = useState<"all" | "expiring" | "valid" | "unset">("all");
  const [triggerLoading, setTrig] = useState(false);
  const [triggerMsg, setTrigMsg]  = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
  setError(null);
  try {
    const { data, error: err } = await (supabase as any)
      .from("certifications")
      .select("*")
      .order("cert_number");

    // Table doesn't exist yet — use hardcoded fallback
    if (err || !data || data.length === 0) {
      setCerts(FALLBACK_CERTS);
      setLoading(false);
      return;
    }
    setCerts(data);
  } catch {
    setCerts(FALLBACK_CERTS);
  } finally {
    setLoading(false);
  }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (
    id: string, issueDate: string, expiryDate: string, notes: string
  ) => {
   const { error: err } = await (supabase as any)
  .from("certifications")
  .update({
        issue_date:   issueDate  || null,
        expiry_date:  expiryDate || null,
        notes:        notes      || null,
        // Reset notification flags when dates are updated so alerts fire again
        notified_90:  false,
        notified_30:  false,
      })
      .eq("id", id);
    if (!err) await load();
  };

  const handleTriggerCheck = async () => {
    setTrig(true);
    setTrigMsg(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("check-certifications");
      if (fnErr) throw fnErr;
      setTrigMsg(
        data?.notified?.length > 0
          ? `✓ Sent ${data.notified.length} notification(s)`
          : "✓ Checked — no notifications due right now"
      );
    } catch (e) {
      setTrigMsg("Error running check — see console");
    } finally {
      setTrig(false);
    }
  };

  // Summary counts
  const summary = useMemo(() => {
    const expired  = certs.filter(c => { const d = daysUntil(c.expiry_date); return d !== null && d < 0; });
    const soon     = certs.filter(c => { const d = daysUntil(c.expiry_date); return d !== null && d >= 0 && d <= 30; });
    const expiring = certs.filter(c => { const d = daysUntil(c.expiry_date); return d !== null && d > 30 && d <= 90; });
    const unset    = certs.filter(c => !c.is_one_time && !c.expiry_date);
    const valid    = certs.filter(c => { const d = daysUntil(c.expiry_date); return c.is_one_time || (d !== null && d > 90); });
    return { expired, soon, expiring, unset, valid };
  }, [certs]);

  const filtered = useMemo(() => {
    if (filter === "expiring") return certs.filter(c => {
      const d = daysUntil(c.expiry_date);
      return d !== null && d <= 90;
    });
    if (filter === "valid")    return certs.filter(c => {
      const d = daysUntil(c.expiry_date);
      return c.is_one_time || (d !== null && d > 90);
    });
    if (filter === "unset")    return certs.filter(c => !c.is_one_time && !c.expiry_date);
    return certs;
  }, [certs, filter]);

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="py-10 text-center text-destructive text-sm">
      Failed to load certifications: {error}
    </div>
  );

  return (
    <div className="space-y-4">

      {/* Info banner */}
      <Card className="p-4 border-primary/20 bg-primary/5 flex items-start gap-3">
        <Bell className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-medium">Automatic notifications</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            HR and the responsible officer are emailed automatically at <strong>90 days</strong> and{" "}
            <strong>30 days</strong> before each certification expires.
            {isHR && " Set issue dates below to activate notifications."}
          </p>
        </div>
        {isHR && (
          <div className="ml-auto shrink-0 flex flex-col items-end gap-1">
            <Button
              variant="outline" size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleTriggerCheck}
              disabled={triggerLoading}
            >
              <Bell className="h-3 w-3" />
              {triggerLoading ? "Checking…" : "Run check now"}
            </Button>
            {triggerMsg && <p className="text-[10px] text-muted-foreground">{triggerMsg}</p>}
          </div>
        )}
      </Card>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {summary.expired.length > 0 && (
          <button onClick={() => setFilter("expiring")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors">
            <X className="h-3 w-3" /> {summary.expired.length} Expired
          </button>
        )}
        {summary.soon.length > 0 && (
          <button onClick={() => setFilter("expiring")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors">
            <AlertTriangle className="h-3 w-3" /> {summary.soon.length} Due ≤30 days
          </button>
        )}
        {summary.expiring.length > 0 && (
          <button onClick={() => setFilter("expiring")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">
            <Clock className="h-3 w-3" /> {summary.expiring.length} Expiring ≤90 days
          </button>
        )}
        {summary.unset.length > 0 && (
          <button onClick={() => setFilter("unset")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border hover:bg-muted/80 transition-colors">
            <Calendar className="h-3 w-3" /> {summary.unset.length} No date set
          </button>
        )}
        <button onClick={() => setFilter("all")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${filter === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:bg-muted/80"}`}>
          All {certs.length}
        </button>
      </div>

      {/* Cert cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map(cert => (
          <CertCard key={cert.id} cert={cert} isHR={isHR} onSave={handleSave} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-muted-foreground text-sm">
          No certifications match this filter.
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE  (Resources + Certifications tabs)
// ─────────────────────────────────────────────────────────────────────────────
export default function Resources() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">

      {/* Page header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resources &amp; Compliance</h1>
          <p className="text-sm text-muted-foreground">Regulations, certifications, and standards for AMC</p>
        </div>
      </div>

      <Tabs defaultValue="regulations">
        <TabsList className="mb-4">
          <TabsTrigger value="regulations" className="gap-1.5">
            <Scale className="h-3.5 w-3.5" /> Regulations
          </TabsTrigger>
          <TabsTrigger value="certifications" className="gap-1.5">
            <Award className="h-3.5 w-3.5" /> Certifications
          </TabsTrigger>
        </TabsList>

        {/* ── REGULATIONS TAB (unchanged) ── */}
        <TabsContent value="regulations" className="space-y-4">
          <Card className="p-4 border-primary/20 bg-primary/5 flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Need guidance on a regulation?</p>
              <p className="text-muted-foreground mt-0.5">
                Go to{" "}
                <button onClick={() => navigate("/quick-ask")} className="text-primary underline underline-offset-2 font-medium">
                  Quick AI Ask
                </button>{" "}
                and ask about any regulation — e.g. "What does HIPAA require for attendance records?"
              </p>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            {regulations.map((reg) => (
              <Card key={reg.shortName} className="p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      {reg.category === "privacy" ? <ShieldCheck className="h-4 w-4 text-primary" /> :
                       reg.category === "labor"   ? <Scale className="h-4 w-4 text-primary" /> :
                       reg.category === "health"  ? <ShieldCheck className="h-4 w-4 text-destructive" /> :
                       <FileText className="h-4 w-4 text-secondary-foreground" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm leading-tight">{reg.shortName}</h3>
                      <Badge variant="outline" className={`mt-1 text-[10px] ${categoryColors[reg.category]}`}>
                        {categoryLabels[reg.category]}
                      </Badge>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{reg.description}</p>
                <ul className="space-y-1.5">
                  {reg.keyPoints.map((pt, i) => (
                    <li key={i} className="text-xs flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
                <a href={reg.link} target="_blank" rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center gap-1 text-xs text-primary hover:underline underline-offset-2">
                  Official resource <ExternalLink className="h-3 w-3" />
                </a>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── CERTIFICATIONS TAB ── */}
        <TabsContent value="certifications">
          <CertificationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}