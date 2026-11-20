import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminDashboardLoading() {
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="border-slate-200">
            <CardContent className="flex items-center gap-4 p-5">
              <Skeleton className="h-11 w-11 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="border-slate-200 lg:col-span-8">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-56" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[280px] w-full rounded-xl" />
          </CardContent>
        </Card>
        <Card className="border-slate-200 lg:col-span-4">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-52" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[280px] w-full rounded-xl" />
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="border-slate-200 lg:col-span-8">
          <CardHeader className="pb-4">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <TableHead key={i}>
                      <Skeleton className="h-3.5 w-16" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 6 }).map((_, r) => (
                  <TableRow key={r}>
                    {Array.from({ length: 6 }).map((_, c) => (
                      <TableCell key={c}>
                        <Skeleton className="h-4 w-full max-w-[120px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="border-slate-200 lg:col-span-4">
          <CardHeader className="pb-4">
            <Skeleton className="h-5 w-44" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card className="border-slate-200">
        <CardHeader className="pb-4">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-7 w-7 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-1/2" />
                <Skeleton className="h-1.5 w-full" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
