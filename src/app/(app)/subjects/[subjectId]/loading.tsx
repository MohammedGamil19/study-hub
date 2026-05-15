export default function SubjectPageLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
            <div className="h-3 w-16 bg-gray-100 rounded" />
            <div className="h-6 w-12 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Quick link cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-200 shrink-0" />
            <div className="h-4 flex-1 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
