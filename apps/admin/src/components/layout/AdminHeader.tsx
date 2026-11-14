"use client";

import React, { useState } from "react";
import {
  Bell,
  Search,
  Shield,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Sparkles,
  Command,
  ExternalLink,
  Layers,
  Activity,
} from "lucide-react";

interface AdminHeaderProps {
  currentEnv?: "production" | "staging";
}

export function AdminHeader({ currentEnv = "production" }: AdminHeaderProps) {
  const [env, setEnv] = useState<"production" | "staging">(currentEnv);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifications = [
    {
      id: "1",
      title: "TikTok API Rate Limit Warning",
      desc: "Workspace 'TechFlow Media' reached 88% quota window",
      time: "4m ago",
      type: "warning",
    },
    {
      id: "2",
      title: "Worker Retry Triggered",
      desc: "Instagram reel transcode retried (Job #98421 - R2 timeout)",
      time: "12m ago",
      type: "info",
    },
    {
      id: "3",
      title: "Enterprise Upgrade Request",
      desc: "Nordic Apex requested migration to Enterprise Dedicated instance",
      time: "32m ago",
      type: "success",
    },
  ];

  return (
    <header className="h-16 bg-[#0b1120]/90 backdrop-blur-md border-b border-[#1e293b] fixed top-0 right-0 left-64 z-30 flex items-center justify-between px-6">
      {/* Search Bar & Quick Jump */}
      <div className="flex items-center space-x-4 flex-1 max-w-lg">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search workspaces, user IDs, job IDs, or audit events..."
            className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg pl-9 pr-14 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center space-x-0.5 text-[11px] font-mono text-slate-500 bg-[#162238] px-1.5 py-0.5 rounded border border-[#1e293b]">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center space-x-4">
        {/* Environment Pill */}
        <div className="flex items-center bg-[#090d16] p-1 rounded-lg border border-[#1e293b]">
          <button
            onClick={() => setEnv("production")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              env === "production"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${env === "production" ? "bg-rose-400 animate-pulse" : "bg-slate-500"}`} />
            Production
          </button>
          <button
            onClick={() => setEnv("staging")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              env === "staging"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${env === "staging" ? "bg-amber-400" : "bg-slate-500"}`} />
            Staging
          </button>
        </div>

        {/* System Status Pill */}
        <div className="hidden lg:flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-lg">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </div>
          <span className="text-xs font-medium text-emerald-300">All Systems Operational</span>
        </div>

        {/* Alerts / Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-[#162238] rounded-lg transition-colors relative border border-transparent hover:border-[#1e293b]"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
          </button>

          {showAlerts && (
            <div className="absolute right-0 mt-2 w-80 bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-2xl z-50 p-3 overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-[#1e293b] mb-2">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Real-time System Alerts
                </span>
                <span className="text-[10px] text-indigo-400 font-mono bg-indigo-500/10 px-1.5 py-0.5 rounded">
                  3 Active
                </span>
              </div>
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-lg bg-[#090d16] border border-[#1e293b] hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-semibold text-slate-200">{n.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-3 p-1.5 rounded-lg hover:bg-[#162238] transition-colors border border-transparent hover:border-[#1e293b]"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center font-bold text-xs text-white shadow">
              SA
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-semibold text-slate-200">Alex Turner</span>
                <Shield className="w-3 h-3 text-indigo-400" />
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Platform Owner</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-2xl z-50 p-2">
              <div className="px-3 py-2 border-b border-[#1e293b] mb-1">
                <p className="text-xs font-semibold text-white">Alex Turner</p>
                <p className="text-[11px] text-slate-400 font-mono truncate">owner@scopesocialmanager.com</p>
                <span className="inline-block mt-1 text-[9px] uppercase tracking-wider font-bold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
                  Root Super Administrator
                </span>
              </div>
              <a
                href="/settings"
                className="flex items-center space-x-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-[#162238] rounded-lg transition-colors"
              >
                <span>Security Settings & 2FA</span>
              </a>
              <a
                href="/audit"
                className="flex items-center space-x-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-[#162238] rounded-lg transition-colors"
              >
                <span>My Admin Session Logs</span>
              </a>
              <div className="border-t border-[#1e293b] mt-1 pt-1">
                <button
                  onClick={() => alert("Simulating Super Admin sign out.")}
                  className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors font-medium"
                >
                  Sign Out Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
