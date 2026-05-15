export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-36 bg-gray-200 rounded-lg" />
        <div className="h-9 w-64 bg-gray-100 rounded-lg" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2 text-center">
            <div className="h-7 w-16 bg-gray-200 rounded mx-auto" />
            <div className="h-3 w-20 bg-gray-100 rounded mx-auto" />
          </div>
        ))}
      </div>

      {/* Chart boxes */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 h-64" />
      <div className="bg-white rounded-2xl border border-gray-200 p-5 h-48" />
    </div>
  );
}
