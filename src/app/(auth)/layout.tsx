import I18nProvider from "@/components/layout/I18nProvider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        {children}
      </div>
    </I18nProvider>
  );
}
