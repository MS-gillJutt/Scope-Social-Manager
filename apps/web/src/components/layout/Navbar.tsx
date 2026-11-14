"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layers,
  Sparkles,
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  Share2,
  Calendar,
  BarChart3,
  ShieldCheck,
} from "lucide-react";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresDropdown, setFeaturesDropdown] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "/features" },
    { name: "Platforms", href: "/platforms" },
    { name: "Pricing", href: "/pricing" },
  ];

  const featureHighlights = [
    {
      title: "Unified Composer",
      desc: "One compose canvas tailored to all 7 social network specs",
      href: "/features#composer",
      icon: Layers,
    },
    {
      title: "Visual Content Calendar",
      desc: "Drag-and-drop monthly planning & bulk queue scheduler",
      href: "/features#calendar",
      icon: Calendar,
    },
    {
      title: "Cross-Platform Analytics",
      desc: "Holistic engagement, reach, and conversion attribution",
      href: "/features#analytics",
      icon: BarChart3,
    },
    {
      title: "Agency Multi-Tenant & Approvals",
      desc: "Client workspaces with tiered role-based permissions",
      href: "/features#agency",
      icon: ShieldCheck,
    },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 shadow-lg shadow-black/20 py-3.5"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-sky-500 flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:shadow-brand-500/50 transition-all">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Postlane
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  Pro
                </span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium tracking-wide">
                One lane. Every platform.
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {/* Features Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setFeaturesDropdown(true)}
              onMouseLeave={() => setFeaturesDropdown(false)}
            >
              <Link
                href="/features"
                className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  pathname === "/features"
                    ? "text-white bg-slate-800/60"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/40"
                }`}
              >
                Features
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </Link>

              {featuresDropdown && (
                <div className="absolute top-full left-0 w-80 pt-2 z-50">
                  <div className="p-3 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl">
                    <div className="space-y-1">
                      {featureHighlights.map((feat) => {
                        const Icon = feat.icon;
                        return (
                          <Link
                            key={feat.title}
                            href={feat.href}
                            className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/70 transition-all group"
                          >
                            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 group-hover:bg-brand-500/20 group-hover:text-brand-300 transition-colors">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white group-hover:text-brand-300 transition-colors">
                                {feat.title}
                              </div>
                              <div className="text-xs text-slate-400 leading-snug">
                                {feat.desc}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 px-2 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        Explore all capabilities
                      </span>
                      <Link
                        href="/features"
                        className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
                      >
                        All Features <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/platforms"
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                pathname === "/platforms"
                  ? "text-white bg-slate-800/60"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              Platforms
            </Link>

            <Link
              href="/pricing"
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                pathname === "/pricing"
                  ? "text-white bg-slate-800/60"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              Pricing
            </Link>
          </nav>

          {/* Desktop Auth & CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>

            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-md shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 focus:outline-none"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950/95 border-b border-slate-800 px-4 pt-3 pb-6 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-base font-medium ${
                  pathname === link.href
                    ? "text-white bg-slate-800"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-xl border border-slate-700 text-slate-200 text-sm font-medium hover:bg-slate-800"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-sm font-semibold shadow-md shadow-brand-500/20"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
