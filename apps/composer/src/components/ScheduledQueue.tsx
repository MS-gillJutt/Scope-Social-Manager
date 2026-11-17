import React, { useState } from "react";
import { PlatformId, SocialPost } from "../types";
import { Language, TRANSLATIONS } from "../constants/translations";
import { PLATFORMS } from "../constants/platforms";
import {
  Calendar,
  Clock,
  Trash2,
  Send,
  Edit,
  CheckCircle2,
  FileText,
  AlertCircle,
  Video,
  Image as ImageIcon,
} from "lucide-react";

interface ScheduledQueueProps {
  posts: SocialPost[];
  onDeletePost: (id: string) => void;
  onPublishPostNow: (post: SocialPost) => void;
  onEditPost: (post: SocialPost) => void;
  lang: Language;
}

export const ScheduledQueue: React.FC<ScheduledQueueProps> = ({
  posts,
  onDeletePost,
  onPublishPostNow,
  onEditPost,
  lang,
}) => {
  const t = TRANSLATIONS[lang];
  const [filter, setFilter] = useState<"all" | "scheduled" | "published" | "draft">("all");

  const filteredPosts = posts.filter((p) => {
    if (filter === "all") return true;
    return p.status === filter;
  });

  const getPlatformName = (id: PlatformId) => {
    const found = PLATFORMS.find((p) => p.id === id);
    return lang === "ur" ? found?.nameUrdu || id : found?.name || id;
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>{t.queueTitle}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
              {posts.length}
            </span>
          </h3>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg text-xs">
          {[
            { id: "all", label: "All", labelUrdu: "تمام" },
            { id: "scheduled", label: t.statusScheduled, labelUrdu: "شیڈولڈ" },
            { id: "published", label: t.statusPublished, labelUrdu: "شائع شدہ" },
            { id: "draft", label: t.statusDraft, labelUrdu: "ڈرافٹس" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id as any)}
              className={`px-3 py-1 font-medium rounded-md transition-all capitalize ${
                filter === item.id
                  ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs"
                  : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              }`}
            >
              {lang === "ur" ? item.labelUrdu : item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Post List */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-10 px-4 bg-neutral-50 dark:bg-neutral-850 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
          <Calendar className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
          <p className="text-xs text-neutral-500">{t.noScheduledPosts}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => {
            const isScheduled = post.status === "scheduled";
            const isPublished = post.status === "published";

            return (
              <div
                key={post.id}
                className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-850/60 shadow-2xs transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {/* Status Badge */}
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        isScheduled
                          ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900"
                          : isPublished
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                      }`}
                    >
                      {isScheduled && <Clock className="w-3 h-3" />}
                      {isPublished && <CheckCircle2 className="w-3 h-3" />}
                      <span>
                        {isScheduled
                          ? t.statusScheduled
                          : isPublished
                          ? t.statusPublished
                          : t.statusDraft}
                      </span>
                    </span>

                    {/* Scheduled or Created Time */}
                    <span className="text-xs text-neutral-500">
                      {isScheduled && post.scheduledFor
                        ? `${t.scheduledAt}: ${new Date(
                            post.scheduledFor
                          ).toLocaleString()}`
                        : `Created: ${new Date(post.createdAt).toLocaleDateString()}`}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {isScheduled && (
                      <button
                        type="button"
                        onClick={() => onPublishPostNow(post)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                        title={t.publishNow}
                      >
                        <Send className="w-3 h-3" />
                        <span>{t.publishNow}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onEditPost(post)}
                      className="p-1.5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                      title={t.edit}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeletePost(post.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors"
                      title={t.delete}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content snippet */}
                <div className="text-xs text-neutral-800 dark:text-neutral-200 line-clamp-2 leading-relaxed">
                  {post.caption}
                </div>

                {/* Hashtags and Media Tag */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-neutral-400 font-medium">
                      Platforms:
                    </span>
                    {post.selectedPlatforms.map((pid) => (
                      <span
                        key={pid}
                        className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium"
                      >
                        {getPlatformName(pid)}
                      </span>
                    ))}
                  </div>

                  {post.media && (
                    <div className="flex items-center gap-1 text-neutral-500 font-medium">
                      {post.media.type === "image" ? (
                        <ImageIcon className="w-3 h-3 text-blue-500" />
                      ) : (
                        <Video className="w-3 h-3 text-purple-500" />
                      )}
                      <span>
                        {post.media.type.toUpperCase()} ({post.media.size})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
