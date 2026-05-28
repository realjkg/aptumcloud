import type { ClaimsAdapter } from "./adapter";
import { DemoClaimsAdapter } from "./adapters/demo";
import { ProductionClaimsAdapter } from "./adapters/production";

export type { ClaimsAdapter };
export type {
  Claim,
  ClaimSummary,
  ClaimStatus,
  ClaimType,
  DashboardMetrics,
  ActivityItem,
} from "./types";

let _adapter: ClaimsAdapter | null = null;

export function getClaimsAdapter(): ClaimsAdapter {
  if (_adapter) return _adapter;
  const mode = process.env.CLAIMS_DATA_MODE ?? "demo";
  _adapter =
    mode === "production"
      ? new ProductionClaimsAdapter()
      : new DemoClaimsAdapter();
  return _adapter;
}
