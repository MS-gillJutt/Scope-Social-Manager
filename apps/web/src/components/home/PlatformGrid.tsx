import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Video,
  Layers,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export interface PlatformInfo {
  id: string;
  name: string;
  color: string;
  badge: string;
  apiName: string;
  description: string;
  features: string[];
  specs: {
    maxChars: string;
    maxMedia: string;
    videoMax: string;
  };
}

export const PLATFORMS_DATA: PlatformInfo[] = [
  {
    id: "instagram",
    name: "Instagram",
    color: "#E1306C",
    badge: "Official Meta Graph API",
    apiName: "Instagram Graph API v19.0",
    description: "Direct carousel, single image, video Reels, and scheduled Stories with automated first-comment hashtag management.",
    features: [
      "Carousel (up to 10 photos/videos)",
      "Reels direct auto-publishing",
      "Automated first comment for hashtags",
      "Profile & Reels engagement insights",
    ],
    specs: {
      maxChars: "2,200 characters",
      maxMedia: "10 carousel items",
      videoMax: "15 min (Reels/Video)",
    },
  },
  {
    id: "tiktok",
    name: "TikTok",
    color: "#00F2FE",
    badge: "TikTok Partner API",
    apiName: "TikTok Content Posting API v2",
    description: "Direct to Feed and Draft inbox publishing. Control Duet, Stitch, and comment permissions natively from Postlane.",
    features: [
      "Direct feed video publishing",
      "Stitch, Duet & Comment privacy toggles",
      "Custom cover frame selector",
      "Commercial content disclosure tag",
    ],
    specs: {
      maxChars: "2,200 characters",
      maxMedia: "1 video per post",
      videoMax: "10 minutes (up to 500MB)",
    },
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    color: "#0A66C2",
    badge: "LinkedIn Marketing Developer",
    apiName: "LinkedIn Community Management v2",
    description: "Publish to personal profiles and Company Pages. Native support for multi-image slides, PDF carousels, and rich text articles.",
    features: [
      "Company Pages & Personal Profiles",
      "PDF Carousel slide document uploads",
      "Polls & article thumbnail controls",
      "B2B demographic impression analytics",
    ],
    specs: {
      maxChars: "3,000 characters",
      maxMedia: "9 images or 1 PDF",
      videoMax: "10 minutes (up to 500MB)",
    },
  },
  {
    id: "youtube",
    name: "YouTube",
    color: "#FF0000",
    badge: "Google Cloud Verified",
    apiName: "YouTube Data API v3",
    description: "Schedule YouTube Shorts and long-form video releases with automated category selection, tags, and privacy toggles.",
    features: [
      "YouTube Shorts auto-tagging",
      "Public, Unlisted & Private release scheduler",
      "Custom thumbnail upload & title A/B check",
      "Audience retention & subscriber tracking",
    ],
    specs: {
      maxChars: "5,000 char description",
      maxMedia: "1 video asset",
      videoMax: "Up to 12 hours (Full HD/4K)",
    },
  },
  {
    id: "threads",
    name: "Threads",
    color: "#FFFFFF",
    badge: "Official Meta API",
    apiName: "Threads Publishing API v1",
    description: "Publish text updates, carousels, and media directly to Threads without phone notification hurdles or manual pastes.",
    features: [
      "Multi-image carousels & video clips",
      "Thread reply control (Anyone/Mentions/Follows)",
      "Topic tag integration",
      "Automated quote & reply monitors",
    ],
    specs: {
      maxChars: "500 characters",
      maxMedia: "10 media assets",
      videoMax: "5 minutes (HD)",
    },
  },
  {
    id: "facebook",
    name: "Facebook",
    color: "#1877F2",
    badge: "Meta Business Partner",
    apiName: "Facebook Graph API v19.0",
    description: "Multi-page management for brands and agencies. Publish albums, link previews with custom OG cards, and reels.",
    features: [
      "Page & Group targeting",
      "Multi-image album scheduler",
      "Custom OpenGraph link card overrides",
      "Geo-targeted audience gating",
    ],
    specs: {
      maxChars: "63,206 characters",
      maxMedia: "Up to 30 photos",
      videoMax: "240 minutes",
    },
  },
  {
    id: "reddit",
    name: "Reddit",
    color: "#FF4500",
    badge: "Official Reddit API",
    apiName: "Reddit OAuth2 API v1",
    description: "Publish discussions, link posts, and media directly to authorized Subreddits with custom post flairs and spoiler flags.",
    features: [
      "Targeted Subreddit selector with rules validation",
      "Custom Subreddit Flair selection",
      "Spoiler and NSFW tag enforcement",
      "Comment notification tracking",
    ],
    specs: {
      maxChars: "40,000 characters",
      maxMedia: "Images & Video",
      videoMax: "15 minutes (Reddit Video)",
    },
  },
];

export function PlatformGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {PLATFORMS_DATA.map((plat) => (
        <div
          key={plat.id}
          className="group relative rounded-2xl border border-slate-800 bg-slate-900/60 p-6 hover:border-slate-700 hover:bg-slate-900/90 transition-all duration-300 flex flex-col justify-between"
        >
          {/* Header */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md"
                  style={{ backgroundColor: plat.color === "#FFFFFF" ? "#1e293b" : plat.color }}
                >
                  <span className="text-sm font-black">
                    {plat.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                    {plat.name}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {plat.apiName}
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                Official API
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-5">
              {plat.description}
            </p>

            {/* Feature Checklist */}
            <div className="space-y-2 mb-6">
              {plat.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Specs Footer */}
          <div className="pt-4 border-t border-slate-800/80">
            <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400 mb-3">
              <div>
                <span className="block text-[10px] text-slate-500 uppercase">Limit</span>
                <span className="text-slate-300 font-medium">{plat.specs.maxChars}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase">Media</span>
                <span className="text-slate-300 font-medium">{plat.specs.maxMedia}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase">Video</span>
                <span className="text-slate-300 font-medium">{plat.specs.videoMax}</span>
              </div>
            </div>

            <Link
              href={`/platforms#${plat.id}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
            >
              API Capability Matrix <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      ))}

      {/* 8th Card: Continuous API Expansion */}
      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-6 flex flex-col justify-between items-center text-center">
        <div className="my-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Need Custom Webhooks?</h3>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            Connect your custom internal CMS, headless blogs, or webhook destinations using our REST & Zapier integrations.
          </p>
        </div>
        <Link
          href="/platforms"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 transition-colors w-full"
        >
          View Compatibility Details
        </Link>
      </div>
    </div>
  );
}
