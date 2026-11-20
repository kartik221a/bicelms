import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAnalyticsLoading() {
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-[420px] max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="border-slate-200">
            <CardContent className="flex items-center gap-4 p-5">
              <Skeleton className="h-11 w-11 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-6 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full rounded-xl" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="border-slate-200">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-44" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[320px] w-full rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-slate-200">
          <CardHeader className="pb-4">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card className="border-slate-200 lg:col-span-2">
          <CardHeader className="pb-4">
            <Skeleton className="h-5 w-56" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
