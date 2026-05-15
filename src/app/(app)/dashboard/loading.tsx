export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Title */}
      <div>
        <div className="h-8 w-56 bg-gray-200 rounded-lg" />
        <div className="h-4 w-44 bg-gray-100 rounded mt-2" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-gray-200" />
        ))}
      </div>

      {/* Two content boxes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          <div className="h-5 w-32 bg-gray-200 rounded" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-9 bg-gray-100 rounded-lg" />
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          <div className="h-5 w-32 bg-gray-200 rounded" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-9 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Subject chips */}
      <div className="flex gap-3 flex-wrap">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 w-28 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
