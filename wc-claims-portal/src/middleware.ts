import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    // Require both a valid session AND confirmed MFA.
    // mfaVerified is set in the jwt callback by inspecting the amr claim
    // returned by Azure AD. A session missing this flag — e.g. one that
    // somehow bypassed the acr_values request — is rejected here.
    authorized: ({ token }) => !!token && token.mfaVerified === true,
  },
  pages: { signIn: "/auth/signin" },
});

export const config = {
  matcher: ["/((?!auth|_next/static|_next/image|favicon.ico|api/auth).*)"],
};
