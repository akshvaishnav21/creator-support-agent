"use client";

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    />
  );
}

export function SponsorshipSkeleton() {
  return (
    <div className="space-y-6 mt-8">
      {/* Summary */}
      <div className="bg-blue-100 dark:bg-blue-900/30 rounded-xl p-5">
        <Shimmer className="h-3 w-32 mb-3" />
        <Shimmer className="h-4 w-full mb-2" />
        <Shimmer className="h-4 w-3/4" />
      </div>
      {/* Two-column cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
            <Shimmer className="h-4 w-40 mb-4" />
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[0, 1, 2, 3].map((j) => (
                <Shimmer key={j} className="h-14 rounded-lg" />
              ))}
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2].map((j) => (
                <Shimmer key={j} className="h-5 w-16 rounded-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Categories */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <Shimmer className="h-4 w-48 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Shimmer key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function CommentsSkeleton() {
  return (
    <div className="space-y-6 mt-6">
      {/* Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <Shimmer className="h-4 w-32 mb-2" />
        <Shimmer className="h-3 w-full mb-1" />
        <Shimmer className="h-3 w-3/4" />
      </div>
      {/* Sentiment bars */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <Shimmer className="h-4 w-40 mb-3" />
        {[0, 1, 2].map((i) => (
          <Shimmer key={i} className="h-3 w-full mb-2 rounded-full" />
        ))}
      </div>
      {/* Topic clusters */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <Shimmer className="h-4 w-32 mb-3" />
        {[0, 1, 2].map((i) => (
          <Shimmer key={i} className="h-20 mb-2 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function TitlesSkeleton() {
  return (
    <div className="space-y-6 mt-6">
      {/* Top pick */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <Shimmer className="h-3 w-16 mb-2" />
        <Shimmer className="h-5 w-3/4 mb-2" />
        <Shimmer className="h-3 w-1/2" />
      </div>
      {/* Grouped titles */}
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <Shimmer className="h-5 w-28 rounded-full mb-3" />
          {[0, 1].map((j) => (
            <Shimmer key={j} className="h-20 mb-2 rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  );
}
