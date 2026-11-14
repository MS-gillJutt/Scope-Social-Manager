"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Cpu,
  Share2,
  CreditCard,
  ScrollText,
  Settings,
  ShieldCheck,
  Server,
  Database,
  Radio,
  ExternalLink,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

const navItems: NavItem[] = [
  {
    name: "Overview",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Tenants / Workspaces",
    href: "/tenants",
    icon: Building2,
    badge: "1,248",
    badgeColor: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
  },
  {
    name: "Users Directory",
    href: "/users",
    icon: Users,
    badge: "4,890",
    badgeColor: "bg-slate-800 text-slate-300 border border-slate-700",
  },
  {
    name: "Queues & Workers",
    href: "/queues",
    icon: Cpu,
    badge: "Active",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  },
  {
    name: "Social API Health",
    href: "/integrations",
    icon: Share2,
    badge: "7/7 OK",
    badgeColor: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
  },
  {
    name: "Subscriptions & Revenue",
    href: "/subscriptions",
    icon: CreditCard,
  },
  {
    name: "Security & Audit Logs",
    href: "/audit",
    icon: ScrollText,
  },
  {
    name: "System Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#0b1120] border-r border-[#1e293b] flex flex-col fixed inset-y-0 left-0 z-40 select-none">
      {/* Brand & Super Admin Badge */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-[#1e293b]">
        <Link href="/" className="flex items-center space-x-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <span className="text-white font-black text-lg tracking-wider">P</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-white text-base tracking-tight">Postlane</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                Admin
              </span>
            </div>
            <span className="text-[11px] text-slate-400 tracking-tight">Platform Control Center</span>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
            Platform Operations
          </span>
        </div>

        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm shadow-indigo-500/10"
                  : "text-slate-400 hover:text-slate-100 hover:bg-[#162238]/60"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200"
                  }`}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Live Infrastructure Telemetry in Sidebar Footer */}
      <div className="p-3.5 border-t border-[#1e293b] bg-[#090d16]/70">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            Infra Cluster
          </span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
            HEALTHY
          </span>
        </div>

        <div className="space-y-1.5 text-[11px] text-slate-400 font-mono">
          <div className="flex items-center justify-between py-0.5">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Database className="w-3 h-3 text-indigo-400" />
              PostgreSQL
            </span>
            <span className="text-slate-200">14.2ms</span>
          </div>
          <div className="flex items-center justify-between py-0.5">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Server className="w-3 h-3 text-rose-400" />
              Redis (BullMQ)
            </span>
            <span className="text-slate-200">2.1ms</span>
          </div>
          <div className="flex items-center justify-between py-0.5">
            <span className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-3 h-3 text-sky-400" />
              Auth & Encryption
            </span>
            <span className="text-emerald-400">AES-256</span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#1e293b]/60 flex items-center justify-between text-[11px]">
          <span className="text-slate-500">v1.4.0-prod</span>
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            Open App <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </aside>
  );
}
