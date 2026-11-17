import React, { useState } from "react";
import { Check, Copy, Download, MessageCircle, Loader2 } from "lucide-react";
import { Language } from "../constants/translations";
import { completeManualPost, ApiError } from "../lib/api";

/**
 * Manual-action card — WhatsApp Status (no API).
 *
 * WhatsApp has no official Status-posting endpoint, so this step finishes by
 * hand: the media is ready to download, the caption is one tap from the
 * clipboard, and "Mark as posted" closes the loop once MS taps Post in the
 * WhatsApp app on his phone.
 */
interface ManualActionCardProps {
  workspaceId: string;
  contentId: string;
  platformPostId: string;
  note: string;
  mediaUrls: string[];
  caption: string;
  lang: Language;
  onMarkedPosted: () => void;
}

export const ManualActionCard: React.FC<ManualActionCardProps> = ({
  workspaceId,
  contentId,
  platformPostId,
  note,
  mediaUrls,
  caption,
  lang,
  onMarkedPosted,
}) => {
  const [copied, setCopied] = useState(false);
  const [marking, setMarking] = useState(false);
  const [marked, setMarked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard unavailable — user can select the text manually
    }
  };

  const markPosted = async () => {
    setMarking(true);
    setError(null);
    try {
      await completeManualPost(workspaceId, contentId, platformPostId);
      setMarked(true);
      onMarkedPosted();
    } catch (e) {
      // The worker may not have marked the post yet — retry in a few seconds.
      setError(
        e instanceof ApiError
          ? e.message
          : "Could not mark it posted yet — wait a few seconds and try again."
      );
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/40 text-xs">
      <div className="flex items-center gap-2 font-semibold text-emerald-900 dark:text-emerald-200">
        <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
        <span>
          {lang === "ur" ? "واٹس ایپ اسٹیٹس — آپ کے فون سے" : "WhatsApp Status — from your phone"}
        </span>
      </div>
      <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-1.5 leading-relaxed">{note}</p>

      <div className="flex flex-wrap gap-2 mt-3">
        {mediaUrls.map((url, i) => (
          <a
            key={url}
            href={url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {lang === "ur" ? "میڈیا ڈاؤن لوڈ کریں" : `Download media${mediaUrls.length > 1 ? ` ${i + 1}` : ""}`}
            </span>
          </a>
        ))}
        <button
          type="button"
          onClick={copyCaption}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Copied" : lang === "ur" ? "کیپشن کاپی کریں" : "Copy caption"}</span>
        </button>
      </div>

      {error && <p className="text-[11px] text-red-600 dark:text-red-400 mt-2">{error}</p>}

      <button
        type="button"
        onClick={markPosted}
        disabled={marking || marked}
        className="mt-3 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-colors cursor-pointer"
      >
        {marking ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Marking…</span>
          </>
        ) : marked ? (
          <>
            <Check className="w-3.5 h-3.5" />
            <span>{lang === "ur" ? "پوسٹ ہو گیا!" : "Marked as posted!"}</span>
          </>
        ) : (
          <span>{lang === "ur" ? "میں نے اسٹیٹس لگا دیا — مکمل کریں" : "I posted the Status — mark it done"}</span>
        )}
      </button>
    </div>
  );
};
