// Role names must match the App Role values defined in the Entra ID
// App Registration → App roles. Azure AD forwards them in the id_token
// roles claim, which auth.ts stores on the JWT and session.

export const ROLES = {
  ADJUSTER:   "Claims.Adjuster",
  SUPERVISOR: "Claims.Supervisor",
  READONLY:   "Claims.ReadOnly",
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

export function hasRole(userRoles: string[], ...required: AppRole[]): boolean {
  return required.some((r) => userRoles.includes(r));
}

// Returns a 403 NextResponse if the user lacks any of the required roles;
// returns null if access is permitted. Use at the top of API route handlers.
export function forbiddenIfMissingRole(
  userRoles: string[],
  ...required: AppRole[]
): Response | null {
  if (hasRole(userRoles, ...required)) return null;
  return Response.json(
    {
      error: "Forbidden",
      detail: `Requires one of: ${required.join(", ")}`,
    },
    { status: 403 }
  );
}
