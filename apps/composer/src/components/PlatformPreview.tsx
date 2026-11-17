import React, { useState } from "react";
import { MediaAttachment, PlatformId } from "../types";
import { Language, TRANSLATIONS } from "../constants/translations";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share2,
  Bookmark,
  ThumbsUp,
  MoreHorizontal,
  Globe,
  Disc,
  Music2,
  Send,
  CheckCircle2,
  Eye,
} from "lucide-react";

interface PlatformPreviewProps {
  caption: string;
  hashtags: string[];
  media?: MediaAttachment;
  selectedPlatforms: PlatformId[];
  authorName: string;
  lang: Language;
}

export const PlatformPreview: React.FC<PlatformPreviewProps> = ({
  caption,
  hashtags,
  media,
  selectedPlatforms,
  authorName,
  lang,
}) => {
  const t = TRANSLATIONS[lang];
  const [activeTab, setActiveTab] = useState<PlatformId>(
    selectedPlatforms[0] || "linkedin"
  );

  // If activeTab is no longer in selectedPlatforms, fall back
  const currentTab = selectedPlatforms.includes(activeTab)
    ? activeTab
    : selectedPlatforms[0] || "linkedin";

  const fullCaption = `${caption || "Start typing your post to see the live preview..."}\n\n${hashtags.join(
    " "
  )}`.trim();

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>{t.postPreview}</span>
        </h3>

        {/* Platform Tabs */}
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
          {selectedPlatforms.map((pid) => (
            <button
              key={pid}
              type="button"
              onClick={() => setActiveTab(pid)}
              className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-all ${
                currentTab === pid
                  ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              {pid === "twitter" ? "Twitter/X" : pid}
            </button>
          ))}
        </div>
      </div>

      {/* Preview Container */}
      <div className="bg-neutral-50 dark:bg-neutral-950/70 rounded-xl p-4 border border-neutral-200/80 dark:border-neutral-800 min-h-[380px] flex items-center justify-center">
        {/* LINKEDIN PREVIEW */}
        {currentTab === "linkedin" && (
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm text-neutral-900 dark:text-neutral-100 text-xs overflow-hidden">
            {/* Header */}
            <div className="p-3.5 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/60">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  {authorName.charAt(0) || "U"}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {authorName || "Social Creator"}
                    </span>
                    <span className="text-[10px] text-neutral-400">• 1st</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Content Strategist & Entrepreneur
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                    <span>Just now</span>
                    <span>•</span>
                    <Globe className="w-2.5 h-2.5" />
                  </div>
                </div>
              </div>
              <MoreHorizontal className="w-4 h-4 text-neutral-400" />
            </div>

            {/* Post Body */}
            <div className="p-3.5 space-y-2 whitespace-pre-line leading-relaxed text-xs">
              <p>{caption || "Your LinkedIn post content will appear here..."}</p>
              {hashtags.length > 0 && (
                <p className="text-blue-600 dark:text-blue-400 font-medium">
                  {hashtags.join(" ")}
                </p>
              )}
            </div>

            {/* Media */}
            {media && (
              <div className="bg-black/90 max-h-72 overflow-hidden flex items-center justify-center">
                {media.type === "image" ? (
                  <img
                    src={media.url}
                    alt={media.name}
                    className="w-full max-h-72 object-cover"
                  />
                ) : (
                  <video
                    src={media.url}
                    controls
                    className="w-full max-h-72 object-contain"
                  />
                )}
              </div>
            )}

            {/* LinkedIn Actions */}
            <div className="p-2 px-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-neutral-600 dark:text-neutral-400">
              <button className="flex items-center gap-1.5 py-1.5 px-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md">
                <ThumbsUp className="w-3.5 h-3.5 text-blue-600" />
                <span>Like</span>
              </button>
              <button className="flex items-center gap-1.5 py-1.5 px-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Comment</span>
              </button>
              <button className="flex items-center gap-1.5 py-1.5 px-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md">
                <Repeat2 className="w-3.5 h-3.5" />
                <span>Repost</span>
              </button>
              <button className="flex items-center gap-1.5 py-1.5 px-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md">
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>
          </div>
        )}

        {/* TIKTOK PREVIEW */}
        {currentTab === "tiktok" && (
          <div className="w-[280px] h-[480px] bg-neutral-950 text-white rounded-2xl shadow-xl overflow-hidden relative flex flex-col justify-between border-4 border-neutral-800">
            {/* Background Media */}
            <div className="absolute inset-0 z-0 bg-neutral-900 flex items-center justify-center">
              {media ? (
                media.type === "image" ? (
                  <img
                    src={media.url}
                    alt={media.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={media.url}
                    autoPlay
                    loop
                    muted
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="text-center p-4 text-neutral-600">
                  <p className="text-xs">No media uploaded yet</p>
                  <p className="text-[10px]">TikTok requires video or image</p>
                </div>
              )}
            </div>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 z-10 pointer-events-none" />

            {/* Top Bar */}
            <div className="relative z-20 p-3 pt-4 flex justify-between items-center text-xs font-semibold">
              <span className="text-white/60">Following</span>
              <span className="text-white border-b-2 border-white pb-0.5">
                For You
              </span>
              <span className="text-white/60">Search</span>
            </div>

            {/* Right-side Action Column */}
            <div className="relative z-20 self-end mr-2 mb-14 flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-linear-to-tr from-rose-500 to-amber-500 border border-white flex items-center justify-center text-[10px] font-bold">
                  {authorName.charAt(0) || "T"}
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center">
                  +
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="p-2 rounded-full bg-neutral-800/60 backdrop-blur-xs">
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                </div>
                <span className="text-[10px] font-medium mt-0.5">14.2k</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="p-2 rounded-full bg-neutral-800/60 backdrop-blur-xs">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-medium mt-0.5">382</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="p-2 rounded-full bg-neutral-800/60 backdrop-blur-xs">
                  <Bookmark className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-medium mt-0.5">1.1k</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="p-2 rounded-full bg-neutral-800/60 backdrop-blur-xs">
                  <Share2 className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-medium mt-0.5">Share</span>
              </div>

              <div className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center animate-spin">
                <Disc className="w-4 h-4 text-neutral-400" />
              </div>
            </div>

            {/* Bottom Info */}
            <div className="relative z-20 p-3 pb-4 text-xs space-y-1 max-w-[210px]">
              <p className="font-bold text-sm">@{authorName || "content_creator"}</p>
              <p className="text-[11px] line-clamp-3 text-neutral-200">
                {caption || "Watch till the end! #fyp #viral"}
              </p>
              {hashtags.length > 0 && (
                <p className="text-[10px] text-neutral-300 font-semibold truncate">
                  {hashtags.join(" ")}
                </p>
              )}
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-300 pt-1">
                <Music2 className="w-3 h-3" />
                <span className="truncate">Original Sound - Trending Audio</span>
              </div>
            </div>
          </div>
        )}

        {/* INSTAGRAM PREVIEW */}
        {currentTab === "instagram" && (
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm text-neutral-900 dark:text-neutral-100 text-xs overflow-hidden">
            {/* Header */}
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full p-0.5 bg-linear-to-tr from-amber-500 via-rose-500 to-purple-600">
                  <div className="w-full h-full rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center text-[11px] font-bold">
                    {authorName.charAt(0) || "I"}
                  </div>
                </div>
                <div>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {authorName || "insta_creator"}
                  </span>
                  <p className="text-[10px] text-neutral-400">Original Audio</p>
                </div>
              </div>
              <MoreHorizontal className="w-4 h-4 text-neutral-400" />
            </div>

            {/* Media Canvas */}
            <div className="w-full aspect-square bg-neutral-900 flex items-center justify-center overflow-hidden">
              {media ? (
                media.type === "image" ? (
                  <img
                    src={media.url}
                    alt={media.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={media.url}
                    controls
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="text-center p-6 text-neutral-500">
                  <p>Upload an image or reel</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-3 pb-1 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className="w-4 h-4 hover:text-red-500 cursor-pointer" />
                <MessageCircle className="w-4 h-4 cursor-pointer" />
                <Send className="w-4 h-4 cursor-pointer" />
              </div>
              <Bookmark className="w-4 h-4 cursor-pointer" />
            </div>

            {/* Caption */}
            <div className="p-3 pt-1.5 space-y-1 text-xs">
              <p className="font-semibold text-[11px]">842 likes</p>
              <p className="leading-snug">
                <span className="font-semibold mr-1.5">
                  {authorName || "insta_creator"}
                </span>
                <span>{caption || "Captivating content..."}</span>
              </p>
              {hashtags.length > 0 && (
                <p className="text-blue-600 dark:text-blue-400 text-[11px]">
                  {hashtags.join(" ")}
                </p>
              )}
              <p className="text-[10px] text-neutral-400 uppercase pt-1">
                2 HOURS AGO
              </p>
            </div>
          </div>
        )}

        {/* FACEBOOK PREVIEW */}
        {currentTab === "facebook" && (
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm text-neutral-900 dark:text-neutral-100 text-xs overflow-hidden">
            {/* FB Header */}
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-sm">
                  {authorName.charAt(0) || "F"}
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white">
                    {authorName || "Facebook Page"}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                    <span>Just now</span>
                    <span>•</span>
                    <Globe className="w-2.5 h-2.5" />
                  </div>
                </div>
              </div>
              <MoreHorizontal className="w-4 h-4 text-neutral-400" />
            </div>

            {/* FB Text */}
            <div className="px-3.5 pb-2.5 space-y-1.5 text-xs whitespace-pre-line">
              <p>{caption || "Your Facebook post content..."}</p>
              {hashtags.length > 0 && (
                <p className="text-blue-600 dark:text-blue-400">
                  {hashtags.join(" ")}
                </p>
              )}
            </div>

            {/* FB Media */}
            {media && (
              <div className="w-full bg-black max-h-72 overflow-hidden flex items-center justify-center">
                {media.type === "image" ? (
                  <img
                    src={media.url}
                    alt={media.name}
                    className="w-full max-h-72 object-cover"
                  />
                ) : (
                  <video
                    src={media.url}
                    controls
                    className="w-full max-h-72 object-contain"
                  />
                )}
              </div>
            )}

            {/* FB Actions */}
            <div className="p-2 px-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-around text-neutral-600 dark:text-neutral-400 font-medium">
              <button className="flex items-center gap-1.5 py-1 px-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md">
                <ThumbsUp className="w-3.5 h-3.5 text-[#1877F2]" />
                <span>Like</span>
              </button>
              <button className="flex items-center gap-1.5 py-1 px-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Comment</span>
              </button>
              <button className="flex items-center gap-1.5 py-1 px-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md">
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>
          </div>
        )}

        {/* TWITTER / X PREVIEW */}
        {currentTab === "twitter" && (
          <div className="w-full max-w-md bg-white dark:bg-black rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm text-neutral-900 dark:text-neutral-100 p-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {authorName.charAt(0) || "X"}
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-neutral-900 dark:text-white truncate">
                    {authorName || "Creator"}
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="text-neutral-400 truncate">
                    @{authorName.toLowerCase().replace(/\s+/g, "") || "handle"}
                  </span>
                  <span className="text-neutral-400">• Just now</span>
                </div>

                <div className="text-xs leading-relaxed whitespace-pre-line space-y-1">
                  <p>{caption || "What is happening?!"}</p>
                  {hashtags.length > 0 && (
                    <p className="text-blue-500 font-medium">
                      {hashtags.join(" ")}
                    </p>
                  )}
                </div>

                {media && (
                  <div className="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 max-h-60 bg-neutral-900">
                    {media.type === "image" ? (
                      <img
                        src={media.url}
                        alt={media.name}
                        className="w-full max-h-60 object-cover"
                      />
                    ) : (
                      <video
                        src={media.url}
                        controls
                        className="w-full max-h-60 object-contain"
                      />
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-neutral-400 max-w-xs">
                  <button className="flex items-center gap-1 hover:text-blue-500">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span className="text-[10px]">12</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-green-500">
                    <Repeat2 className="w-3.5 h-3.5" />
                    <span className="text-[10px]">8</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-rose-500">
                    <Heart className="w-3.5 h-3.5" />
                    <span className="text-[10px]">95</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-blue-500">
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>
                  <button className="flex items-center gap-1 hover:text-blue-500">
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
