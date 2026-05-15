"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";
import { Crown, Globe, Bell, Zap, CheckCircle2, Lock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { data: session, update } = useSession();
  const { language, setLanguage, isFocusMode, toggleFocusMode } = useAppStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const isPremium = session?.user?.isPremium;
  const paypalConfigured = !!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  // Handle redirect back from PayPal
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      update().then(() => showToast(t("premiumActivated"), "success"));
      router.replace("/settings");
    } else if (payment === "cancelled") {
      showToast(t("paymentCancelled"), "error");
      router.replace("/settings");
    } else if (payment === "error") {
      showToast(t("paypalError"), "error");
      router.replace("/settings");
    }
  }, [searchParams]);

  useEffect(() => {
    setNotifEnabled("Notification" in window && Notification.permission === "granted");
  }, []);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  }

  const startSubscription = async () => {
    setSubscribing(true);
    try {
      const res = await fetch("/api/payments/paypal/create-subscription", { method: "POST" });
      const data = await res.json();
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl; // redirect to PayPal
      } else {
        showToast(data.error ?? t("paypalError"), "error");
        setSubscribing(false);
      }
    } catch {
      showToast(t("paypalError"), "error");
      setSubscribing(false);
    }
  };

  const enableNotifications = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      setNotifEnabled(true);
      if ("serviceWorker" in navigator && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        const reg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) as any,
        });
        await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub),
        });
      }
    }
  };

  const cancelSubscription = async () => {
    if (!confirm(t("cancelSubConfirm"))) return;
    setCancelling(true);
    const res = await fetch("/api/payments/paypal/cancel-subscription", { method: "POST" });
    if (res.ok) {
      await update();
      showToast(t("subscriptionCancelled"), "success");
    } else {
      showToast(t("error"), "error");
    }
    setCancelling(false);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed top-20 right-4 px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-50 flex items-center gap-2",
          toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
        )}>
          {toast.type === "error" ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
          {toast.msg}
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-900">{t("settings")}</h1>

      {/* Language */}
      <Section title={t("language")} icon={<Globe size={18} className="text-indigo-500" />}>
        <div className="flex gap-3">
          <button onClick={() => setLanguage("en")}
            className={cn("flex-1 py-2.5 rounded-xl font-medium text-sm border-2 transition-all",
              language === "en" ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-gray-300")}>
            🇺🇸 English
          </button>
          <button onClick={() => setLanguage("ar")}
            className={cn("flex-1 py-2.5 rounded-xl font-medium text-sm border-2 transition-all",
              language === "ar" ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-gray-300")}>
            🇸🇦 العربية
          </button>
        </div>
      </Section>

      {/* Notifications */}
      <Section title={t("notifications")} icon={<Bell size={18} className="text-blue-500" />}>
        {notifEnabled ? (
          <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
            <CheckCircle2 size={16} /> {t("notificationsEnabled")}
          </div>
        ) : (
          <button onClick={enableNotifications}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
            {t("enableNotifications")}
          </button>
        )}
        <p className="text-xs text-gray-400 mt-2">{t("notificationsBefore")}</p>
      </Section>

      {/* Focus Mode */}
      <Section
        title={t("focusMode")}
        icon={<Zap size={18} className={isFocusMode ? "text-indigo-600" : "text-gray-400"} />}
        badge={!isPremium ? "Premium" : undefined}
      >
        {!isPremium ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Lock size={14} /> {t("premiumFeature")}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">{isFocusMode ? t("focusModeOn") : t("focusModeOff")}</p>
            <button onClick={toggleFocusMode}
              className={cn("relative w-12 h-6 rounded-full transition-colors", isFocusMode ? "bg-indigo-600" : "bg-gray-200")}>
              <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all", isFocusMode ? "left-6" : "left-0.5")} />
            </button>
          </div>
        )}
      </Section>

      {/* Premium / Billing */}
      <Section
        title={isPremium ? t("premiumPlan") : t("freePlan")}
        icon={<Crown size={18} className={isPremium ? "text-amber-500" : "text-gray-400"} />}
      >
        {isPremium ? (
          /* ── Active premium ── */
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-2 text-amber-700 font-semibold mb-2">
                <Crown size={16} /> {t("premiumActive")}
              </div>
              <div className="space-y-1.5 text-sm text-amber-700">
                {[t("unlimitedSubjects"), t("noAds"), t("advancedAnalytics"), t("aiSummarizer"), t("focusModeFeature")].map((f) => (
                  <div key={f} className="flex items-center gap-2"><CheckCircle2 size={14} /> {f}</div>
                ))}
              </div>
            </div>

            <button
              onClick={cancelSubscription}
              disabled={cancelling}
              className="w-full py-2.5 border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 rounded-xl text-sm font-medium transition-colors"
            >
              {cancelling ? t("loading") : t("cancelSubscription")}
            </button>
            <p className="text-xs text-center text-gray-400">{t("cancelSubNote")}</p>
          </div>
        ) : (
          /* ── Upgrade section ── */
          <div className="space-y-5">
            {/* Plan card */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-900 text-lg">Study Hub Premium</p>
                  <p className="text-gray-500 text-sm mt-0.5">{t("premiumSubtitle")}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-extrabold text-indigo-600">$10</p>
                  <p className="text-xs text-gray-400">{t("perMonth")}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-1.5 text-sm text-gray-600">
                {[t("unlimitedSubjects"), t("advancedAnalytics"), t("aiSummarizer"), t("focusModeFeature"), t("noAds")].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-indigo-500 shrink-0" /> {f}
                  </div>
                ))}
              </div>
            </div>

            {/* PayPal subscribe button */}
            {paypalConfigured ? (
              <div className="space-y-2">
                <button
                  onClick={startSubscription}
                  disabled={subscribing}
                  className="w-full py-3.5 bg-[#FFC439] hover:bg-[#f0b72f] disabled:opacity-60 text-[#003087] font-bold rounded-xl flex items-center justify-center gap-2.5 transition-colors shadow-sm text-sm"
                >
                  {subscribing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#003087] border-t-transparent rounded-full animate-spin" />
                      {t("redirectingToPayPal")}
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#003087">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.813.76-4.813.075-.476.47-.826.952-.826h.598c3.978 0 7.093-1.615 8.004-6.285.384-1.995.195-3.66-.207-4.371z"/>
                      </svg>
                      {t("subscribeWithPayPal")}
                    </>
                  )}
                </button>
                <p className="text-xs text-center text-gray-400">{t("cancelAnytime")}</p>
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Crown size={24} className="mx-auto mb-2 text-gray-300" />
                {t("paypalNotConfigured")}
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Account info */}
      <Section title={t("account")} icon={<span className="text-gray-500 text-sm">👤</span>}>
        <div className="text-sm text-gray-600 space-y-1">
          <p><span className="font-medium">{t("email")}:</span> {session?.user?.email}</p>
          <p><span className="font-medium">{t("name")}:</span> {session?.user?.name || "—"}</p>
          <p><span className="font-medium">{t("planLabel")}:</span> {isPremium ? `${t("premium")} ⭐` : t("free")}</p>
        </div>
      </Section>
    </div>
  );
}

function Section({
  title, icon, badge, children,
}: {
  title: string; icon: React.ReactNode; badge?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="font-semibold text-gray-900">{title}</h2>
        {badge && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{badge}</span>}
      </div>
      {children}
    </div>
  );
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return new Uint8Array([...raw].map((c) => c.charCodeAt(0)));
}
