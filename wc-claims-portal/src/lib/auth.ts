import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

const clientId = process.env.AZURE_AD_CLIENT_ID;
const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;
const tenantId = process.env.AZURE_AD_TENANT_ID;

if (!clientId || !clientSecret || !tenantId) {
  throw new Error(
    "AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET, and AZURE_AD_TENANT_ID must be set"
  );
}

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId,
      clientSecret,
      tenantId,
      authorization: {
        params: {
          scope: "openid profile email offline_access",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8-hour work-day sessions
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
      }
      if (profile) {
        // Azure AD exposes roles via the token's roles claim
        token.roles = (profile as Record<string, unknown>).roles ?? [];
        token.oid = (profile as Record<string, unknown>).oid;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.user.roles = (token.roles as string[]) ?? [];
      session.user.oid = token.oid as string | undefined;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};
