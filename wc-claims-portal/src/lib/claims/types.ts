export type ClaimStatus = "active" | "pending" | "rtw" | "escalated" | "closed";
export type ClaimType = "Medical-Only" | "Lost-Time" | "PPD" | "PTD";

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface Claimant {
  name: string;
  dob: string;
  ssnLast4: string;
  phone: string;
  address: Address;
}

export interface Employer {
  name: string;
  address: Address;
  contact: string;
  phone: string;
}

export interface Reserves {
  medical: number;
  indemnity: number;
  expense: number;
}

export interface Claim {
  id: string;
  claimant: Claimant;
  employer: Employer;
  adjuster: string;
  dateOfLoss: string;
  reportDate: string;
  // 2-letter US state code — primary driver of VCK form selection
  jurisdiction: string;
  type: ClaimType;
  status: ClaimStatus;
  bodyPart: string;
  diagnosis: string;
  icd10Codes: string[];
  mmiDate: string | null;
  ttdWeeklyRate: number;
  reserves: Reserves;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// Lightweight projection used in list views and the AI context header
export interface ClaimSummary {
  id: string;
  claimantName: string;
  dateOfLoss: string;
  employer: string;
  jurisdiction: string;
  type: ClaimType;
  status: ClaimStatus;
  adjuster: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  openClaims: number;
  pendingReview: number;
  closedThisMonth: number;
  highRisk: number;
}

export interface ActivityItem {
  claimId: string;
  claimantName: string;
  event: string;
  status: ClaimStatus;
  timestamp: string;
}
