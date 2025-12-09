export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-2 h-8 w-48 animate-pulse rounded-md bg-gray-200"></div>
          <div className="h-4 w-64 animate-pulse rounded-md bg-gray-200"></div>
        </div>
        <div className="h-9 w-32 animate-pulse rounded-md bg-gray-200"></div>
      </div>

      {/* Summary Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-border/40 bg-white p-4 shadow-sm"
          >
            <div className="mb-2 h-3 w-20 rounded bg-gray-200"></div>
            <div className="mb-1 h-8 w-12 rounded bg-gray-200"></div>
            <div className="h-3 w-24 rounded bg-gray-200"></div>
          </div>
        ))}
      </div>

      <div className="h-16 animate-pulse rounded-xl border border-border/40 bg-white"></div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border border-border/40 bg-white"
            ></div>
          ))}
        </div>
        <div className="hidden h-96 animate-pulse rounded-xl border border-border/40 bg-white xl:block"></div>
      </div>
    </div>
  );
}
