"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Check,
  Send,
  Calendar,
  Image as ImageIcon,
  Clock,
  Instagram,
  Linkedin,
  Youtube,
  Share2,
  Sliders,
  ChevronRight,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
} from "lucide-react";

export function HeroMockup() {
  const [activeTab, setActiveTab] = useState<"composer" | "calendar" | "analytics">("composer");
  const [selectedNetwork, setSelectedNetwork] = useState<"instagram" | "linkedin" | "threads" | "tiktok">("instagram");

  return (
    <div className="relative mx-auto max-w-5xl rounded-2xl border border-slate-700/80 bg-slate-900/90 shadow-2xl shadow-brand-500/10 backdrop-blur-xl overflow-hidden">
      {/* Top Window Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-rose-500/80" />
          <div className="h-3 w-3 rounded-full bg-amber-500/80" />
          <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
          <span className="ml-2 text-xs font-mono text-slate-400">app.scopesocialmanager.com/workspace/acme-growth</span>
        </div>

        {/* Mock View Switcher */}
        <div className="flex rounded-lg bg-slate-800/80 p-0.5 text-xs font-medium text-slate-300">
          <button
            onClick={() => setActiveTab("composer")}
            className={`rounded-md px-3 py-1 transition-colors ${
              activeTab === "composer"
                ? "bg-brand-600 text-white shadow-sm"
                : "hover:text-white"
            }`}
          >
            Unified Composer
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`rounded-md px-3 py-1 transition-colors ${
              activeTab === "calendar"
                ? "bg-brand-600 text-white shadow-sm"
                : "hover:text-white"
            }`}
          >
            Visual Queue
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`rounded-md px-3 py-1 transition-colors ${
              activeTab === "analytics"
                ? "bg-brand-600 text-white shadow-sm"
                : "hover:text-white"
            }`}
          >
            Live Performance
          </button>
        </div>
      </div>

      {/* Main Preview Body */}
      {activeTab === "composer" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          {/* Left: Input Composer */}
          <div className="lg:col-span-7 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Target Lanes:
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30 text-xs">
                    IG @acme
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs">
                    LI Acme Inc
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600 text-xs">
                    Threads
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs">
                    TikTok
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs text-brand-400 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                AI Adaptation Active
              </div>
            </div>

            {/* Main Textarea Mockup */}
            <div className="rounded-xl border border-slate-700/80 bg-slate-950/60 p-4 space-y-3">
              <div className="text-sm text-slate-200 leading-relaxed font-sans">
                Excited to announce the Scope Social Manager 2.0 release! 🚀
                <br />
                We built one unified command center to streamline your cross-platform social publishing with native API specs, zero manual re-formatting, and intelligent scheduling.
                <br /><br />
                <span className="text-brand-400">#SocialMedia #ProductLaunch #MarketingAutomation #CreatorEconomy</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 hover:text-slate-200 cursor-pointer">
                    <ImageIcon className="w-3.5 h-3.5 text-sky-400" /> 3 Assets Attached
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Check className="w-3.5 h-3.5" /> High-Res Cloudflare R2
                  </span>
                </div>
                <span>218 / 2,200 chars</span>
              </div>
            </div>

            {/* Platform Tweaks Bar */}
            <div className="rounded-xl bg-slate-800/40 border border-slate-700/60 p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Sliders className="w-4 h-4 text-brand-400" />
                <span>Auto-Formatted for Instagram (Hashtags in first comment)</span>
              </div>
              <span className="font-semibold text-brand-300 bg-brand-500/10 px-2 py-0.5 rounded">
                Optimal: 02:45 PM Today
              </span>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Queue: Tomorrow, 9:00 AM EST</span>
              </button>

              <div className="flex items-center gap-2">
                <button className="px-3.5 py-1.5 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors">
                  Save Draft
                </button>
                <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 text-xs font-semibold text-white shadow-md shadow-brand-500/30 hover:brightness-110 transition-all">
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish to 4 Networks</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Real-time Multi-Network Preview */}
          <div className="lg:col-span-5 p-6 bg-slate-950/40 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Live Native Preview
              </span>
              <div className="flex gap-1">
                {(["instagram", "linkedin", "threads", "tiktok"] as const).map((net) => (
                  <button
                    key={net}
                    onClick={() => setSelectedNetwork(net)}
                    className={`capitalize px-2 py-0.5 text-xs rounded transition-colors ${
                      selectedNetwork === net
                        ? "bg-slate-700 text-white font-medium"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {net}
                  </button>
                ))}
              </div>
            </div>

            {/* Native Preview Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-3 shadow-inner">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500 to-sky-400 flex items-center justify-center text-xs font-bold text-white">
                  AC
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Acme Growth Co.</div>
                  <div className="text-[10px] text-slate-400">
                    {selectedNetwork === "linkedin"
                      ? "14,820 followers • Promoted"
                      : selectedNetwork === "instagram"
                      ? "Instagram Carousel • 1080x1350"
                      : "Official Verified Account"}
                  </div>
                </div>
              </div>

              {/* Mock media display */}
              <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-gradient-to-br from-indigo-950/60 via-slate-900 to-sky-950/60 aspect-[16/10] flex flex-col justify-end p-4">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="relative z-10">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-brand-500 text-white inline-block mb-1">
                    Product Reveal
                  </span>
                  <div className="text-sm font-bold text-white">
                    Scope Social Manager 2.0 Command Center
                  </div>
                </div>
              </div>

              {/* Engagement Stats Bar */}
              <div className="flex items-center justify-between pt-1 text-slate-400 text-xs">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 hover:text-rose-400 transition-colors">
                    <Heart className="w-3.5 h-3.5" /> 1.4k
                  </span>
                  <span className="flex items-center gap-1 hover:text-sky-400 transition-colors">
                    <MessageCircle className="w-3.5 h-3.5" /> 184
                  </span>
                </div>
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> 98.4% Health Score
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "calendar" && (
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-400" />
              <span className="text-sm font-semibold text-white">
                Queue Matrix: November 2026
              </span>
            </div>
            <span className="text-xs text-slate-400">
              42 Scheduled Posts across 7 Connected Profiles
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                day: "Mon, Nov 16",
                time: "09:30 AM",
                net: "Instagram + Threads",
                title: "Behind-the-scenes engineering tour",
                status: "Approved",
                color: "bg-pink-500/20 text-pink-300 border-pink-500/30",
              },
              {
                day: "Tue, Nov 17",
                time: "01:15 PM",
                net: "LinkedIn + YouTube",
                title: "Case study: 3.4x organic reach scaling",
                status: "Scheduled",
                color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
              },
              {
                day: "Wed, Nov 18",
                time: "04:00 PM",
                net: "TikTok + Reddit",
                title: "AMA: Scaling zero-egress R2 media workflows",
                status: "Pending Review",
                color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
              },
              {
                day: "Thu, Nov 19",
                time: "11:00 AM",
                net: "Facebook + Instagram",
                title: "Product walkthrough reel & story",
                status: "Scheduled",
                color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
              },
            ].map((slot, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-brand-500/40 transition-all space-y-2"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-300">{slot.day}</span>
                  <span className="text-slate-400">{slot.time}</span>
                </div>
                <div className="text-xs font-semibold text-white line-clamp-2">
                  {slot.title}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${slot.color}`}>
                    {slot.net}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">
                    {slot.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50">
              <span className="text-xs text-slate-400">Total Aggregate Reach</span>
              <div className="text-2xl font-bold text-white mt-1">1,489,200</div>
              <span className="text-xs text-emerald-400 font-medium mt-1 inline-block">
                ↑ +28.4% this month
              </span>
            </div>
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50">
              <span className="text-xs text-slate-400">Blended Engagement</span>
              <div className="text-2xl font-bold text-white mt-1">5.92%</div>
              <span className="text-xs text-emerald-400 font-medium mt-1 inline-block">
                ↑ +1.2% vs industry avg
              </span>
            </div>
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50">
              <span className="text-xs text-slate-400">Posts Dispatched</span>
              <div className="text-2xl font-bold text-white mt-1">384</div>
              <span className="text-xs text-slate-400 mt-1 inline-block">
                100% on-time delivery
              </span>
            </div>
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50">
              <span className="text-xs text-slate-400">Team Time Saved</span>
              <div className="text-2xl font-bold text-brand-400 mt-1">64.5 hrs</div>
              <span className="text-xs text-sky-400 font-medium mt-1 inline-block">
                Zero manual logins
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
