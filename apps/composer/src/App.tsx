/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Scope Social Manager — composer (personal version for MS).
 * MultiPost Hub UI, wired to the real backend: posts live in the API
 * (ContentItem + PlatformPost + PublishJob), publishing goes through the
 * workers and the real platform APIs, WhatsApp Status is a manual step.
 * Nothing here posts by clipboard or by opening tabs any more.
 */

import React, { useCallback, useEffect, useState } from "react";
import { MediaAttachment, PlatformId, PlatformResult, SocialPost, UserSettings } from "./types";
import { Language, TRANSLATIONS } from "./constants/translations";
import { PLATFORMS } from "./constants/platforms";
import { Navbar } from "./components/Navbar";
import { PlatformSelector } from "./components/PlatformSelector";
import { PostComposer } from "./components/PostComposer";
import { HashtagManager } from "./components/HashtagManager";
import { PlatformPreview } from "./components/PlatformPreview";
import { PublishModal } from "./components/PublishModal";
import { SchedulerModal } from "./components/SchedulerModal";
import { AIAssistantModal } from "./components/AIAssistantModal";
import { ScheduledQueue } from "./components/ScheduledQueue";
import { ZeroBudgetGuideModal } from "./components/ZeroBudgetGuideModal";
import { SettingsModal } from "./components/SettingsModal";
import {
  Send,
  Calendar,
  Save,
  CheckCircle2,
  Sparkles,
  Zap,
  RotateCcw,
  LogIn,
  Link2,
  Unlink,
  Loader2,
} from "lucide-react";
import {
  ApiError,
  apiFetch,
  completeManualPost,
  connectAccount,
  createContent,
  createWorkspace,
  deleteContent,
  disconnectAccount,
  getToken,
  listAccounts,
  listContent,
  listWorkspaces,
  login,
  login2FA,
  setToken,
  uploadMedia,
  type ApiContentItem,
  type ConnectedAccount,
  type Workspace,
} from "./lib/api";

const INITIAL_SETTINGS: UserSettings = {
  webhookUrl: "",
  defaultLanguage: "ur",
  authorName: "Muhammad Shahid",
  socialHandles: {
    linkedin: "",
    tiktok: "",
    instagram: "",
    facebook: "",
    twitter: "",
    whatsapp: "",
  },
  autoCopyMediaLink: true,
};

/** MS's four: TikTok, Instagram, Facebook + WhatsApp Status. */
// MS rule (Nov 17, 2026): every platform starts CHECKED except LinkedIn
// (professional only) and any platform not wired yet. The default comes from
// each platform's `defaultSelected` flag in constants/platforms.ts — so a
// new platform joins the default set just by setting defaultSelected: true.
const DEFAULT_PLATFORMS: PlatformId[] = PLATFORMS.filter(
  (p) => p.defaultSelected !== false
).map((p) => p.id);

const toComposerPlatform = (apiPlatform: string): PlatformId =>
  apiPlatform.toLowerCase() as PlatformId;

function mapApiPost(item: ApiContentItem): SocialPost | null {
  if (item.status === "ARCHIVED") return null;
  const media = item.media[0];
  const status =
    item.status === "DRAFT"
      ? "draft"
      : item.status === "SCHEDULED"
      ? "scheduled"
      : item.status === "FAILED"
      ? "failed"
      : "published";
  const platformResults: PlatformResult[] = item.platformPosts.map((p) => {
    const manual = (p.manualAction ?? null) as {
      manualActionNote?: string;
      mediaUrls?: string[];
    } | null;
    return {
      platform: toComposerPlatform(p.platform),
      status: p.status,
      platformPostId: p.id,
      platformPostUrl: p.platformPostUrl,
      errorMessage: p.errorMessage,
      manualActionNote: manual?.manualActionNote,
      mediaUrls: manual?.mediaUrls,
    };
  });
  return {
    id: item.id,
    createdAt: item.createdAt,
    caption: item.caption ?? "",
    hashtags: item.tags.map((t) => `#${t}`),
    media: media
      ? {
          type: media.mediaType === "VIDEO" ? "video" : "image",
          url: media.url,
          name: media.storageKey.split("/").pop() ?? "media",
          size: "",
          mimeType: media.mimeType,
          mediaAssetId: media.id,
        }
      : undefined,
    selectedPlatforms: item.platformPosts.map((p) => toComposerPlatform(p.platform)),
    scheduledFor: item.publishAt ?? undefined,
    status,
    publishedAt: item.platformPosts.find((p) => p.publishedAt)?.publishedAt ?? undefined,
    publishedPlatforms: item.platformPosts
      .filter((p) => p.status === "PUBLISHED")
      .map((p) => toComposerPlatform(p.platform)),
    platformResults,
  };
}

