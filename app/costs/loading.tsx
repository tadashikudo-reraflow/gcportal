export default function CostsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="pb-2">
        <div className="h-7 w-56 bg-gray-200 rounded-lg" />
        <div className="h-4 w-72 bg-gray-100 rounded mt-2" />
      </div>
      {/* KPIカード skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-5 space-y-3">
            <div className="h-3 w-16 bg-gray-100 rounded" />
            <div className="h-10 w-24 bg-gray-200 rounded" />
            <div className="h-3 w-12 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
      {/* チャート skeleton */}
      <div className="card p-6">
        <div className="h-4 w-40 bg-gray-200 rounded mb-4" />
        <div className="h-48 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}
