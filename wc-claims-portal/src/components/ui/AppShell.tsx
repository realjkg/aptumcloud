"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  LogOut,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/claims", label: "Claims", icon: FileText },
  { href: "/claims/new", label: "New Chat", icon: MessageSquare },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-64 bg-brand-900 text-white flex flex-col transition-transform duration-200 lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-2 px-5 py-5 border-b border-brand-700">
          <ShieldCheck className="w-7 h-7 text-brand-100" />
          <div>
            <p className="font-bold text-sm leading-tight">WC Claims Portal</p>
            <p className="text-brand-300 text-xs">
              {process.env.NEXT_PUBLIC_ORG_NAME ?? "AdaptCloud"}
            </p>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith(href) && href !== "/claims/new"
                  ? "bg-brand-700 text-white"
                  : "text-brand-200 hover:bg-brand-800 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-brand-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-sm font-bold">
              {session?.user.name?.[0] ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {session?.user.name}
              </p>
              <p className="text-xs text-brand-300 truncate">
                {session?.user.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="flex items-center gap-2 text-brand-300 hover:text-white text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1 rounded-md text-slate-600"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
          <ShieldCheck className="w-6 h-6 text-brand-600" />
          <div className="w-7" />
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
