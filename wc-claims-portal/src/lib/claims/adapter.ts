import type {
  Claim,
  ClaimSummary,
  DashboardMetrics,
  ActivityItem,
} from "./types";

/**
 * Contract that both Demo and Production adapters must satisfy.
 * Swap the implementation by setting CLAIMS_DATA_MODE=demo|production.
 */
export interface ClaimsAdapter {
  listClaims(): Promise<ClaimSummary[]>;
  getClaim(id: string): Promise<Claim | null>;
  getDashboardMetrics(): Promise<DashboardMetrics>;
  getRecentActivity(limit?: number): Promise<ActivityItem[]>;
}
