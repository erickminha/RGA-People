export default function PortalLoading() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded-lg w-1/3 animate-pulse" />
        <div className="h-4 bg-gray-100 rounded-lg w-1/2 animate-pulse" />
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-6 bg-gray-200 rounded-lg w-1/4 animate-pulse" />
          <div className="bg-white p-6 rounded-2xl border border-gray-100 animate-pulse">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
              <div className="h-4 bg-gray-100 rounded w-4/6" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded-lg w-1/3 animate-pulse" />
          <div className="bg-white p-6 rounded-2xl border border-gray-100 animate-pulse">
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
