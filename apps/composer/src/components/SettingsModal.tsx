import React, { useState } from "react";
import { UserSettings, PlatformId } from "../types";
import { TRANSLATIONS } from "../constants/translations";
import { PLATFORMS } from "../constants/platforms";
import { Settings, X, Check, Save, Link2, User, Globe } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const t = TRANSLATIONS.en;
  const [formData, setFormData] = useState<UserSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const updateHandle = (pid: PlatformId, val: string) => {
    setFormData({
      ...formData,
      socialHandles: {
        ...formData.socialHandles,
        [pid]: val,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                {t.settingsTitle}
              </h3>
              <p className="text-xs text-neutral-500">
Webhook, author profile & custom social handles
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
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          {/* Author Name */}
          <div>
            <label className="font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-neutral-500" />
              <span>Creator / Brand Name:</span>
            </label>
            <input
              type="text"
              value={formData.authorName}
              onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
              placeholder="e.g. Ali Gill or Tech With Ali"
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-750 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {/* Webhook URL for Free Background Auto-Posting */}
          <div>
            <label className="font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-blue-500" />
                <span>{t.freeWebhookOption}</span>
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                100% Free
              </span>
            </label>
            <input
              type="url"
              value={formData.webhookUrl}
              onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
              placeholder="https://hook.eu2.make.com/your-free-webhook-url"
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-750 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500/40 font-mono text-[11px]"
            />
            <p className="text-[11px] text-neutral-500 mt-1">
Optional: Add your free Make/n8n webhook URL to auto-dispatch in background without opening browser tabs.
            </p>
          </div>

          {/* Handles for each platform */}
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-2.5">
            <p className="font-semibold text-neutral-700 dark:text-neutral-300">
              Custom Handles / URLs:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PLATFORMS.map((p) => (
                <div key={p.id}>
                  <span className="text-[11px] text-neutral-500 block mb-0.5">
                    {p.name}
                  </span>
                  <input
                    type="text"
                    value={formData.socialHandles[p.id] || ""}
                    onChange={(e) => updateHandle(p.id, e.target.value)}
                    placeholder={p.handlePlaceholder}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-750 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-1 focus:ring-blue-500 text-[11px]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 flex items-center justify-between">
          <div className="text-xs text-neutral-500">
            {savedSuccess && (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Saved successfully!</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 font-semibold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors text-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
