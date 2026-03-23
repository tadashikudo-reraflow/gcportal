export default function TimelineLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="pb-2">
        <div className="h-7 w-48 bg-gray-200 rounded-lg" />
        <div className="h-4 w-72 bg-gray-100 rounded mt-2" />
      </div>
      {/* フィルタ skeleton */}
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-9 w-24 bg-gray-200 rounded-lg" />
        ))}
      </div>
      {/* タイムライン skeleton */}
      <div className="card p-6">
        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="h-10 w-10 bg-gray-200 rounded-full flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-48 bg-gray-200 rounded" />
                <div className="h-3 w-full bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
