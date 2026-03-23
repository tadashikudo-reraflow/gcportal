export default function CloudLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="pb-2">
        <div className="h-7 w-56 bg-gray-200 rounded-lg" />
        <div className="h-4 w-80 bg-gray-100 rounded mt-2" />
      </div>
      {/* CSP比較カード skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card p-5 space-y-3">
            <div className="h-5 w-20 bg-gray-200 rounded" />
            <div className="h-8 w-16 bg-gray-200 rounded" />
            <div className="h-3 w-full bg-gray-100 rounded" />
            <div className="h-3 w-3/4 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
