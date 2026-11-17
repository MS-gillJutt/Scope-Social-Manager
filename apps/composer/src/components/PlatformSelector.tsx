import React from "react";
import { PlatformId } from "../types";
import { PLATFORMS } from "../constants/platforms";
import { Language, TRANSLATIONS } from "../constants/translations";
import { Check, Linkedin, Video, Instagram, Facebook, Twitter } from "lucide-react";

interface PlatformSelectorProps {
  selectedPlatforms: PlatformId[];
  onChange: (platforms: PlatformId[]) => void;
  lang: Language;
  contentLength: number;
}

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedPlatforms,
  onChange,
  lang,
  contentLength,
}) => {
  const t = TRANSLATIONS[lang];

  const togglePlatform = (id: PlatformId) => {
    if (selectedPlatforms.includes(id)) {
      onChange(selectedPlatforms.filter((p) => p !== id));
    } else {
      onChange([...selectedPlatforms, id]);
    }
  };

  const selectAll = () => {
    onChange(PLATFORMS.map((p) => p.id));
  };

  const deselectAll = () => {
    onChange([]);
  };

  const getPlatformIcon = (id: PlatformId) => {
    switch (id) {
      case "linkedin":
        return <Linkedin className="w-5 h-5 text-[#0A66C2]" />;
      case "tiktok":
        return <Video className="w-5 h-5 text-neutral-900 dark:text-white" />;
      case "instagram":
        return <Instagram className="w-5 h-5 text-[#E1306C]" />;
      case "facebook":
        return <Facebook className="w-5 h-5 text-[#1877F2]" />;
      case "twitter":
        return <Twitter className="w-5 h-5 text-neutral-900 dark:text-neutral-200" />;
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <span>{t.targetPlatforms}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-medium">
              {selectedPlatforms.length}/{PLATFORMS.length}
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={selectAll}
            className="px-2.5 py-1 font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-md transition-colors"
          >
            {t.selectAll}
          </button>
          <span className="text-neutral-300 dark:text-neutral-700">|</span>
          <button
            type="button"
            onClick={deselectAll}
            className="px-2.5 py-1 font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
          >
            {t.deselectAll}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {PLATFORMS.map((platform) => {
          const isSelected = selectedPlatforms.includes(platform.id);
          const isOverLimit = contentLength > platform.charLimit;

          return (
            <button
              key={platform.id}
              type="button"
              onClick={() => togglePlatform(platform.id)}
              className={`relative flex flex-col p-3 rounded-lg border text-left transition-all cursor-pointer ${
                isSelected
                  ? "border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs"
                  : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-850"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 rounded-md bg-white dark:bg-neutral-800 shadow-xs border border-neutral-100 dark:border-neutral-700">
                  {getPlatformIcon(platform.id)}
                </div>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                    isSelected
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {lang === "ur" ? platform.nameUrdu : platform.name}
                </p>
                {platform.note && (
                  <p className="text-[11px] leading-snug text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {platform.note}
                  </p>
                )}
                <div className="flex items-center justify-between text-[11px] mt-1">
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Max: {platform.charLimit >= 1000 ? `${(platform.charLimit / 1000).toFixed(0)}k` : platform.charLimit}
                  </span>
                  {isOverLimit && isSelected && (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                      Exceeded!
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
