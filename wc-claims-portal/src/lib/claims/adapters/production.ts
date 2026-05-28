import type { ClaimsAdapter } from "../adapter";
import type {
  Claim,
  ClaimSummary,
  DashboardMetrics,
  ActivityItem,
} from "../types";

/**
 * Production adapter stub.
 *
 * Replace each method body with calls to your claims management system
 * (ClaimCenter, Majesco, Duck Creek, custom API, etc.).
 *
 * Required environment variables for this adapter:
 *   CLAIMS_API_BASE_URL   — base URL of your CMS REST API
 *   CLAIMS_API_KEY        — API key or service account token
 *
 * All methods must honour the return types defined in types.ts — the rest
 * of the application depends only on that contract, not on this adapter.
 */
export class ProductionClaimsAdapter implements ClaimsAdapter {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    const baseUrl = process.env.CLAIMS_API_BASE_URL;
    const apiKey = process.env.CLAIMS_API_KEY;
    if (!baseUrl || !apiKey) {
      throw new Error(
        "CLAIMS_API_BASE_URL and CLAIMS_API_KEY must be set when CLAIMS_DATA_MODE=production"
      );
    }
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async fetch<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
      next: { revalidate: 30 }, // 30-second cache — adjust to your CMS SLA
    });
    if (!res.ok) throw new Error(`CMS API error ${res.status} on ${path}`);
    return res.json() as Promise<T>;
  }

  async listClaims(): Promise<ClaimSummary[]> {
    // TODO: replace with actual CMS endpoint
    // return this.fetch<ClaimSummary[]>("/claims?summary=true");
    throw new Error(
      "ProductionClaimsAdapter.listClaims() not implemented. " +
      "Wire this to your CMS API and remove this error."
    );
  }

  async getClaim(id: string): Promise<Claim | null> {
    // TODO: replace with actual CMS endpoint
    // return this.fetch<Claim>(`/claims/${id}`);
    throw new Error(
      `ProductionClaimsAdapter.getClaim(${id}) not implemented.`
    );
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    // TODO: replace with actual CMS endpoint or derive from listClaims()
    throw new Error(
      "ProductionClaimsAdapter.getDashboardMetrics() not implemented."
    );
  }

  async getRecentActivity(limit = 7): Promise<ActivityItem[]> {
    // TODO: replace with actual CMS activity/audit endpoint
    // return this.fetch<ActivityItem[]>(`/claims/activity?limit=${limit}`);
    throw new Error(
      "ProductionClaimsAdapter.getRecentActivity() not implemented."
    );
  }
}
