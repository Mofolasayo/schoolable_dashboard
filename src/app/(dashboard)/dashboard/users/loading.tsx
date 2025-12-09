export default function Loading() {
  return (
    <div className="animate-pulse space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 h-7 w-48 rounded-md bg-gray-200"></div>
          <div className="h-4 w-64 rounded-md bg-gray-200"></div>
        </div>
        <div className="h-10 w-32 rounded-md bg-gray-200"></div>
      </header>

      <div className="rounded-md border border-gray-200 bg-white p-4">
        <div className="space-y-4">
          {/* Table header skeleton */}
          <div className="flex justify-between border-b pb-4">
            <div className="h-6 w-24 rounded bg-gray-200"></div>
            <div className="h-6 w-32 rounded bg-gray-200"></div>
            <div className="h-6 w-20 rounded bg-gray-200"></div>
          </div>

          {/* Rows */}
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex justify-between border-b py-4 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded bg-gray-200"></div>
                  <div className="h-3 w-24 rounded bg-gray-200"></div>
                </div>
              </div>
              <div className="h-6 w-24 self-center rounded bg-gray-200"></div>
              <div className="h-6 w-20 self-center rounded bg-gray-200"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
