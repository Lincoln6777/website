import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-content mx-auto p-gutter space-y-6">
      <Skeleton className="h-10 w-48 rounded-austin" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-austin" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-austin" />
    </div>
  );
}
