import React, { useEffect, useState } from "react";
import { PlatformId, PlatformResult, SocialPost } from "../types";
import { TRANSLATIONS } from "../constants/translations";
import { PLATFORMS } from "../constants/platforms";
import {
  CheckCircle2,
  Copy,
  Check,
  Send,
  Loader2,
  X,
  Sparkles,
  AlertCircle,
  Clock,
  Smartphone,
} from "lucide-react";
import {
  ApiError,
  createContent,
  getContent,
  uploadMedia,
} from "../lib/api";
import { ManualActionCard } from "./ManualActionCard";

/**
 * Publish modal — REAL publishing (replaces the old clipboard + open-tabs flow).
 *
 * 1. Uploads the picked media file to the API (R2) if it is not uploaded yet.
 * 2. POSTs the post to the API, which creates the ContentItem + one
 *    PlatformPost per platform and enqueues a real publish job per post.
 *    The workers call the platform APIs (Facebook Graph, Instagram Graph,
 *    TikTok Content Posting API, ...).
 * 3. Polls the post until every platform reaches a terminal state:
 *    PUBLISHED (with a link), NEEDS_MANUAL_ACTION (WhatsApp Status — shows
 *    the manual-action card), FAILED (with the error), or the poll times out
 *    (the Queue tab keeps the live state).
 * Platforms without a connected account are reported, not silently skipped.
 */

type ResultStatus = "queued" | "published" | "action_needed" | "failed" | "not-connected" | "not-supported";

interface ResultEntry {
  status: ResultStatus;
  url?: string | null;
  error?: string | null;
  platformPostId?: string;
  manualActionNote?: string;
  mediaUrls?: string[];
}

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: SocialPost;
  onPostPublished: (post: SocialPost) => void;
  workspaceId: string;
}

const toApiPlatform = (pid: PlatformId): string => pid.toUpperCase();
const toComposerPlatform = (apiPlatform: string): PlatformId =>
  apiPlatform.toLowerCase() as PlatformId;