export default function App() {
  // Persistence (UI prefs only — posts live in the API now)
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("omnipost_lang");
    return (saved as Language) || "ur";
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem("omnipost_settings");
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // Backend state
  const [authed, setAuthed] = useState<boolean>(() => getToken() !== null);
  const [authChecked, setAuthChecked] = useState(false);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);
  const [twoFaTempToken, setTwoFaTempToken] = useState<string | null>(null);
  const [twoFaCode, setTwoFaCode] = useState("");

  // Current Working Draft
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [media, setMedia] = useState<MediaAttachment | undefined>(undefined);
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformId[]>(DEFAULT_PLATFORMS);

  // View state
  const [activeView, setActiveView] = useState<"composer" | "queue">("composer");

  // Modals state
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [schedulerModalOpen, setSchedulerModalOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Alert toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const loadPosts = useCallback(
    async (wsId: string) => {
      setLoadingPosts(true);
      try {
        const items = await listContent(wsId);
        setPosts(items.map(mapApiPost).filter((p): p is SocialPost => p !== null));
      } catch (e) {
        console.error("Failed to load posts:", e);
      } finally {
        setLoadingPosts(false);
      }
    },
    []
  );

  const loadAccounts = useCallback(async (wsId: string) => {
    try {
      setAccounts(await listAccounts(wsId));
    } catch (e) {
      console.error("Failed to load accounts:", e);
    }
  }, []);

  // Bootstrap: verify the token, pick the workspace, load posts + accounts.
  useEffect(() => {
    (async () => {
      try {
        await apiFetch("/api/auth/me");
        const workspaces = await listWorkspaces();
        if (workspaces.length === 0) {
          // Personal version: create the one workspace automatically.
          const created = await createWorkspace("My Workspace");
          setWorkspace(created);
          await loadPosts(created.id);
          await loadAccounts(created.id);
        } else {
          const first = workspaces[0];
          if (!first) throw new Error("No workspace");
          setWorkspace(first);
          await loadPosts(first.id);
          await loadAccounts(first.id);
        }
        setAuthed(true);
      } catch {
        setToken(null);
        setAuthed(false);
      } finally {
        setAuthChecked(true);
      }
    })();
  }, [loadPosts, loadAccounts]);

  // OAuth callback redirects back here with ?connected= / ?connect_error=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const connectError = params.get("connect_error");
    if (connected && workspace) {
      showToast(
        lang === "ur"
          ? `${connected} اکاؤنٹ کنیکٹ ہو گیا!`
          : `${connected} account connected!`
      );
      void loadAccounts(workspace.id);
      window.history.replaceState({}, "", window.location.pathname);
    } else if (connectError) {
      showToast(`Connect failed: ${connectError}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [workspace, lang, loadAccounts, showToast]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem("omnipost_settings", JSON.stringify(settings));
  }, [settings]);

  // Save language to localStorage & adjust dir
  useEffect(() => {
    localStorage.setItem("omnipost_lang", lang);
    document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
  }, [lang]);

  const handleToggleLang = () => {
    setLang((prev) => (prev === "en" ? "ur" : "en"));
  };

  const handleLogin = async () => {
    setLoginError(null);
    setLoginBusy(true);
    try {
      if (twoFaTempToken) {
        await login2FA(twoFaTempToken, twoFaCode);
        setTwoFaTempToken(null);
        setTwoFaCode("");
      } else {
        const result = await login(loginEmail, loginPassword);
        if (result.requires2FA && result.tempToken) {
          setTwoFaTempToken(result.tempToken);
          setLoginBusy(false);
          return;
        }
      }
      setAuthed(true);
      window.location.reload();
    } catch (e) {
      setLoginError(e instanceof ApiError ? e.message : "Login failed. Check your email and password.");
    } finally {
      setLoginBusy(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setAuthed(false);
    setWorkspace(null);
    setPosts([]);
    setAccounts([]);
  };

  const currentDraftPost: SocialPost = {
    id: `post-${Date.now()}`,
    createdAt: new Date().toISOString(),
    caption,
    hashtags,
    media,
    selectedPlatforms,
    status: "draft",
  };

  const uploadDraftMedia = async (): Promise<string[]> => {
    if (!workspace) return [];
    if (media?.mediaAssetId) return [media.mediaAssetId];
    if (media?.file) {
      const uploaded = await uploadMedia(workspace.id, media.file);
      return [uploaded.mediaAssetId];
    }
    return [];
  };

  const handleSaveDraft = async () => {
    if (!workspace) return;
    try {
      const mediaAssetIds = await uploadDraftMedia();
      await createContent(workspace.id, {
        caption,
        hashtags: hashtags.map((h) => h.replace(/^#/, "")),
        contentType: media?.type === "video" ? "VIDEO" : media?.type === "image" ? "IMAGE" : "TEXT",
        mediaAssetIds,
        platforms: selectedPlatforms.map((p) => p.toUpperCase()),
        publishNow: false,
      });
      await loadPosts(workspace.id);
      showToast(lang === "ur" ? "ڈرافٹ کامیابی سے محفوظ ہو گیا!" : "Draft saved successfully!");
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "Could not save the draft.");
    }
  };

  const handleSchedulePost = async (scheduledPost: SocialPost) => {
    if (!workspace) return;
    try {
      const mediaAssetIds = await uploadDraftMedia();
      await createContent(workspace.id, {
        caption: scheduledPost.caption,
        hashtags: scheduledPost.hashtags.map((h) => h.replace(/^#/, "")),
        contentType: media?.type === "video" ? "VIDEO" : media?.type === "image" ? "IMAGE" : "TEXT",
        mediaAssetIds,
        platforms: scheduledPost.selectedPlatforms.map((p) => p.toUpperCase()),
        publishAt: scheduledPost.scheduledFor,
        publishNow: true,
      });
      await loadPosts(workspace.id);
      showToast(
        lang === "ur"
          ? `پوسٹ مقررہ وقت پر شیڈول ہو گئی! (${new Date(
              scheduledPost.scheduledFor || ""
            ).toLocaleString()})`
          : `Post scheduled for ${new Date(scheduledPost.scheduledFor || "").toLocaleString()}!`
      );
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "Could not schedule the post.");
    }
  };

  const handlePostPublished = async () => {
    if (!workspace) return;
    await loadPosts(workspace.id);
    await loadAccounts(workspace.id);
  };

  const handleDeletePost = async (id: string) => {
    if (!workspace) return;
    try {
      await deleteContent(workspace.id, id);
      await loadPosts(workspace.id);
      showToast(lang === "ur" ? "پوسٹ حذف ہو گئی" : "Post deleted");
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "Could not delete the post.");
    }
  };

  const handlePublishPostNowFromQueue = async (post: SocialPost) => {
    // Re-publishing an existing item would double-post it, so archive the
    // old item first (this also cancels its scheduled jobs), then publish
    // the same text/media as a fresh post.
    if (workspace && !post.id.startsWith("post-")) {
      try {
        await deleteContent(workspace.id, post.id);
      } catch {
        // keep going — the draft load below still works
      }
    }
    setCaption(post.caption);
    setHashtags(post.hashtags);
    setMedia(post.media);
    setSelectedPlatforms(post.selectedPlatforms);
    setActiveView("composer");
    setPublishModalOpen(true);
  };

  const handleEditPostFromQueue = (post: SocialPost) => {
    setCaption(post.caption);
    setHashtags(post.hashtags);
    setMedia(post.media);
    setSelectedPlatforms(post.selectedPlatforms);
    setActiveView("composer");
    showToast(lang === "ur" ? "پوسٹ ایڈیٹر میں لوڈ ہو گئی" : "Post loaded into editor");
  };

  const handleResetForm = () => {
    setCaption("");
    setHashtags([]);
    setMedia(undefined);
    setSelectedPlatforms(DEFAULT_PLATFORMS);
  };

  const handleConnect = async (platform: PlatformId) => {
    if (!workspace) return;
    try {
      const { authUrl } = await connectAccount(workspace.id, platform.toUpperCase());
      window.open(authUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "Could not start the connect flow.");
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!workspace) return;
    try {
      await disconnectAccount(workspace.id, accountId);
      await loadAccounts(workspace.id);
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "Could not disconnect the account.");
    }
  };

  const handleMarkPostedFromQueue = async (post: SocialPost, platformPostId: string) => {
    if (!workspace) return;
    try {
      await completeManualPost(workspace.id, post.id, platformPostId);
      await loadPosts(workspace.id);
      showToast(lang === "ur" ? "اسٹیٹس مکمل نشان زد ہو گیا!" : "Status marked as posted!");
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "Could not mark it posted yet.");
    }
  };

  const scheduledCount = posts.filter((p) => p.status === "scheduled").length;
  const needsManual = posts.flatMap((post) =>
    (post.platformResults ?? [])
      .filter((r) => r.status === "NEEDS_MANUAL_ACTION")
      .map((r) => ({ post, result: r }))
  );

  // ---- Login gate (no token / token rejected) ----
  if (authChecked && !authed) {
    return (
      <div className="min-h-screen bg-neutral-100/70 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-sm p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold">Scope Social Manager</h1>
              <p className="text-xs text-neutral-500">Sign in to your workspace to post once, everywhere.</p>
            </div>
          </div>
          {twoFaTempToken ? (
            <>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Two-factor is on — enter the 6-digit code from your authenticator app.
              </p>
              <input
                type="text"
                inputMode="numeric"
                value={twoFaCode}
                onChange={(e) => setTwoFaCode(e.target.value)}
                placeholder="123456"
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none"
              />
            </>
          ) : (
            <>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none"
              />
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleLogin();
                }}
                placeholder="Password"
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none"
              />
            </>
          )}
          {loginError && <p className="text-xs text-red-600 dark:text-red-400">{loginError}</p>}
          <button
            type="button"
            onClick={() => void handleLogin()}
            disabled={loginBusy}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors cursor-pointer"
          >
            {loginBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            <span>{twoFaTempToken ? "Verify code" : "Sign in"}</span>
          </button>
          <p className="text-[11px] text-neutral-500 text-center">
            First time? Register in the API first (POST /auth/register), then sign in here.
          </p>
        </div>
      </div>
    );
  }

  if (!authChecked || !workspace) {
    return (
      <div className="min-h-screen bg-neutral-100/70 dark:bg-neutral-950 flex items-center justify-center font-sans">
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading your workspace…</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-neutral-100/70 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans"
      dir={lang === "ur" ? "rtl" : "ltr"}
    >
      {/* Navigation Header */}
      <Navbar
        lang={lang}
        onToggleLang={handleToggleLang}
        onOpenGuide={() => setGuideModalOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        scheduledCount={scheduledCount}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Floating Alert Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Banner — post once, everywhere */}
        <div className="mb-6 p-4 rounded-xl bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-xs">
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold">
                {lang === "ur"
                  ? "ایک بار لکھیں — ٹک ٹاک، انسٹاگرام، فیس بک اور واٹس ایپ اسٹیٹس پر ایک ساتھ پوسٹ کریں۔"
                  : "Write once — post to TikTok, Instagram, Facebook & WhatsApp Status together."}
              </p>
              <p className="text-[11px] text-white/80">
                {lang === "ur"
                  ? "اصلی پبلشنگ، آپ کے کنیکٹڈ اکاؤنٹس سے۔ واٹس ایپ اسٹیٹس فون سے لگتا ہے۔"
                  : "Real publishing from your connected accounts. WhatsApp Status goes from your phone."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setGuideModalOpen(true)}
            className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-white text-neutral-900 hover:bg-neutral-100 transition-colors shadow-2xs cursor-pointer"
          >
            {lang === "ur" ? "فری گائیڈ دیکھیں" : "View Free Setup"}
          </button>
        </div>

        {/* WhatsApp actions waiting on the phone */}
        {needsManual.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-xs space-y-2">
            <p className="font-semibold text-emerald-900 dark:text-emerald-200">
              {lang === "ur"
                ? "واٹس ایپ اسٹیٹس آپ کے فون کا انتظار کر رہا ہے:"
                : "WhatsApp Status waiting on your phone:"}
            </p>
            {needsManual.map(({ post, result }) => (
              <div key={result.platformPostId} className="flex flex-wrap items-center justify-between gap-2 text-emerald-800 dark:text-emerald-300">
                <span className="line-clamp-1">{post.caption || "Status"}</span>
                <button
                  type="button"
                  onClick={() => void handleMarkPostedFromQueue(post, result.platformPostId ?? "")}
                  disabled={!result.platformPostId}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-colors cursor-pointer"
                >
                  {lang === "ur" ? "میں نے اسٹیٹس لگا دیا" : "I posted the Status"}
                </button>
              </div>
            ))}
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
              {lang === "ur"
                ? "میڈیا اور کیپشن پبلش ونڈو میں تیار ہیں — واٹس ایپ کھولیں، Status → My Status، پھر یہاں مکمل کریں۔"
                : "Media + caption are ready in the publish window — open WhatsApp, Status → My Status, then mark it done here."}
            </p>
          </div>
        )}

        {activeView === "composer" ? (
          /* Two-Column Grid: Composer + Live Preview */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Platform selection, composer, media, hashtags */}
            <div className="lg:col-span-7 space-y-5">
              {/* Platform Selector */}
              <PlatformSelector
                selectedPlatforms={selectedPlatforms}
                onChange={setSelectedPlatforms}
                lang={lang}
                contentLength={caption.length}
              />

              {/* Connected accounts */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-xs space-y-2">
                <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {lang === "ur" ? "کنیکٹڈ اکاؤنٹس" : "Connected accounts"}
                </p>
                {selectedPlatforms.map((pid) => {
                  const conf = PLATFORMS.find((p) => p.id === pid);
                  const account = accounts.find(
                    (a) => a.platform.toLowerCase() === pid
                  );
                  if (conf?.manualOnly) {
                    return (
                      <div key={pid} className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-medium text-neutral-800 dark:text-neutral-200">
                          {lang === "ur" ? conf.nameUrdu : conf.name}
                        </span>
                        <span className="text-emerald-600 font-medium">
                          {lang === "ur" ? "کوئی لاگ ان نہیں — فون سے پوسٹ ہوتا ہے" : "No login needed — posted from your phone"}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div key={pid} className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {lang === "ur" ? conf?.nameUrdu : conf?.name}
                      </span>
                      {account ? (
                        <span className="flex items-center gap-2">
                          <span className="text-emerald-600 font-medium">
                            {account.accountName}
                            {account.status !== "ACTIVE" ? ` (${account.status})` : ""}
                          </span>
                          <button
                            type="button"
                            onClick={() => void handleDisconnect(account.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-red-600 transition-colors"
                          >
                            <Unlink className="w-3 h-3" />
                            <span>Disconnect</span>
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleConnect(pid)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
                        >
                          <Link2 className="w-3 h-3" />
                          <span>Connect {conf?.name}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
                <p className="text-[11px] text-neutral-500">
                  {lang === "ur"
                    ? "کنیکٹ کرنے پر پلیٹ فارم کی اپنی سائٹ کھلے گی — وہاں اجازت دیں، پھر آپ واپس یہاں آ جائیں گے۔"
                    : "Connecting opens the platform's own site — approve there and you come back here."}
                </p>
              </div>

              {/* Main Post Composer */}
              <PostComposer
                caption={caption}
                onChangeCaption={setCaption}
                media={media}
                onChangeMedia={setMedia}
                selectedPlatforms={selectedPlatforms}
                lang={lang}
                onOpenAIAssistant={() => setAiAssistantOpen(true)}
              />

              {/* Hashtag Manager */}
              <HashtagManager
                hashtags={hashtags}
                onChange={setHashtags}
                lang={lang}
                postContent={caption}
                selectedPlatforms={selectedPlatforms}
              />

              {/* Bottom Action Bar */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    title={lang === "ur" ? "فارم صاف کریں" : "Reset Form"}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleSaveDraft()}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{t.saveDraftBtn}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3 py-2 text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                  >
                    {lang === "ur" ? "لاگ آؤٹ" : "Sign out"}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Schedule Post Button */}
                  <button
                    type="button"
                    onClick={() => setSchedulerModalOpen(true)}
                    disabled={selectedPlatforms.length === 0}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg border border-purple-200 dark:border-purple-800/60 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>{t.schedulePostBtn}</span>
                  </button>

                  {/* 1-Click Publish Now Button */}
                  <button
                    type="button"
                    onClick={() => setPublishModalOpen(true)}
                    disabled={selectedPlatforms.length === 0}
                    className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-sm disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{t.publishNowBtn}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Realistic Live Social Media Preview */}
            <div className="lg:col-span-5 sticky top-24">
              <PlatformPreview
                caption={caption}
                hashtags={hashtags}
                media={media}
                selectedPlatforms={selectedPlatforms}
                authorName={settings.authorName}
                lang={lang}
              />
            </div>
          </div>
        ) : (
          /* Queue & History View */
          <div className="max-w-4xl mx-auto">
            {loadingPosts ? (
              <p className="text-sm text-neutral-500 text-center py-8">Loading posts…</p>
            ) : (
              <ScheduledQueue
                posts={posts}
                onDeletePost={(id) => void handleDeletePost(id)}
                onPublishPostNow={(post) => void handlePublishPostNowFromQueue(post)}
                onEditPost={handleEditPostFromQueue}
                lang={lang}
              />
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <PublishModal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        post={currentDraftPost}
        onPostPublished={() => void handlePostPublished()}
        workspaceId={workspace.id}
        lang={lang}
      />

      <SchedulerModal
        isOpen={schedulerModalOpen}
        onClose={() => setSchedulerModalOpen(false)}
        post={currentDraftPost}
        onSchedulePost={(p) => void handleSchedulePost(p)}
        lang={lang}
      />

      <AIAssistantModal
        isOpen={aiAssistantOpen}
        onClose={() => setAiAssistantOpen(false)}
        currentCaption={caption}
        media={media}
        onApplyVariation={(optimizedText) => setCaption(optimizedText)}
        lang={lang}
      />

      <ZeroBudgetGuideModal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
        lang={lang}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
        lang={lang}
      />
    </div>
  );
}
