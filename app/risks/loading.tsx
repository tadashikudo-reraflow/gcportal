export default function RisksLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page header skeleton */}
      <div className="pb-2">
        <div className="h-7 w-64 bg-gray-200 rounded-lg" />
        <div className="h-4 w-96 bg-gray-100 rounded mt-2" />
      </div>
      {/* KPI cards skeleton */}
      <div className="card p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <div className="h-8 w-16 bg-gray-200 rounded mx-auto" />
              <div className="h-3 w-24 bg-gray-100 rounded mx-auto" />
            </div>
          ))}
        </div>
        <div className="h-7 rounded-lg bg-gray-200" />
      </div>
      {/* Table skeleton */}
      <div className="card p-6">
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 w-8 bg-gray-100 rounded" />
              <div className="h-4 w-20 bg-gray-100 rounded" />
              <div className="h-4 w-28 bg-gray-200 rounded" />
              <div className="h-4 w-12 bg-gray-100 rounded ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
