import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppStore {
  language: string;
  isFocusMode: boolean;
  setLanguage: (lang: string) => void;
  toggleFocusMode: () => void;
}

function applyLanguage(lang: string) {
  if (typeof document === "undefined") return;
  const dir = lang === "ar" ? "rtl" : "ltr";
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      language: "en",
      isFocusMode: false,
      setLanguage: (lang) => {
        set({ language: lang });
        applyLanguage(lang);
        // Dynamically change i18n language without circular import
        import("@/i18n/config").then((mod) => mod.default.changeLanguage(lang));
      },
      toggleFocusMode: () => set((s) => ({ isFocusMode: !s.isFocusMode })),
    }),
    {
      name: "app-store",
      // When Zustand rehydrates from localStorage on page load,
      // immediately apply the stored language & direction
      onRehydrateStorage: () => (state) => {
        if (state?.language) {
          applyLanguage(state.language);
          import("@/i18n/config").then((mod) =>
            mod.default.changeLanguage(state.language)
          );
        }
      },
    }
  )
);
