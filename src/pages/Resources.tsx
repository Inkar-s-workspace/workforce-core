import { useState, useEffect } from "react";
import { Pencil, Check, X, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type ResourceKind = "regulation" | "certification";

interface Resource {
  id: string;
  name: string;
  shortName?: string;
  category: string;
  description: string;
  bullets: string[];
  link: string;
  linkLabel?: string;
}

interface DateRecord {
  lastRenewed: string;
  nextRenewal: string;
  notes: string;
}

const STORAGE_KEY = "amc_resource_dates";

const REGULATIONS: Resource[] = [
  {
    id: "hipaa",
    name: "HIPAA",
    category: "Privacy",
    description: "U.S. federal law protecting sensitive patient health information from disclosure without consent.",
    bullets: [
      "Safeguard Protected Health Information (PHI)",
      "Implement administrative, physical & technical safeguards",
      "Ensure minimum necessary access to data",
      "Report breaches within 60 days",
    ],
    link: "https://www.hhs.gov/hipaa/index.html",
  },
  {
    id: "dpa",
    name: "DPA",
    shortName: "Data Protection Act 2012",
    category: "Data Protection",
    description: "Ghana's primary data protection legislation governing the processing of personal data.",
    bullets: [
      "Register as a data controller with the Data Protection Commission",
      "Obtain consent before processing personal data",
      "Ensure data accuracy and secure storage",
      "Respect data subjects' right to access and correction",
    ],
    link: "https://www.dataprotection.org.gh/",
  },
  {
    id: "labour-act",
    name: "Labour Act",
    shortName: "Ghana Labour Act 2003",
    category: "Labour Law",
    description: "Regulates employment relationships, working conditions, hours, and employee rights in Ghana.",
    bullets: [
      "Maximum 8 working hours per day / 40 hours per week",
      "Overtime must be compensated at 1.5× or 2× rate",
      "Mandatory rest periods and annual leave entitlements",
      "Proper record-keeping of working hours and wages",
    ],
    link: "https://laws.ghanaiantimes.com.gh/labour-act/",
  },
  {
    id: "hefra",
    name: "HeFRA",
    shortName: "Health Facilities Regulatory Agency",
    category: "Health Regulation",
    description: "Governs the licensing and regulation of health facilities in Ghana to ensure quality standards.",
    bullets: [
      "Obtain and renew facility operating license",
      "Meet minimum staffing and equipment standards",
      "Maintain hygiene, safety, and infection control protocols",
      "Submit to periodic inspections and audits",
    ],
    link: "https://hefra.gov.gh/",
  },
  {
    id: "ahp-act",
    name: "AHP Act",
    shortName: "Allied Health Professions Act",
    category: "Health Regulation",
    description: "Regulates allied health professions to ensure practitioners meet qualification and ethical standards.",
    bullets: [
      "All allied health staff must be registered with the AHPC",
      "Maintain valid practicing certificates",
      "Continuing professional development requirements",
      "Adherence to professional code of ethics",
    ],
    link: "https://ahpcgh.org/",
  },
  {
    id: "gdpr",
    name: "GDPR",
    category: "Data Protection",
    description: "EU regulation applicable if handling data of EU nationals; sets strict data protection standards.",
    bullets: [
      "Lawful basis for processing personal data",
      "Right to erasure ('right to be forgotten')",
      "Data Protection Impact Assessments (DPIA) for high-risk activities",
      "72-hour breach notification requirement",
    ],
    link: "https://gdpr.eu/",
  },
];

const CERTIFICATIONS: Resource[] = [
  {
    id: "iso-9001",
    name: "ISO 9001",
    shortName: "Quality Management Systems",
    category: "Quality",
    description: "International standard for quality management systems applicable to healthcare organizations.",
    bullets: [
      "Document quality management procedures",
      "Demonstrate continuous improvement",
      "Annual external audit by accredited body",
      "Customer satisfaction monitoring",
    ],
    link: "https://www.iso.org/iso-9001-quality-management.html",
  },
  {
    id: "iso-15189",
    name: "ISO 15189",
    shortName: "Medical Laboratories",
    category: "Laboratory",
    description: "Specifies requirements for quality and competence in medical laboratories.",
    bullets: [
      "Validated test methods and equipment",
      "Personnel competency assessments",
      "Quality control and external proficiency testing",
      "Patient safety and confidentiality",
    ],
    link: "https://www.iso.org/standard/56115.html",
  },
  {
    id: "joint-commission",
    name: "Joint Commission International",
    category: "Hospital Accreditation",
    description: "Global standards for healthcare quality and patient safety, recognized internationally.",
    bullets: [
      "Patient-centered care standards",
      "Comprehensive medication management",
      "Infection prevention and control",
      "Surgical safety and quality measures",
    ],
    link: "https://www.jointcommissioninternational.org/",
  },
  {
    id: "haf",
    name: "HAF",
    shortName: "Healthcare Accreditation Framework",
    category: "Hospital Accreditation",
    description: "Ghana's hospital accreditation framework setting standards for facility quality and outcomes.",
    bullets: [
      "Clinical care pathways and protocols",
      "Patient outcome measurement",
      "Staff training and credentialing",
      "Facility infrastructure standards",
    ],
    link: "https://moh.gov.gh/",
  },
];

// ─── Renewal status helpers ───────────────────────────────────────────────────

function renewalStatus(nextRenewal: string): "overdue" | "soon" | "ok" {
  if (!nextRenewal) return "ok";
  const diff = (new Date(nextRenewal).getTime() - Date.now()) / 86400000;
  if (diff < 0)  return "overdue";
  if (diff < 30) return "soon";
  return "ok";
}

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Resources() {
  const { role } = useAuth();
  const canEdit = role === "hr" || role === "admin";

  const [tab, setTab] = useState<ResourceKind>("regulation");
  const [dates, setDates] = useState<Record<string, DateRecord>>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); }
    catch { return {}; }
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<DateRecord>({ lastRenewed: "", nextRenewal: "", notes: "" });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dates));
  }, [dates]);

  const items = tab === "regulation" ? REGULATIONS : CERTIFICATIONS;

  const startEdit = (id: string) => {
    setDraft(dates[id] ?? { lastRenewed: "", nextRenewal: "", notes: "" });
    setEditing(id);
  };

  const saveEdit = (id: string) => {
    setDates(prev => ({ ...prev, [id]: draft }));
    setEditing(null);
  };

  const cancelEdit = () => setEditing(null);

  return (
    <div className="max-w-[1100px] mx-auto px-6 md:px-10 pt-10 md:pt-14 pb-16">

      <header className="mb-10 pb-6 border-b border-foreground/10">
        <p className="text-[12px] tracking-[0.16em] uppercase text-foreground/45 font-display font-semibold mb-2">
          Resources
        </p>
        <h1 className="font-display font-bold text-[34px] md:text-[40px] tracking-tight leading-tight">
          Compliance & standards
        </h1>
        <p className="text-[13px] text-foreground/55 mt-1.5">
          Regulations, certifications, and frameworks AMC operates under.
          {canEdit && <span className="ml-2 text-foreground/40">Click the pencil icon on any card to set renewal dates.</span>}
        </p>
      </header>

      {/* Tab toggle */}
      <div className="mb-8">
        <div className="inline-flex border border-border rounded p-0.5 bg-card">
          {(["regulation", "certification"] as ResourceKind[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded text-[12px] font-display font-semibold transition-colors capitalize
                ${tab === t ? "bg-foreground text-background" : "text-foreground/55 hover:text-foreground"}`}
            >
              {t === "regulation" ? "Regulations" : "Certifications"}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map(r => (
          <ResourceCard
            key={r.id}
            resource={r}
            dateRecord={dates[r.id]}
            canEdit={canEdit}
            isEditing={editing === r.id}
            draft={draft}
            onDraftChange={setDraft}
            onEdit={() => startEdit(r.id)}
            onSave={() => saveEdit(r.id)}
            onCancel={cancelEdit}
          />
        ))}
      </div>

      <p className="font-display text-[10px] tracking-[0.20em] uppercase text-foreground/30 text-center mt-16 font-semibold">
        Accra Medical Centre · Workforce
      </p>
    </div>
  );
}

// ─── Resource card ────────────────────────────────────────────────────────────

function ResourceCard({
  resource, dateRecord, canEdit, isEditing, draft, onDraftChange, onEdit, onSave, onCancel,
}: {
  resource: Resource;
  dateRecord: DateRecord | undefined;
  canEdit: boolean;
  isEditing: boolean;
  draft: DateRecord;
  onDraftChange: (d: DateRecord) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const status = dateRecord?.nextRenewal ? renewalStatus(dateRecord.nextRenewal) : null;

  const statusBadge = status === "overdue" ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-destructive/10 text-destructive border border-destructive/20">
      <AlertTriangle className="h-2.5 w-2.5" /> Overdue
    </span>
  ) : status === "soon" ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
      <Clock className="h-2.5 w-2.5" /> Due soon
    </span>
  ) : status === "ok" ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
      <CheckCircle2 className="h-2.5 w-2.5" /> Current
    </span>
  ) : null;

  return (
    <article className="bg-card border border-border rounded-md p-5 hover:border-foreground/20 transition-colors">

      {/* Heading row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h3 className="font-display font-bold text-[18px] tracking-tight leading-tight">
            {resource.name}
          </h3>
          {resource.shortName && (
            <p className="text-[12px] text-foreground/55 mt-0.5">{resource.shortName}</p>
          )}
          <span className="inline-flex mt-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-foreground/8 text-foreground/70 border border-foreground/10 tracking-wide">
            {resource.category}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {statusBadge}
          {canEdit && !isEditing && (
            <button
              onClick={onEdit}
              className="p-1.5 rounded-md text-foreground/35 hover:text-foreground hover:bg-foreground/8 transition-colors"
              title="Edit renewal dates"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-[13px] text-foreground/70 leading-relaxed mb-4">
        {resource.description}
      </p>

      {/* Bullets */}
      <ul className="space-y-1.5 mb-5">
        {resource.bullets.map((b, i) => (
          <li key={i} className="text-[12px] text-foreground/65 leading-relaxed flex gap-2">
            <span className="text-foreground/30 shrink-0">·</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      {/* Renewal dates — display or edit */}
      {isEditing ? (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          <p className="text-[11px] font-semibold text-foreground/55 uppercase tracking-wide">Renewal dates</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-foreground/55 mb-1">Last renewed</label>
              <input
                type="date"
                value={draft.lastRenewed}
                onChange={e => onDraftChange({ ...draft, lastRenewed: e.target.value })}
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] text-foreground focus:outline-none focus:border-foreground/40 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] text-foreground/55 mb-1">Next renewal due</label>
              <input
                type="date"
                value={draft.nextRenewal}
                onChange={e => onDraftChange({ ...draft, nextRenewal: e.target.value })}
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] text-foreground focus:outline-none focus:border-foreground/40 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-foreground/55 mb-1">Notes</label>
            <textarea
              value={draft.notes}
              onChange={e => onDraftChange({ ...draft, notes: e.target.value })}
              placeholder="Add any relevant notes…"
              rows={3}
              className="w-full px-2.5 py-2 rounded-md border border-border bg-background text-[12px] text-foreground placeholder-foreground/30 focus:outline-none focus:border-foreground/40 transition-colors resize-none"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onSave}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground text-background text-[12px] font-semibold hover:opacity-90 transition-opacity"
            >
              <Check className="h-3 w-3" /> Save
            </button>
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-[12px] text-foreground/65 hover:text-foreground hover:bg-foreground/5 transition-colors"
            >
              <X className="h-3 w-3" /> Cancel
            </button>
          </div>
        </div>
      ) : (dateRecord?.lastRenewed || dateRecord?.nextRenewal || dateRecord?.notes) ? (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-foreground/40 font-semibold mb-0.5">Last renewed</p>
              <p className="text-[13px] font-medium">{fmtDate(dateRecord.lastRenewed)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-foreground/40 font-semibold mb-0.5">Next renewal due</p>
              <p className={`text-[13px] font-medium ${
                status === "overdue" ? "text-destructive" :
                status === "soon"   ? "text-amber-600"   : ""
              }`}>{fmtDate(dateRecord.nextRenewal)}</p>
            </div>
          </div>
          {dateRecord.notes && (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-foreground/40 font-semibold mb-0.5">Notes</p>
              <p className="text-[12px] text-foreground/70 leading-relaxed whitespace-pre-wrap">{dateRecord.notes}</p>
            </div>
          )}
        </div>
      ) : canEdit ? (
        <div className="mt-4 pt-4 border-t border-border">
          <button
            onClick={onEdit}
            className="text-[12px] text-foreground/40 hover:text-foreground transition-colors"
          >
            + Add renewal dates
          </button>
        </div>
      ) : null}

      {/* Link */}
      <div className="mt-4">
        <a
          href={resource.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-baseline gap-1 text-[12px] font-display font-semibold text-foreground hover:text-destructive transition-colors"
        >
          {resource.linkLabel ?? "Official resource"}
          <span className="text-foreground/40">→</span>
        </a>
      </div>
    </article>
  );
}
