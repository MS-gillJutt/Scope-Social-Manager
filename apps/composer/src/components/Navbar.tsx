import React from "react";
import { TRANSLATIONS } from "../constants/translations";
import {
  Share2,
  Calendar,
  Settings,
  HelpCircle,
  Zap,
} from "lucide-react";

interface NavbarProps {
  onOpenGuide: () => void;
  onOpenSettings: () => void;
  scheduledCount: number;
  activeView: "composer" | "queue";
  setActiveView: (view: "composer" | "queue") => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenGuide,
  onOpenSettings,
  scheduledCount,
  activeView,
  setActiveView,
}) => {
  const t = TRANSLATIONS.en;

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xs">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white leading-tight">
                {t.appName}
              </h1>
              <span
                onClick={onOpenGuide}
                className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 cursor-pointer hover:bg-emerald-100 transition-colors"
                title={t.zeroBudgetTooltip}
              >
                <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                <span>{t.zeroBudgetBadge}</span>
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 hidden sm:block">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* View Switcher: Composer vs Queue */}
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveView("composer")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeView === "composer"
                  ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              {t.newPost}
            </button>
            <button
              type="button"
              onClick={() => setActiveView("queue")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeView === "queue"
                  ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>{t.queueTitle}</span>
              {scheduledCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {scheduledCount}
                </span>
              )}
            </button>
          </div>

          {/* Zero-Budget Free Guide Button */}
          <button
            type="button"
            onClick={onOpenGuide}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg border border-emerald-200 dark:border-emerald-800/60 transition-colors"
            title={t.guideTitle}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{t.guideTitle}</span>
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-800 transition-colors"
            title={t.settingsTitle}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
