export default function SubjectsLoading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-8 w-32 bg-gray-200 rounded-lg" />
          <div className="h-4 w-24 bg-gray-100 rounded mt-1" />
        </div>
        <div className="h-9 w-24 bg-gray-200 rounded-lg" />
      </div>

      {/* Subject cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200" />
              <div className="space-y-1.5">
                <div className="h-4 w-28 bg-gray-200 rounded" />
                <div className="h-3 w-16 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
