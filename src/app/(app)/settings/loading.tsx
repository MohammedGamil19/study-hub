export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse max-w-2xl">
      <div className="h-8 w-28 bg-gray-200 rounded-lg" />

      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="h-5 w-32 bg-gray-200 rounded" />
          <div className="h-12 bg-gray-100 rounded-xl" />
          <div className="h-12 bg-gray-100 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
