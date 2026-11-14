import React from "react";
import Link from "next/link";
import {
  Share2,
  CheckCircle2,
  Shield,
  Zap,
  Globe,
  Twitter,
  Github,
  Linkedin,
  Youtube,
  Send,
} from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 pt-16 pb-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
                <Share2 className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Postlane
              </span>
            </Link>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
              The high-velocity multi-tenant social media command center. Create once,
              tailor per network with native specs, and schedule across all 7 major platforms with zero friction.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                All 7 Official APIs Operational
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
                <Shield className="w-3.5 h-3.5 text-brand-400" />
                SOC-2 & GDPR Ready
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Product
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/features" className="hover:text-white transition-colors">
                  Features Overview
                </Link>
              </li>
              <li>
                <Link href="/features#composer" className="hover:text-white transition-colors">
                  Unified Composer
                </Link>
              </li>
              <li>
                <Link href="/features#calendar" className="hover:text-white transition-colors">
                  Visual Calendar & Queue
                </Link>
              </li>
              <li>
                <Link href="/features#analytics" className="hover:text-white transition-colors">
                  Cross-Platform Analytics
                </Link>
              </li>
              <li>
                <Link href="/features#vault" className="hover:text-white transition-colors">
                  Cloudflare R2 Media Vault
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Pricing & Plans
                </Link>
              </li>
            </ul>
          </div>

          {/* Supported Platforms */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Supported APIs
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/platforms#instagram" className="hover:text-white transition-colors">
                  Instagram Graph API
                </Link>
              </li>
              <li>
                <Link href="/platforms#facebook" className="hover:text-white transition-colors">
                  Facebook Pages & Groups
                </Link>
              </li>
              <li>
                <Link href="/platforms#tiktok" className="hover:text-white transition-colors">
                  TikTok Content Posting API
                </Link>
              </li>
              <li>
                <Link href="/platforms#linkedin" className="hover:text-white transition-colors">
                  LinkedIn Community v2
                </Link>
              </li>
              <li>
                <Link href="/platforms#youtube" className="hover:text-white transition-colors">
                  YouTube Data API v3
                </Link>
              </li>
              <li>
                <Link href="/platforms#threads" className="hover:text-white transition-colors">
                  Threads Publishing API
                </Link>
              </li>
              <li>
                <Link href="/platforms#reddit" className="hover:text-white transition-colors">
                  Reddit OAuth2 API
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Security */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Enterprise & Trust
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/register" className="hover:text-white transition-colors">
                  Agency Multi-Tenancy
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Sign In to Workspace
                </Link>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                  Security Architecture
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                  Data Processing Addendum
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                  Terms of Service
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {currentYear} Postlane Inc. All rights reserved. Built for modern growth teams and agencies.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Zap className="w-3.5 h-3.5 text-brand-400" /> 99.99% Guaranteed Dispatch SLA
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <Globe className="w-3.5 h-3.5 text-sky-400" /> Global Edge Distribution
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