export const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  onClose,
  post,
  onPostPublished,
  workspaceId,
}) => {
  const t = TRANSLATIONS.en;
  const [results, setResults] = useState<Record<PlatformId, ResultEntry>>({} as Record<PlatformId, ResultEntry>);
  const [phase, setPhase] = useState<"idle" | "uploading" | "publishing" | "polling" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [contentItemId, setContentItemId] = useState<string | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const initial = {} as Record<PlatformId, ResultEntry>;
      post.selectedPlatforms.forEach((p) => {
        initial[p] = { status: "queued" };
      });
      setResults(initial);
      setPhase("idle");
      setError(null);
      setContentItemId(null);
    }
  }, [isOpen, post.selectedPlatforms]);

  if (!isOpen) return null;

  const fullText = `${post.caption}\n\n${post.hashtags.join(" ")}`.trim();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2500);
    } catch {
      // ignore
    }
  };

  const startPublish = async () => {
    setError(null);
    setPhase("uploading");
    try {
      // 1. Media upload (only if the file is picked and not uploaded yet).
      let mediaAssetIds: string[] = [];
      if (post.media?.mediaAssetId) {
        mediaAssetIds = [post.media.mediaAssetId];
      } else if (post.media?.file) {
        const uploaded = await uploadMedia(workspaceId, post.media.file);
        mediaAssetIds = [uploaded.mediaAssetId];
      }

      // 2. Create the post + enqueue real publish jobs.
      setPhase("publishing");
      const contentType =
        post.media?.type === "video" ? "VIDEO" : post.media?.type === "image" ? "IMAGE" : "TEXT";
      const created = await createContent(workspaceId, {
        caption: post.caption,
        hashtags: post.hashtags.map((h) => h.replace(/^#/, "")),
        contentType,
        mediaAssetIds,
        platforms: post.selectedPlatforms.map(toApiPlatform),
        publishNow: true,
      });
      setContentItemId(created.contentItemId);

      const next: Record<PlatformId, ResultEntry> = { ...results };
      for (const s of created.skipped) {
        const pid = toComposerPlatform(s.platform);
        next[pid] = {
          status: s.reason === "not-connected" ? "not-connected" : "not-supported",
          error:
            s.reason === "not-connected"
              ? "No account connected — connect it in Settings first."
              : "This platform has no publishing integration yet.",
        };
      }
      for (const p of created.posts) {
        const pid = toComposerPlatform(p.platform);
        next[pid] = { status: "queued", platformPostId: p.id };
      }
      setResults(next);

      // 3. Poll until every platform is terminal (max ~30s).
      setPhase("polling");
      const createdIds = new Set(created.posts.map((p) => p.id));
      for (let attempt = 0; attempt < 12; attempt++) {
        await new Promise((res) => setTimeout(res, 2500));
        const detail = await getContent(workspaceId, created.contentItemId);
        const polled: Record<PlatformId, ResultEntry> = { ...next };
        let allTerminal = true;
        for (const pp of detail.platformPosts) {
          if (!createdIds.has(pp.id)) continue;
          const pid = toComposerPlatform(pp.platform);
          const manual = (pp.manualAction ?? null) as {
            requiresManualAction?: boolean;
            manualActionNote?: string;
            mediaUrls?: string[];
          } | null;
          if (pp.status === "PUBLISHED") {
            polled[pid] = { status: "published", url: pp.platformPostUrl, platformPostId: pp.id };
          } else if (pp.status === "NEEDS_MANUAL_ACTION") {
            polled[pid] = {
              status: "action_needed",
              platformPostId: pp.id,
              manualActionNote: manual?.manualActionNote ?? "",
              mediaUrls: manual?.mediaUrls ?? [],
            };
          } else if (pp.status === "FAILED") {
            polled[pid] = { status: "failed", platformPostId: pp.id, error: pp.errorMessage };
          } else {
            allTerminal = false;
          }
        }
        setResults(polled);
        // Keep the latest map for the next round.
        Object.assign(next, polled);
        if (allTerminal) break;
      }

      setPhase("done");
      const platformResults: PlatformResult[] = post.selectedPlatforms.map((pid) => {
        const r = next[pid] ?? { status: "queued" };
        return {
          platform: pid,
          status:
            r.status === "published"
              ? "PUBLISHED"
              : r.status === "action_needed"
                ? "NEEDS_MANUAL_ACTION"
                : r.status === "failed"
                  ? "FAILED"
                  : "QUEUED",
          platformPostId: r.platformPostId,
          platformPostUrl: r.url ?? null,
          errorMessage: r.error ?? null,
          manualActionNote: r.manualActionNote,
          mediaUrls: r.mediaUrls,
        };
      });
      onPostPublished({
        ...post,
        id: created.contentItemId,
        status: "published",
        publishedAt: new Date().toISOString(),
        publishedPlatforms: post.selectedPlatforms.filter(
          (pid) => next[pid]?.status === "published" || next[pid]?.status === "action_needed"
        ),
        platformResults,
      });
    } catch (e) {
      setPhase("error");
      setError(e instanceof ApiError ? e.message : "Publishing failed. Please try again.");
    }
  };

  const busy = phase === "uploading" || phase === "publishing" || phase === "polling";
  const done = phase === "done";

  const statusLabel = (r: ResultEntry): string => {
    switch (r.status) {
      case "published":
        return "Published";
      case "action_needed":
        return "Needs your phone";
      case "failed":
        return "Failed";
      case "not-connected":
        return "Not connected";
      case "not-supported":
        return "Not supported";
      default:
        return phase === "idle" ? "Queued" : "Publishing…";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                {done ? t.publishedSuccess : "Publish to Selected Channels"}
              </h3>
              <p className="text-xs text-neutral-500">
                {post.selectedPlatforms.length} {t.targetPlatforms.toLowerCase()}
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

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Quick Copy */}
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <span className="line-clamp-1 font-medium">{post.caption || "Ready to publish"}</span>
            </div>
            <button
              type="button"
              onClick={copyToClipboard}
              className="flex items-center gap-1 text-xs px-2.5 py-1 font-medium bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-md border border-neutral-200 dark:border-neutral-700 shrink-0 transition-colors"
            >
              {copiedCaption ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedCaption ? t.copied : t.copyPostData}</span>
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Platform Status List */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              Platform Status:
            </p>

            <div className="divide-y divide-neutral-100 dark:divide-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
              {post.selectedPlatforms.map((pid) => {
                const conf = PLATFORMS.find((p) => p.id === pid);
                const r = results[pid] ?? { status: "queued" as const };

                return (
                  <div key={pid} className="p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-neutral-900 dark:text-white">
                          {conf?.name}
                        </span>
                        {post.media && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 uppercase">
                            {post.media.type}
                          </span>
                        )}
                        {conf?.manualOnly && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">
                            Manual
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {r.status === "queued" && phase !== "idle" && (
                          <div className="flex items-center gap-1.5 text-blue-600 text-xs">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>{statusLabel(r)}</span>
                          </div>
                        )}
                        {r.status === "published" && (
                          <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            {r.url ? (
                              <a
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                              >
                                Published — view
                              </a>
                            ) : (
                              <span>Published</span>
                            )}
                          </div>
                        )}
                        {r.status === "action_needed" && (
                          <div className="flex items-center gap-1.5 text-amber-600 text-xs font-medium">
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>{statusLabel(r)}</span>
                          </div>
                        )}
                        {r.status === "failed" && (
                          <span className="text-red-600 text-xs font-medium">
                            Failed{r.error ? ` — ${r.error}` : ""}
                          </span>
                        )}
                        {(r.status === "not-connected" || r.status === "not-supported") && (
                          <span className="text-amber-600 text-xs font-medium">{statusLabel(r)}</span>
                        )}
                        {r.status === "queued" && phase === "idle" && (
                          <span className="text-neutral-400 text-xs">Queued</span>
                        )}
                      </div>
                    </div>

                    {/* WhatsApp manual-action card, inline */}
                    {r.status === "action_needed" && contentItemId && r.platformPostId && (
                      <div className="mt-3">
                        <ManualActionCard
                          workspaceId={workspaceId}
                          contentId={contentItemId}
                          platformPostId={r.platformPostId}
                          note={r.manualActionNote ?? ""}
                          mediaUrls={r.mediaUrls ?? []}
                          caption={fullText}
                          onMarkedPosted={() => {
                            setResults((prev) => ({
                              ...prev,
                              [pid]: { ...prev[pid], status: "published" },
                            }));
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-publishing note */}
          <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <p className="font-semibold">Real publishing:</p>
              <p className="text-[11px] text-blue-800 dark:text-blue-300 mt-0.5 leading-relaxed">
Posts publish through the real platform APIs from your connected accounts. WhatsApp Status has no API — post it from your phone with the card above.
              </p>
            </div>
          </div>

          {done && (
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 flex items-start gap-2">
              <Clock className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
Platforms still queued will update in the Queue tab as soon as the worker finishes them.
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 flex flex-wrap items-center justify-end gap-3">
          {done ? (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
            >
              Done
            </button>
          ) : (
            <button
              type="button"
              onClick={startPublish}
              disabled={busy}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-all shadow-xs cursor-pointer"
            >
              {busy ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>
                    {phase === "uploading"
                      ? "Uploading media…"
                      : phase === "publishing"
                      ? t.publishingProgress
                      : "Waiting for platforms…"}
                  </span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{t.publishNowBtn}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
