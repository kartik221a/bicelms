import { Skeleton } from "@/components/ui/skeleton";

export default function LessonLoading() {
  return (
    <div className="mx-auto max-w-[1440px]">
      <Skeleton className="mb-4 h-10 w-56 rounded-lg lg:hidden" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)_320px] xl:gap-6">
        <div className="hidden lg:block">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-3 h-6 w-3/4" />
            <Skeleton className="mt-4 h-20 w-full rounded-lg" />
            <Skeleton className="mt-4 h-8 w-full" />
            <div className="mt-4 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-5">
          <Skeleton className="h-7 w-96 max-w-full" />
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <div className="mt-5 space-y-3">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <div className="flex justify-between pt-3">
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-44" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <Skeleton className="h-9 w-full" />
          <div className="mt-4 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
