import React, { useState } from "react";
import { NICHE_HASHTAGS } from "../constants/platforms";
import { TRANSLATIONS } from "../constants/translations";
import { Hash, Sparkles, Plus, X, Copy, Check } from "lucide-react";
import { PlatformId } from "../types";
import { generateHashtags } from "../lib/api";

interface HashtagManagerProps {
  hashtags: string[];
  onChange: (hashtags: string[]) => void;
  postContent: string;
  selectedPlatforms: PlatformId[];
}

export const HashtagManager: React.FC<HashtagManagerProps> = ({
  hashtags,
  onChange,
  postContent,
  selectedPlatforms,
}) => {
  const t = TRANSLATIONS.en;
  const [customTag, setCustomTag] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const addTag = (rawTag: string) => {
    let clean = rawTag.trim();
    if (!clean) return;
    if (!clean.startsWith("#")) clean = `#${clean}`;
    clean = clean.replace(/[\s,]+/g, "");

    if (!hashtags.includes(clean)) {
      onChange([...hashtags, clean]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(customTag);
      setCustomTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(hashtags.filter((t) => t !== tagToRemove));
  };

  const clearAllTags = () => {
    onChange([]);
  };

  const copyTags = () => {
    if (hashtags.length === 0) return;
    navigator.clipboard.writeText(hashtags.join(" "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateAIHashtags = async () => {
    try {
      setIsGenerating(true);
      const data = await generateHashtags({
        content: postContent,
        platforms: selectedPlatforms,
        count: 8,
        language: "en",
      });
      if (Array.isArray(data.hashtags)) {
        const unique = Array.from(new Set([...hashtags, ...data.hashtags]));
        onChange(unique);
      }
    } catch (err) {
      console.error("Failed to generate hashtags:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const addNicheTags = (tags: string[]) => {
    const unique = Array.from(new Set([...hashtags, ...tags]));
    onChange(unique);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            {t.hashtagsLabel}
          </h3>
          <span className="text-xs text-neutral-500">({hashtags.length})</span>
        </div>

        <div className="flex items-center gap-2">
          {hashtags.length > 0 && (
            <>
              <button
                type="button"
                onClick={copyTags}
                className="flex items-center gap-1 text-xs px-2.5 py-1 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                title="Copy all hashtags"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied ? t.copied : "Copy"}</span>
              </button>
              <button
                type="button"
                onClick={clearAllTags}
                className="text-xs px-2 py-1 text-neutral-400 hover:text-red-500 rounded-md transition-colors"
              >
                Clear
              </button>
            </>
          )}

          <button
            type="button"
            onClick={generateAIHashtags}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-md transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
            <span>{isGenerating ? t.aiOptimizing : t.aiGenerateTags}</span>
          </button>
        </div>
      </div>

      {/* Active Tags */}
      <div className="min-h-12 p-2.5 mb-3 bg-neutral-50 dark:bg-neutral-850 rounded-lg border border-neutral-200/70 dark:border-neutral-800 flex flex-wrap gap-1.5 items-center">
        {hashtags.length === 0 ? (
          <p className="text-xs text-neutral-400 italic py-1 px-1">
            No hashtags added yet. Select a niche bundle below, use the AI generator, or type custom tags.
          </p>
        ) : (
          hashtags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-red-600 transition-colors p-0.5 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Add Custom Tag Input */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.addCustomHashtag}
            className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-750 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            addTag(customTag);
            setCustomTag("");
          }}
          disabled={!customTag.trim()}
          className="flex items-center gap-1 px-3 py-2 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 text-white dark:text-neutral-900 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.addTagBtn}</span>
        </button>
      </div>

      {/* Quick Niche Hashtags */}
      <div>
        <p className="text-xs font-medium text-neutral-500 mb-2">
          {t.popularNiches}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(NICHE_HASHTAGS).map(([key, niche]) => (
            <button
              key={key}
              type="button"
              onClick={() => addNicheTags(niche.tags)}
              className="text-[11px] px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium transition-colors"
            >
              + {niche.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
