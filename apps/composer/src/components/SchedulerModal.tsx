import React, { useState } from "react";
import { SocialPost } from "../types";
import { TRANSLATIONS } from "../constants/translations";
import { Calendar, Clock, Sparkles, X, Check, ArrowRight } from "lucide-react";

interface SchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: SocialPost;
  onSchedulePost: (scheduledPost: SocialPost) => void;
}

export const SchedulerModal: React.FC<SchedulerModalProps> = ({
  isOpen,
  onClose,
  post,
  onSchedulePost,
}) => {
  const t = TRANSLATIONS.en;

  // Default to tomorrow 9:00 AM
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 1);
  const defaultDateStr = defaultDate.toISOString().split("T")[0];

  const [date, setDate] = useState(defaultDateStr);
  const [time, setTime] = useState("09:00");

  if (!isOpen) return null;

  const handleQuickPreset = (preset: "1hour" | "tonight" | "tomorrow9" | "tomorrow18") => {
    const now = new Date();
    if (preset === "1hour") {
      now.setHours(now.getHours() + 1);
      setDate(now.toISOString().split("T")[0]);
      setTime(
        `${String(now.getHours()).padStart(2, "0")}:${String(
          now.getMinutes()
        ).padStart(2, "0")}`
      );
    } else if (preset === "tonight") {
      setDate(now.toISOString().split("T")[0]);
      setTime("20:00");
    } else if (preset === "tomorrow9") {
      now.setDate(now.getDate() + 1);
      setDate(now.toISOString().split("T")[0]);
      setTime("09:00");
    } else if (preset === "tomorrow18") {
      now.setDate(now.getDate() + 1);
      setDate(now.toISOString().split("T")[0]);
      setTime("18:00");
    }
  };

  const handleSaveSchedule = () => {
    const combinedIso = new Date(`${date}T${time}:00`).toISOString();
    onSchedulePost({
      ...post,
      status: "scheduled",
      scheduledFor: combinedIso,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                {t.schedulePostBtn}
              </h3>
              <p className="text-xs text-neutral-500">
Pick date and time to broadcast your post
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Quick Presets */}
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2 block">
              Suggested Prime Times:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickPreset("1hour")}
                className="text-xs p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 hover:border-purple-400 text-left transition-colors"
              >
                <div className="font-semibold text-neutral-900 dark:text-white">
                  In 1 Hour
                </div>
                <div className="text-[10px] text-neutral-500">Quick queue</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPreset("tonight")}
                className="text-xs p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 hover:border-purple-400 text-left transition-colors"
              >
                <div className="font-semibold text-neutral-900 dark:text-white">
                  Tonight 8:00 PM
                </div>
                <div className="text-[10px] text-purple-600 dark:text-purple-400">
                  Prime evening engagement
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPreset("tomorrow9")}
                className="text-xs p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 hover:border-purple-400 text-left transition-colors"
              >
                <div className="font-semibold text-neutral-900 dark:text-white">
                  Tomorrow 9:00 AM
                </div>
                <div className="text-[10px] text-blue-600 dark:text-blue-400">
                  Best for LinkedIn & B2B
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPreset("tomorrow18")}
                className="text-xs p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 hover:border-purple-400 text-left transition-colors"
              >
                <div className="font-semibold text-neutral-900 dark:text-white">
                  Tomorrow 6:00 PM
                </div>
                <div className="text-[10px] text-rose-600 dark:text-rose-400">
                  Best for TikTok & Instagram
                </div>
              </button>
            </div>
          </div>

          {/* Date & Time Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                <span>Select Date</span>
              </label>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-750 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-purple-500/40"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-neutral-500" />
                <span>Select Time</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-750 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-purple-500/40"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 text-xs text-purple-900 dark:text-purple-200 flex items-center justify-between">
            <span className="font-medium">
              {t.scheduledAt}: {date} @ {time}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-semibold">
              {post.selectedPlatforms.length} Channels
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveSchedule}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all shadow-xs cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>
              Confirm Schedule
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
