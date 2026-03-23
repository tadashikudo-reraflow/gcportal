export default function BusinessesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="pb-2">
        <div className="h-7 w-72 bg-gray-200 rounded-lg" />
        <div className="h-4 w-96 bg-gray-100 rounded mt-2" />
      </div>
      {/* 業務グリッド skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="card p-3 space-y-2">
            <div className="h-3 w-full bg-gray-100 rounded" />
            <div className="h-5 w-12 bg-gray-200 rounded" />
            <div className="h-2 w-full bg-gray-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
