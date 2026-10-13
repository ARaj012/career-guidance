export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="h-4 w-3/4 bg-gray-200 rounded mb-2 animate-pulse" />
      <div className="h-3 w-1/2 bg-gray-200 rounded mb-4 animate-pulse" />
      <div className="space-y-2">
        <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-5/6 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  )
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-1/3 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
      <ListSkeleton count={5} />
    </div>
  )
}

export function HeroSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-24 space-y-6">
      <div className="h-6 w-48 bg-gray-200 rounded-full animate-pulse" />
      <div className="h-12 w-3/4 max-w-3xl bg-gray-200 rounded animate-pulse" />
      <div className="h-6 w-2/3 max-w-2xl bg-gray-200 rounded animate-pulse" />
      <div className="flex gap-4">
        <div className="h-12 w-40 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-12 w-40 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    </div>
  )
}

export function StatSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
        <div className="flex-1">
          <div className="h-8 w-20 bg-gray-200 rounded mb-1 animate-pulse" />
          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}
