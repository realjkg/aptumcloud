import { clsx } from "clsx";
import type { Claim } from "@/lib/claims";

const Field = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
  <div>
    <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</dt>
    <dd className="mt-0.5 text-sm text-slate-900">
      {value !== null && value !== undefined && value !== "" ? String(value) : "—"}
    </dd>
  </div>
);

const currency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const STATUS_BADGE: Record<string, string> = {
  active:    "bg-blue-100 text-blue-700",
  rtw:       "bg-green-100 text-green-700",
  escalated: "bg-red-100 text-red-700",
  pending:   "bg-amber-100 text-amber-700",
  closed:    "bg-slate-100 text-slate-600",
};

export function ClaimDetail({ claim }: { claim: Claim }) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{claim.claimant.name}</h2>
            <p className="text-sm text-slate-500 font-mono">{claim.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-1 rounded">
              {claim.jurisdiction}
            </span>
            <span
              className={clsx(
                "text-xs font-semibold px-3 py-1 rounded-full capitalize",
                STATUS_BADGE[claim.status]
              )}
            >
              {claim.status}
            </span>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Field label="Date of Loss"   value={claim.dateOfLoss} />
          <Field label="Report Date"    value={claim.reportDate} />
          <Field label="Employer"       value={claim.employer.name} />
          <Field label="Claim Type"     value={claim.type} />
          <Field label="Body Part"      value={claim.bodyPart} />
          <Field label="Diagnosis"      value={claim.diagnosis} />
          <Field label="ICD-10"         value={claim.icd10Codes.join(", ")} />
          <Field label="MMI Date"       value={claim.mmiDate} />
          <Field label="TTD Weekly"     value={claim.ttdWeeklyRate > 0 ? currency(claim.ttdWeeklyRate) : "N/A"} />
          <Field label="Adjuster"       value={claim.adjuster} />
          <Field label="DOB"            value={claim.claimant.dob} />
          <Field label="Phone"          value={claim.claimant.phone} />
        </dl>
      </div>

      {/* Reserves */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Reserves</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Medical",   value: claim.reserves.medical },
            { label: "Indemnity", value: claim.reserves.indemnity },
            { label: "Expense",   value: claim.reserves.expense },
          ].map((r) => (
            <div key={r.label} className="text-center">
              <p className="text-xs text-slate-500 mb-1">{r.label}</p>
              <p className="text-lg font-bold text-slate-900">{currency(r.value)}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">Total Incurred</p>
          <p className="text-xl font-bold text-slate-900">
            {currency(
              claim.reserves.medical + claim.reserves.indemnity + claim.reserves.expense
            )}
          </p>
        </div>
      </div>

      {/* Notes */}
      {claim.notes && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Adjuster Notes</h3>
          <p className="text-sm text-slate-700 leading-relaxed">{claim.notes}</p>
        </div>
      )}
    </div>
  );
}
