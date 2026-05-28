"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";

function SignInContent() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const error = params.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-900 to-brand-700">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-brand-600 p-3 rounded-xl mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {process.env.NEXT_PUBLIC_APP_NAME ?? "WC Claims Agent Portal"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {process.env.NEXT_PUBLIC_ORG_NAME ?? "AdaptCloud"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            Authentication failed. Please try again or contact your
            administrator.
          </div>
        )}

        <button
          onClick={() => signIn("azure-ad", { callbackUrl })}
          className="w-full flex items-center justify-center gap-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-150"
        >
          <MicrosoftIcon />
          Sign in with Microsoft
        </button>

        <p className="text-center text-xs text-slate-400 mt-6">
          Access restricted to authorized claims personnel only.
        </p>
      </div>
    </div>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 21 21" className="w-5 h-5" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
