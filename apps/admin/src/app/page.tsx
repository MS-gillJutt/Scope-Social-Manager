"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Building2,
  Users,
  Send,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Server,
  Zap,
  Activity,
  ShieldAlert,
  Clock,
  Sparkles,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // KPIs
  const mrr = 84250;
  const arr = mrr * 12;
  const activeWorkspaces = 1248;
  const totalUsers = 4890;
  const postsPublishedToday = 14210;
  const successRate = 99.42;

  // Tier distribution
  const tierDistribution = [
    { name: "Free", count: 420, percentage: 33.6, color: "bg-slate-500", revenue: "$0" },
    { name: "Starter", count: 340, percentage: 27.2, color: "bg-sky-500", revenue: "$10,200" },
    { name: "Pro", count: 295, percentage: 23.6, color: "bg-indigo-500", revenue: "$23,600" },
    { name: "Agency", count: 145, percentage: 11.6, color: "bg-purple-500", revenue: "$28,855" },
    { name: "Enterprise", count: 48, percentage: 3.8, color: "bg-amber-400", revenue: "$21,595" },
  ];

  // Publishing volume bars (24h)
  const hourlyPublishing = [
    { hour: "00:00", volume: 180 },
    { hour: "02:00", volume: 110 },
    { hour: "04:00", volume: 95 },
    { hour: "06:00", volume: 240 },
    { hour: "08:00", volume: 620 },
    { hour: "10:00", volume: 1150 },
    { hour: "12:00", volume: 1480 },
    { hour: "14:00", volume: 1620 },
    { hour: "16:00", volume: 1540 },
    { hour: "18:00", volume: 1290 },
    { hour: "20:00", volume: 890 },
    { hour: "22:00", volume: 460 },
  ];
  const maxVolume = Math.max(...hourlyPublishing.map((h) => h.volume));

  // Recent system alerts
  const systemAlerts = [
    {
      id: "alt-1",
      level: "warning",
      source: "TikTok Graph API",
      message: "Rate limit window reached 88% for client key (Burst pool exhausted)",
      timestamp: "3 minutes ago",
      affected: "Tenant: ByteDance Studio / #ws-392",
    },
    {
      id: "alt-2",
      level: "info",
      source: "Worker: media-transcode",
      message: "Automatic worker scale-out triggered (Active pods: 4 -> 6)",
      timestamp: "18 minutes ago",
      affected: "Queue: media-queue",
    },
    {
      id: "alt-3",
      level: "critical",
      source: "Threads OAuth Provider",
      message: "Meta Graph API token exchange latency spike (Avg 3,450ms > 500ms threshold)",
      timestamp: "42 minutes ago",
      affected: "Provider: Threads Graph v1.0",
    },
    {
      id: "alt-4",
      level: "info",
      source: "Stripe Webhook Gateway",
      message: "Invoice paid ($299.00 / Agency Plan upgraded)",
      timestamp: "1 hour ago",
      affected: "Workspace: Horizon Media UK",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1e293b]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Platform Executive Overview</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Live Production Telemetry
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time business health, operational throughput, and automated queue states.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#0f172a] p-1 rounded-lg border border-[#1e293b]">
            {(["24h", "7d", "30d"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  timeRange === r
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            className={`p-2 rounded-lg bg-[#0f172a] border border-[#1e293b] text-slate-300 hover:text-white hover:border-slate-700 transition-all ${
              isRefreshing ? "animate-spin text-indigo-400" : ""
            }`}
            title="Refresh Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (6 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Monthly Rec. Rev"
          value={formatCurrency(mrr)}
          change="+14.2%"
          trend="up"
          subtitle="vs last month"
          icon={DollarSign}
          iconColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        />
        <StatCard
          title="Annual Run Rate"
          value={formatCurrency(arr)}
          change="+18.5%"
          trend="up"
          subtitle="Projected $1.01M"
          icon={TrendingUp}
          iconColor="text-sky-400 bg-sky-500/10 border-sky-500/20"
        />
        <StatCard
          title="Active Workspaces"
          value={formatNumber(activeWorkspaces)}
          change="+34"
          trend="up"
          subtitle="98.2% retention"
          icon={Building2}
          iconColor="text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
        />
        <StatCard
          title="Total Users"
          value={formatNumber(totalUsers)}
          change="+128"
          trend="up"
          subtitle="Across all tiers"
          icon={Users}
          iconColor="text-purple-400 bg-purple-500/10 border-purple-500/20"
        />
        <StatCard
          title="Published Today"
          value={formatNumber(postsPublishedToday)}
          change="+8.4%"
          trend="up"
          subtitle="14 platforms"
          icon={Send}
          iconColor="text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
        />
        <StatCard
          title="Success Rate"
          value={`${successRate}%`}
          change="+0.18%"
          trend="up"
          subtitle="79 failed retried"
          icon={CheckCircle2}
          iconColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
          badge="SLA: 99.0%"
        />
      </div>

      {/* Middle Row: Charts & Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Publishing Volume Bar Chart */}
        <div className="lg:col-span-7 bg-[#0f172a] border border-[#1e293b] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Publishing Throughput Volume</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Posts scheduled and dispatched per hour across all social APIs</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Peak: 1,620 posts/hr
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-64 flex items-end gap-3 pt-6 pb-2 px-2 border-b border-[#1e293b]/70">
            {hourlyPublishing.map((item, idx) => {
              const heightPercent = Math.round((item.volume / maxVolume) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0b1120] border border-[#1e293b] text-white text-[10px] font-mono py-1 px-2 rounded pointer-events-none whitespace-nowrap shadow-xl z-20">
                    {item.volume.toLocaleString()} posts ({item.hour})
                  </div>
                  <div className="w-full bg-[#162238] rounded-t-sm h-48 flex items-end overflow-hidden">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-gradient-to-t from-indigo-600 via-indigo-500 to-sky-400 rounded-t-sm group-hover:from-indigo-500 group-hover:to-sky-300 transition-all duration-300"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 transform -rotate-45 sm:rotate-0 origin-top-left sm:origin-center">
                    {item.hour}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-4 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
              Automated Dispatches
            </span>
            <span>Total 24h: 14,210 posts processed</span>
          </div>
        </div>

        {/* Subscription Tier Distribution */}
        <div className="lg:col-span-5 bg-[#0f172a] border border-[#1e293b] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Subscription Tier Distribution</h3>
              <span className="text-xs text-slate-400 font-mono">1,248 Workspaces</span>
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Active workspace distribution and monthly revenue attribution per pricing tier.
            </p>

            {/* Segmented Progress Bar */}
            <div className="h-4 w-full rounded-full bg-[#162238] flex overflow-hidden mb-6 p-0.5 border border-[#1e293b]">
              {tierDistribution.map((tier) => (
                <div
                  key={tier.name}
                  style={{ width: `${tier.percentage}%` }}
                  className={`${tier.color} h-full transition-all`}
                  title={`${tier.name}: ${tier.percentage}%`}
                />
              ))}
            </div>

            {/* Tier Legend & Breakdown */}
            <div className="space-y-3">
              {tierDistribution.map((tier) => (
                <div
                  key={tier.name}
                  className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-[#162238]/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-3 h-3 rounded-full ${tier.color}`} />
                    <span className="font-semibold text-slate-200">{tier.name}</span>
                    <span className="text-slate-400 font-mono">({tier.count} workspaces)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-300">{tier.percentage}%</span>
                    <span className="font-mono font-medium text-emerald-400 w-16 text-right">
                      {tier.revenue}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#1e293b] flex items-center justify-between">
            <span className="text-xs text-slate-400">Paid Tier Conversion:</span>
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              66.4% of all tenants
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Real-time System Alerts & Quick Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Real-time System Alerts */}
        <div className="lg:col-span-8 bg-[#0f172a] border border-[#1e293b] rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-bold text-white">Real-Time Operational Alerts</h3>
            </div>
            <Link
              href="/audit"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              View Full Security Audit <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {systemAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3.5 rounded-lg bg-[#090d16] border border-[#1e293b] hover:border-slate-700 transition-colors flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 p-1.5 rounded-md border ${
                      alert.level === "critical"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/25"
                        : alert.level === "warning"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/25"
                        : "bg-sky-500/10 text-sky-400 border-sky-500/25"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">{alert.source}</span>
                      <span
                        className={`text-[9px] uppercase font-mono px-1.5 py-0.2 rounded font-semibold ${
                          alert.level === "critical"
                            ? "bg-rose-500/20 text-rose-300"
                            : alert.level === "warning"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-sky-500/20 text-sky-300"
                        }`}
                      >
                        {alert.level}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{alert.message}</p>
                    <span className="text-[11px] text-slate-400 font-mono mt-1 inline-block">
                      {alert.affected}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                  {alert.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Operations Center */}
        <div className="lg:col-span-4 bg-[#0f172a] border border-[#1e293b] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-sky-400" />
              <h3 className="text-base font-bold text-white">Operations Shortcut</h3>
            </div>
            <p className="text-xs text-slate-400 mb-5">
              Instant controls for support escalations, queue maintenance, and platform integrity.
            </p>

            <div className="space-y-2.5">
              <Link
                href="/tenants"
                className="w-full flex items-center justify-between p-3 rounded-lg bg-[#090d16] border border-[#1e293b] hover:border-indigo-500/50 hover:bg-[#162238]/40 transition-all text-xs font-semibold text-slate-200"
              >
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  Workspace Impersonation & Audit
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
              </Link>

              <Link
                href="/queues"
                className="w-full flex items-center justify-between p-3 rounded-lg bg-[#090d16] border border-[#1e293b] hover:border-indigo-500/50 hover:bg-[#162238]/40 transition-all text-xs font-semibold text-slate-200"
              >
                <span className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-rose-400" />
                  BullMQ Queue Inspector & Retries
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
              </Link>

              <Link
                href="/integrations"
                className="w-full flex items-center justify-between p-3 rounded-lg bg-[#090d16] border border-[#1e293b] hover:border-indigo-500/50 hover:bg-[#162238]/40 transition-all text-xs font-semibold text-slate-200"
              >
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-400" />
                  Inspect 7 Social API Health Statuses
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
              </Link>

              <Link
                href="/subscriptions"
                className="w-full flex items-center justify-between p-3 rounded-lg bg-[#090d16] border border-[#1e293b] hover:border-indigo-500/50 hover:bg-[#162238]/40 transition-all text-xs font-semibold text-slate-200"
              >
                <span className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Review Stripe Failed Invoices
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#1e293b] text-center">
            <span className="text-[11px] text-slate-500 font-mono">
              Postlane Super Admin Node: i-08f32ac99b (us-east-1)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
