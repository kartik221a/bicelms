import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  count,
  className,
  children,
}: {
  title: string;
  description?: string;
  count?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-center md:justify-between", className)}>
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {count ? (
            <span className="rounded-full bg-slate-200/70 px-2.5 py-0.5 text-xs font-medium text-slate-600">{count}</span>
          ) : null}
        </div>
        {description ? <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}
