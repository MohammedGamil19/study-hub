"use client";
import { useLayoutEffect } from "react";
import "@/i18n/config";
import { useAppStore } from "@/stores/useAppStore";
import { useTranslation } from "react-i18next";

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const { language } = useAppStore();
  const { i18n } = useTranslation();

  // useLayoutEffect runs synchronously before the browser paints — prevents
  // a flash of wrong direction/language on initial load.
  useLayoutEffect(() => {
    i18n.changeLanguage(language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language, i18n]);

  return <>{children}</>;
}
