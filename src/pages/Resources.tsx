import { useState } from "react";

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

export default function Resources() {
  const [tab, setTab] = useState<ResourceKind>("regulation");

  const items = tab === "regulation" ? REGULATIONS : CERTIFICATIONS;

  return (
    <div className="max-w-[1100px] mx-auto px-6 md:px-10 pt-10 md:pt-14 pb-16">

      {/* Page header — overline + heading + subtitle pattern */}
      <header className="mb-10 pb-6 border-b border-foreground/10">
        <p className="text-[12px] tracking-[0.16em] uppercase text-foreground/45 font-display font-semibold mb-2">
          Resources
        </p>
        <h1 className="font-display font-bold text-[34px] md:text-[40px] tracking-tight leading-tight">
          Compliance & standards
        </h1>
        <p className="text-[13px] text-foreground/55 mt-1.5">
          Regulations, certifications, and frameworks AMC operates under.
        </p>
      </header>

      {/* Tab toggle */}
      <div className="mb-8">
        <div className="inline-flex border border-border rounded p-0.5 bg-card">
          <button
            onClick={() => setTab("regulation")}
            className={`px-3 py-1.5 rounded text-[12px] font-display font-semibold transition-colors
              ${tab === "regulation"
                ? "bg-foreground text-background"
                : "text-foreground/55 hover:text-foreground"
              }`}
          >
            Regulations
          </button>
          <button
            onClick={() => setTab("certification")}
            className={`px-3 py-1.5 rounded text-[12px] font-display font-semibold transition-colors
              ${tab === "certification"
                ? "bg-foreground text-background"
                : "text-foreground/55 hover:text-foreground"
              }`}
          >
            Certifications
          </button>
        </div>
      </div>

      {/* Resource cards — clean, no icons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map(r => (
          <ResourceCard key={r.id} resource={r} />
        ))}
      </div>

      {/* Footer note */}
      <p className="font-display text-[10px] tracking-[0.20em] uppercase text-foreground/30 text-center mt-16 font-semibold">
        Accra Medical Centre · Workforce
      </p>
    </div>
  );
}

// ─── Resource card ────────────────────────────────────────────────────────────

function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <article className="bg-card border border-border rounded-md p-5 hover:border-foreground/20 transition-colors">

      {/* Heading + category */}
      <div className="mb-3">
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

      {/* Link */}
      <a
        href={resource.link}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-baseline gap-1 text-[12px] font-display font-semibold text-foreground hover:text-destructive transition-colors"
      >
        {resource.linkLabel ?? "Official resource"}
        <span className="text-foreground/40 group-hover:text-destructive">→</span>
      </a>
    </article>
  );
}