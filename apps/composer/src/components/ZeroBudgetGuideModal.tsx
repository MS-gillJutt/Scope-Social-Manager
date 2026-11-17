import React from "react";
import { Language, TRANSLATIONS } from "../constants/translations";
import {
  HelpCircle,
  X,
  CheckCircle2,
  ExternalLink,
  Zap,
  Globe,
  Share2,
  Workflow,
  KeyRound,
} from "lucide-react";

interface ZeroBudgetGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const ZeroBudgetGuideModal: React.FC<ZeroBudgetGuideModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const t = TRANSLATIONS[lang];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                {lang === "ur"
                  ? "0 روپے کے بجٹ میں تمام سوشل میڈیا پر پوسٹ کرنے کی مکمل گائیڈ"
                  : "Zero-Budget Multi-Posting Architecture Guide"}
              </h3>
              <p className="text-xs text-neutral-500">
                {lang === "ur"
                  ? "بغیر کسی پیڈ سبسکرپشن (Buffer / Hootsuite) کے 100% مفت طریقہ"
                  : "How to broadcast across LinkedIn, TikTok, IG, FB & X with $0 cost"}
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

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed">
          {/* Intro Card */}
          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200">
            <p className="font-semibold text-sm mb-1">
              {lang === "ur"
                ? "آپ کا سوال: 'میرے پاس بجٹ بالکل نہیں ہے، کیا یہ مفت بن سکتا ہے؟'"
                : "Your Concern: 'I have zero budget right now, can this work completely free?'"}
            </p>
            <p className="text-xs text-emerald-800 dark:text-emerald-300">
              {lang === "ur"
                ? "جی بالکل 100%! روایتی ٹولز جیسے Hootsuite اور Buffer ماہانہ $20 سے $100 مانگتے ہیں۔ لیکن اس ایپ میں ہم نے آپ کے لیے 3 ایسے طریقے شامل کیے ہیں جن میں ایک روپیہ بھی خرچ نہیں ہوتا!"
                : "Yes, 100%! Standard SaaS tools charge $20-$100/mo. This application gives you 3 built-in zero-cost pathways so you never have to pay a single penny."}
            </p>
          </div>

          {/* Strategy 1: Multi-Tab Intent (Instant, Zero Setup) */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850/60 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
              <Share2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>
                {lang === "ur"
                  ? "طریقہ نمبر 1: انسٹنٹ 1-کلک ملٹی ٹیب (فوری شروع کریں، بغیر سیٹ اپ)"
                  : "Method 1: Instant 1-Click Multi-Intent (Ready Now, Zero Setup)"}
              </span>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 text-xs">
              {lang === "ur"
                ? "1. پوسٹ لکھیں اور 'تمام منتخب پلیٹ فارمز پر لگائیں' پر کلک کریں۔"
                : "1. Compose post and click 'Broadcast to Selected Platforms'."}
            </p>
            <p className="text-neutral-600 dark:text-neutral-400 text-xs">
              {lang === "ur"
                ? "2. ایپ خود بخود آپ کا مکمل کیپشن اور ہیش ٹیگز کلپ بورڈ میں کاپی کر دیتی ہے اور 'Open All Channels in Tabs' کے بٹن سے ایک ہی وقت میں ٹویٹر، لنکڈ اِن، فیس بک اور ٹک ٹاک کے تخلیق کے پیجز کھول دیتی ہے۔"
                : "2. The app automatically copies your full caption and hashtags to the clipboard, and with 'Open All Channels in Tabs', it launches native post composers for LinkedIn, Twitter/X, Facebook, TikTok, and Instagram."}
            </p>
            <p className="text-neutral-600 dark:text-neutral-400 text-xs">
              {lang === "ur"
                ? "3. آپ صرف ہر ٹیب پر جا کر Paste (Ctrl+V) کر کے Post دبا دیتے ہیں! اس میں 15 سیکنڈ لگتے ہیں اور یہ لائف ٹائم 100% مفت ہے۔"
                : "3. You just hit Paste (Ctrl+V) and publish! Takes 15 seconds across all 5 platforms and requires zero API setup."}
            </p>
          </div>

          {/* Strategy 2: Free Webhook Automation */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850/60 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
              <Workflow className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>
                {lang === "ur"
                  ? "طریقہ نمبر 2: مفت ویب ہک آٹومیشن (Make.com یا n8n)"
                  : "Method 2: Free Automation Webhooks (Make.com / n8n / Zapier Free Tier)"}
              </span>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 text-xs">
              {lang === "ur"
                ? "Make.com ہر مہینے 1,000 مفت آپریشنز دیتا ہے۔ آپ Make.com یا مفت اوپن سورس n8n میں ایک فری سیناریو بنائیں:"
                : "Make.com gives 1,000 free operations/month. Or use n8n for unlimited self-hosted posting:"}
            </p>
            <div className="p-2.5 rounded-lg bg-neutral-900 text-neutral-200 font-mono text-[11px]">
              Custom Webhook → Facebook Page (Create Post) → LinkedIn (Share Article) → Twitter (Create Tweet)
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 text-xs">
              {lang === "ur"
                ? "اس ویب ہک کا URL اس ایپ کی Settings میں پیسٹ کر دیں۔ اس کے بعد جیسے ہی آپ ایپ میں 'Publish' دبائیں گے، سب سوشل میڈیا پر بیک گراؤنڈ میں خودکار پوسٹ ہو جائے گی!"
                : "Paste your free Webhook URL in Settings. Every time you hit Publish, it will post directly in the background without needing you to open tabs!"}
            </p>
          </div>

          {/* Strategy 3: Free Developer APIs */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850/60 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
              <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>
                {lang === "ur"
                  ? "طریقہ نمبر 3: آفیشل فری ڈیولپر اکاؤنٹس (Direct Developer Portals)"
                  : "Method 3: Official Free Developer Portals"}
              </span>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 text-xs">
              {lang === "ur"
                ? "سوشل میڈیا نیٹ ورکس اپنے صارفین کو مفت API کیز دیتے ہیں:"
                : "All major platforms offer free developer tiers:"}
            </p>
            <ul className="list-disc list-inside space-y-1 text-neutral-600 dark:text-neutral-400 pl-1">
              <li>
                <strong>Meta for Developers:</strong> Facebook Page & Instagram Graph API (100% مفت)
              </li>
              <li>
                <strong>LinkedIn Developers:</strong> Share on LinkedIn API (100% مفت)
              </li>
              <li>
                <strong>X Developer:</strong> Free Tier (Write Tweets) (مفت)
              </li>
              <li>
                <strong>TikTok for Developers:</strong> Content Posting API (مفت)
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 text-white dark:text-neutral-900 rounded-lg transition-colors cursor-pointer"
          >
            {lang === "ur" ? "سمجھ گیا (Got it)" : "Understood"}
          </button>
        </div>
      </div>
    </div>
  );
};
