export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function MetricSkeleton() {
  return (
    <div className="card">
      <Skeleton className="h-9 w-9 rounded-xl" />
      <Skeleton className="mt-4 h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-20" />
      <Skeleton className="mt-3 h-3 w-32" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="card">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-2 h-3 w-56" />
      <Skeleton className="mt-6 h-56 w-full rounded-xl" />
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="card-flat flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-2 h-3 w-56" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}
