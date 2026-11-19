import React, { useRef, useState } from "react";
import { MediaAttachment, PlatformId } from "../types";
import { TRANSLATIONS } from "../constants/translations";
import { PLATFORMS } from "../constants/platforms";
import {
  Image as ImageIcon,
  Video as VideoIcon,
  UploadCloud,
  X,
  Sparkles,
  AlertTriangle,
  FileCheck,
  Play,
} from "lucide-react";

interface PostComposerProps {
  caption: string;
  onChangeCaption: (text: string) => void;
  media?: MediaAttachment;
  onChangeMedia: (media?: MediaAttachment) => void;
  selectedPlatforms: PlatformId[];
  onOpenAIAssistant: () => void;
}

export const PostComposer: React.FC<PostComposerProps> = ({
  caption,
  onChangeCaption,
  media,
  onChangeMedia,
  selectedPlatforms,
  onOpenAIAssistant,
}) => {
  const t = TRANSLATIONS.en;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate platform character warnings
  const warnings = PLATFORMS.filter(
    (p) => selectedPlatforms.includes(p.id) && caption.length > p.charLimit
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const isVid = file.type.startsWith("video/");
    const isImg = file.type.startsWith("image/");

    if (!isVid && !isImg) {
      alert("Please upload a supported image or video file (JPG, PNG, WebP, MP4, WebM)");
      return;
    }

    const url = URL.createObjectURL(file);
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);

    const attachment: MediaAttachment = {
      type: isVid ? "video" : "image",
      url,
      name: file.name,
      size: `${sizeInMb} MB`,
      mimeType: file.type,
      // Keep the File itself so the composer can upload it to the API on publish.
      file,
    };

    if (isVid) {
      // Calculate video duration
      const tempVideo = document.createElement("video");
      tempVideo.src = url;
      tempVideo.onloadedmetadata = () => {
        attachment.duration = Math.round(tempVideo.duration);
        onChangeMedia({ ...attachment });
      };
    } else {
      onChangeMedia(attachment);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-xs space-y-4">
      {/* Header with Title and AI Action */}
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor="post-caption-textarea"
          className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2"
        >
          <span>{t.captionLabel}</span>
          <span className="text-xs font-normal text-neutral-500">
            ({caption.length} {t.characterLimit})
          </span>
        </label>

        <button
          type="button"
          onClick={onOpenAIAssistant}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg border border-purple-200 dark:border-purple-800/60 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>{t.aiAssistantTitle}</span>
        </button>
      </div>

      {/* Main Caption Textarea */}
      <div className="relative">
        <textarea
          id="post-caption-textarea"
          rows={6}
          value={caption}
          onChange={(e) => onChangeCaption(e.target.value)}
          placeholder={t.captionPlaceholder}
          className="w-full text-sm leading-relaxed p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-750 bg-white dark:bg-neutral-850 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all resize-y"
        />

        {/* Character Limit Alerts */}
        {warnings.length > 0 && (
          <div className="mt-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium">
                {t.overLimitWarning}:{" "}
                {warnings.map((w) => `${w.name} (max ${w.charLimit})`).join(", ")}
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                Tip: Use the AI Optimizer to automatically trim for Twitter/X while keeping the full post for LinkedIn & Facebook!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Media Attachment Section (Image or Video) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-neutral-800 dark:text-neutral-200">
          <span className="flex items-center gap-1.5">
            <UploadCloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{t.addMedia}</span>
          </span>
          <span className="font-normal text-neutral-400 text-[11px]">
            {t.mediaSupportNote}
          </span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {!media ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30"
                : "border-neutral-200 dark:border-neutral-800 hover:border-blue-400 dark:hover:border-blue-500 bg-neutral-50/50 dark:bg-neutral-850/50"
            }`}
          >
            <div className="flex justify-center items-center gap-2 mb-2 text-neutral-400">
              <div className="p-2 rounded-full bg-white dark:bg-neutral-800 shadow-xs border border-neutral-100 dark:border-neutral-700">
                <ImageIcon className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-neutral-300 dark:text-neutral-700">+</span>
              <div className="p-2 rounded-full bg-white dark:bg-neutral-800 shadow-xs border border-neutral-100 dark:border-neutral-700">
                <VideoIcon className="w-5 h-5 text-purple-500" />
              </div>
            </div>
            <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200 mb-1">
              {t.dragDropMedia}
            </p>
            <p className="text-[11px] text-neutral-400">
              Instagram & TikTok will automatically detect images or vertical video reels
            </p>
          </div>
        ) : (
          <div className="relative rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 p-3 flex flex-col sm:flex-row gap-4 items-center">
            {/* Media Preview Box */}
            <div className="relative w-full sm:w-48 h-36 bg-black rounded-lg overflow-hidden flex items-center justify-center shrink-0">
              {media.type === "image" ? (
                <img
                  src={media.url}
                  alt={media.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  src={media.url}
                  controls
                  className="w-full h-full object-contain"
                />
              )}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-medium text-white flex items-center gap-1">
                {media.type === "image" ? (
                  <ImageIcon className="w-3 h-3 text-blue-400" />
                ) : (
                  <VideoIcon className="w-3 h-3 text-purple-400" />
                )}
                <span className="uppercase">{media.type}</span>
              </div>
            </div>

            {/* Media Metadata & Controls */}
            <div className="flex-1 w-full space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate max-w-[220px] sm:max-w-xs">
                    {media.name}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-neutral-500 mt-0.5">
                    <span>Size: {media.size}</span>
                    {media.duration && <span>Duration: {media.duration}s</span>}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onChangeMedia(undefined)}
                  className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                  title={t.removeMedia}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-neutral-200/60 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs px-3 py-1 font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md border border-neutral-200 dark:border-neutral-700 transition-colors"
                >
                  {t.changeMedia}
                </button>
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Ready for 1-Click Multi-Posting</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
