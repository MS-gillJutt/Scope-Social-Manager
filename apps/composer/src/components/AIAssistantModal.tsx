import React, { useState } from "react";
import { TRANSLATIONS } from "../constants/translations";
import { Sparkles, Check, X, Loader2, Copy } from "lucide-react";
import { MediaAttachment } from "../types";
import { optimizeCaption } from "../lib/api";

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCaption: string;
  media?: MediaAttachment;
  onApplyVariation: (text: string) => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  currentCaption,
  media,
  onApplyVariation,
}) => {
  const t = TRANSLATIONS.en;
  const [tone, setTone] = useState("engaging");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    tiktok?: string;
    facebook?: string;
    whatsapp?: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<
    "linkedin" | "twitter" | "instagram" | "tiktok" | "facebook" | "whatsapp"
  >("linkedin");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const data = await optimizeCaption({
        content: currentCaption || "Excited to share our brand new updates and insights!",
        mediaType: media?.type || "none",
        tone,
        language: "en",
      });
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyText = (key: string, text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                {t.aiAssistantTitle}
              </h3>
              <p className="text-xs text-neutral-500">{t.aiAssistantDesc}</p>
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
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Tone Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Voice & Tone:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "engaging", label: "Engaging & Viral" },
                { id: "professional", label: "Professional" },
                { id: "storytelling", label: "Storytelling" },
                { id: "casual", label: "Short & Punchy" },
              ].map((tOption) => (
                <button
                  key={tOption.id}
                  type="button"
                  onClick={() => setTone(tOption.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    tone === tOption.id
                      ? "bg-purple-600 text-white"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  {tOption.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trigger Generate Button */}
          {!results && (
            <div className="text-center py-6 space-y-3 bg-neutral-50 dark:bg-neutral-850 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
              <Sparkles className="w-8 h-8 text-purple-600 mx-auto animate-bounce" />
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">
Generate Platform-Perfect Variations with Gemini AI
                </p>
                <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1">
                  LinkedIn gets thought-leadership breaks; Twitter gets a 260-character hook; TikTok gets a viral video intro.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="px-5 py-2.5 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing & Tailoring...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Tailored Captions</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Results View */}
          {results && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
                  {(["linkedin", "twitter", "instagram", "tiktok", "facebook", "whatsapp"] as const).map(
                    (p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setActiveTab(p)}
                        className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-all ${
                          activeTab === p
                            ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs"
                            : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="text-xs text-purple-600 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Regenerate</span>
                </button>
              </div>

              {/* Active Tab Content */}
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold capitalize text-neutral-700 dark:text-neutral-300">
                    {activeTab} Optimized Draft
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    {results[activeTab]?.length || 0} chars
                  </span>
                </div>

                <div className="text-xs text-neutral-900 dark:text-neutral-100 whitespace-pre-line leading-relaxed max-h-52 overflow-y-auto bg-white dark:bg-neutral-900 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800">
                  {results[activeTab]}
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => copyText(activeTab, results[activeTab])}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md transition-colors"
                  >
                    {copiedKey === activeTab ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === activeTab ? t.copied : "Copy"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (results[activeTab]) {
                        onApplyVariation(results[activeTab]!);
                        onClose();
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs px-4 py-1.5 font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.applyVariation}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
