export default function BenchmarkLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="pb-2">
        <div className="h-7 w-64 bg-gray-200 rounded-lg" />
        <div className="h-4 w-80 bg-gray-100 rounded mt-2" />
      </div>
      {/* タブ skeleton */}
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 w-28 bg-gray-200 rounded-lg" />
        ))}
      </div>
      {/* テーブル skeleton */}
      <div className="card p-6">
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 w-8 bg-gray-100 rounded" />
              <div className="h-4 w-24 bg-gray-100 rounded" />
              <div className="h-4 w-16 bg-gray-200 rounded" />
              <div className="h-4 w-20 bg-gray-100 rounded ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
