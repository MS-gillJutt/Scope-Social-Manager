"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Sparkles, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export function InteractivePricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  const plans = [
    {
      id: "free",
      name: "Free",
      tagline: "For individual creators getting started with multi-channel posting.",
      monthlyPrice: 0,
      yearlyPrice: 0,
      popular: false,
      ctaText: "Get Started Free",
      ctaHref: "/register?plan=free",
      features: [
        "1 Workspace",
        "2 Connected Social Accounts",
        "10 Scheduled Posts / month",
        "1 Team Member",
        "1 GB Cloudflare R2 Media Storage",
        "7 Days Analytics History",
        "Official Graph & OAuth2 APIs",
      ],
      notIncluded: ["AI Caption Adaptation", "Approval workflows", "API access"],
    },
    {
      id: "starter",
      name: "Starter",
      tagline: "For growing solo creators and boutique brand founders.",
      monthlyPrice: 19,
      yearlyPrice: 15,
      popular: false,
      ctaText: "Start 14-Day Free Trial",
      ctaHref: "/register?plan=starter",
      features: [
        "2 Workspaces",
        "10 Connected Social Accounts",
        "100 Scheduled Posts / month",
        "3 Team Members",
        "10 GB Cloudflare R2 Storage",
        "30 Days Analytics History",
        "50 AI Caption & Hashtag Credits / mo",
        "First-Comment Instagram Hashtags",
      ],
      notIncluded: ["Agency approval workflow", "White label reports"],
    },
    {
      id: "pro",
      name: "Pro",
      tagline: "For high-output digital creators, startups & growing marketing teams.",
      monthlyPrice: 49,
      yearlyPrice: 39,
      popular: true,
      ctaText: "Start 14-Day Free Trial",
      ctaHref: "/register?plan=pro",
      features: [
        "10 Workspaces",
        "30 Connected Social Accounts",
        "1,000 Scheduled Posts / month",
        "10 Team Members",
        "50 GB Cloudflare R2 Storage",
        "90 Days In-Depth Analytics",
        "500 AI Assistant Credits / mo",
        "Visual Queue & Drag-Drop Calendar",
        "Role-Based Approval Workflows",
        "REST API Access & Webhooks",
        "Priority Support Response",
      ],
      notIncluded: ["Custom White Label domain"],
    },
    {
      id: "agency",
      name: "Agency",
      tagline: "For agencies handling multiple client brands with strict approval pipelines.",
      monthlyPrice: 149,
      yearlyPrice: 119,
      popular: false,
      ctaText: "Scale with Agency",
      ctaHref: "/register?plan=agency",
      features: [
        "100 Workspaces (Isolated Client Silos)",
        "500 Connected Social Accounts",
        "Unlimited Scheduled Posts",
        "100 Team Members & External Clients",
        "500 GB High-Speed Media Vault",
        "365 Days Historical Analytics",
        "Unlimited AI Engine Usage",
        "Custom White-Label Client Portals",
        "Multi-Tier Client Review Approvals",
        "Dedicated Account Strategist",
      ],
      notIncluded: [],
    },
  ];

  return (
    <div className="space-y-12">
      {/* Billing Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <div className="inline-flex items-center rounded-full bg-slate-900 border border-slate-800 p-1">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
              billingCycle === "monthly"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              billingCycle === "yearly"
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Annual Billing</span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const price =
            billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 ${
                plan.popular
                  ? "border-2 border-brand-500 bg-slate-900/90 shadow-2xl shadow-brand-500/20 -translate-y-2"
                  : "border border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider shadow-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Most Popular
                </div>
              )}

              <div>
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 min-h-[36px]">
                    {plan.tagline}
                  </p>
                </div>

                <div className="mb-6 pb-6 border-b border-slate-800">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">
                      ${price}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      / month
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    {plan.monthlyPrice === 0
                      ? "Free forever"
                      : billingCycle === "yearly"
                      ? `Billed annually ($${price * 12}/year)`
                      : "Billed monthly"}
                  </span>
                </div>

                {/* Features List */}
                <div className="space-y-2.5 mb-8 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Included with {plan.name}:
                  </span>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-slate-200">
                      <div className="rounded-full p-0.5 bg-brand-500/20 text-brand-400 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Link
                  href={plan.ctaHref}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    plan.popular
                      ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/30 hover:brightness-110"
                      : "bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  <span>{plan.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <p className="text-[10px] text-center text-slate-400 mt-2.5">
                  No credit card required • Cancel anytime
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enterprise Custom Banner */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              Enterprise Custom
            </span>
            <span className="text-xs text-slate-400">SOC-2 Type II • Dedicated VPC</span>
          </div>
          <h3 className="text-2xl font-bold text-white">
            Need custom volume, private infrastructure, or SSO?
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Enterprise plans include custom account limits, dedicated IP pools for high-frequency publishing, SAML SSO/Okta, custom SLA agreements, and 24/7 dedicated engineering channels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/register?plan=enterprise"
            className="px-6 py-3 rounded-xl bg-white text-slate-950 font-bold text-xs hover:bg-slate-100 transition-colors shadow-lg"
          >
            Contact Enterprise Sales
          </Link>
          <Link
            href="/pricing"
            className="px-5 py-3 rounded-xl border border-slate-700 text-slate-300 font-semibold text-xs hover:bg-slate-800 transition-colors"
          >
            Full Feature Checklist
          </Link>
        </div>
      </div>
    </div>
  );
}
