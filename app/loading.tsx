export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Alert banner skeleton */}
      <div className="h-14 rounded-xl bg-red-50" />
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card p-5 space-y-3">
            <div className="h-8 w-12 bg-gray-200 rounded" />
            <div className="h-3 w-16 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
      {/* Status bar */}
      <div className="card px-5 py-3">
        <div className="h-6 rounded-full bg-gray-200" />
      </div>
      {/* Business grid */}
      <div className="card p-6">
        <div className="h-4 w-48 bg-gray-200 rounded mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="rounded-xl p-3 space-y-2" style={{ border: "1px solid #E5E7EB" }}>
              <div className="h-3 w-full bg-gray-100 rounded" />
              <div className="h-5 w-12 bg-gray-200 rounded" />
              <div className="h-2 w-full bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
