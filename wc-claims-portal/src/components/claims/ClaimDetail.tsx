"use client";

import { clsx } from "clsx";

interface Props {
  claimId: string;
}

// In production this would fetch from your claims data API
const MOCK_CLAIM = {
  id: "WC-2024-0891",
  claimant: {
    name: "Maria Garcia",
    dob: "1985-04-17",
    ssn: "***-**-6789",
    phone: "(555) 812-4430",
  },
  employer: "Sunrise Logistics",
  dol: "2024-09-12",
  reportDate: "2024-09-13",
  type: "Lost-Time",
  status: "Active",
  adjuster: "T. Brown",
  bodyPart: "Lumbar Spine",
  diagnosis: "L4-L5 disc herniation (ICD-10: M51.16)",
  mmi: null,
  ttdWeeklyRate: "$742.00",
  reserveMedical: "$28,500",
  reserveIndemnity: "$41,200",
  reserveExpense: "$6,800",
  notes:
    "Claimant underwent MRI on 10/02. Treating physician recommends physical therapy x12 sessions. IME requested by defense counsel.",
};

const Field = ({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) => (
  <div>
    <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">
      {label}
    </dt>
    <dd className="mt-0.5 text-sm text-slate-900">{value ?? "—"}</dd>
  </div>
);

export function ClaimDetail({ claimId }: Props) {
  const claim = { ...MOCK_CLAIM, id: claimId };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {claim.claimant.name}
            </h2>
            <p className="text-sm text-slate-500 font-mono">{claim.id}</p>
          </div>
          <span
            className={clsx(
              "text-xs font-semibold px-3 py-1 rounded-full",
              claim.status === "Active"
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-600"
            )}
          >
            {claim.status}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Field label="Date of Loss" value={claim.dol} />
          <Field label="Report Date" value={claim.reportDate} />
          <Field label="Employer" value={claim.employer} />
          <Field label="Claim Type" value={claim.type} />
          <Field label="Body Part" value={claim.bodyPart} />
          <Field label="Diagnosis" value={claim.diagnosis} />
          <Field label="MMI Date" value={claim.mmi} />
          <Field label="TTD Weekly Rate" value={claim.ttdWeeklyRate} />
          <Field label="Adjuster" value={claim.adjuster} />
          <Field label="DOB" value={claim.claimant.dob} />
        </dl>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Reserves</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Medical", value: claim.reserveMedical },
            { label: "Indemnity", value: claim.reserveIndemnity },
            { label: "Expense", value: claim.reserveExpense },
          ].map((r) => (
            <div key={r.label} className="text-center">
              <p className="text-xs text-slate-500 mb-1">{r.label}</p>
              <p className="text-lg font-bold text-slate-900">{r.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">
          Adjuster Notes
        </h3>
        <p className="text-sm text-slate-700 leading-relaxed">{claim.notes}</p>
      </div>
    </div>
  );
}
