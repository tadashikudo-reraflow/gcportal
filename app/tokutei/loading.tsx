export default function TokuteiLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="pb-2">
        <div className="h-7 w-56 bg-gray-200 rounded-lg" />
        <div className="h-4 w-80 bg-gray-100 rounded mt-2" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5 space-y-2">
            <div className="h-8 w-16 bg-gray-200 rounded" />
            <div className="h-3 w-20 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
      <div className="card p-6">
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 w-8 bg-gray-100 rounded" />
              <div className="h-4 w-20 bg-gray-100 rounded" />
              <div className="h-4 w-32 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
