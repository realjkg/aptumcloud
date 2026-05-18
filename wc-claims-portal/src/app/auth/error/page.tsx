"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function AuthError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center max-w-md px-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Authentication Error
        </h1>
        <p className="text-slate-600 mb-6">
          There was a problem signing you in. Your account may not be authorized
          to access this portal.
        </p>
        <Link
          href="/auth/signin"
          className="inline-block bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700 transition-colors"
        >
          Try Again
        </Link>
      </div>
    </div>
  );
}
