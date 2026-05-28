// Structured audit logging for compliance.
//
// All events are written as JSON to stdout. In Azure Static Web Apps,
// stdout flows to Azure Monitor / Log Analytics automatically.
//
// To add Application Insights custom event tracking, install
// `applicationinsights` and call `client.trackEvent()` here alongside
// the console output — no callers need to change.

export type AuditEventType =
  | "chat.request"
  | "chat.complete"
  | "chat.error"
  | "chat.rate_limited"
  | "claim.view"
  | "claims.list";

export interface AuditEvent {
  type: AuditEventType;
  userId: string;
  userEmail?: string | null;
  userName?: string | null;
  claimId?: string;
  jurisdiction?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export function auditLog(event: AuditEvent): void {
  console.log(
    JSON.stringify({
      audit: true,
      ...event,
      timestamp: event.timestamp ?? new Date().toISOString(),
    })
  );
}

// Convenience builder used in API routes
export function buildAuditEvent(
  type: AuditEventType,
  user: { oid?: string; email?: string | null; name?: string | null; roles: string[] },
  extra?: Partial<Omit<AuditEvent, "type" | "userId" | "timestamp">>
): AuditEvent {
  return {
    type,
    userId: user.oid ?? user.email ?? "unknown",
    userEmail: user.email,
    userName: user.name,
    timestamp: new Date().toISOString(),
    ...extra,
  };
}
