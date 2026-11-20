"use client";

import { useEffect, useRef, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SORT_OPTIONS = [
  { value: "popularity", label: "Most popular" },
  { value: "rating", label: "Highest rated" },
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
] as const;

/**
 * Auto-submitting sort control for the catalog. Rendered inside its own GET
 * form so the current filters are preserved as hidden inputs when the value
 * changes.
 */
export function SortSelect({
  value,
  params,
}: {
  value: string;
  params: Record<string, string | undefined>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [sort, setSort] = useState(value);

  // Submit only after the controlled Select has committed its value to the
  // hidden native input, so the GET form carries the freshly chosen sort.
  useEffect(() => {
    if (sort !== value) formRef.current?.requestSubmit();
  }, [sort]);

  return (
    <form ref={formRef} action="/courses" method="get" aria-label="Sort courses">
      {Object.entries(params).map(([key, v]) =>
        v ? <input key={key} type="hidden" name={key} value={v} /> : null
      )}
      <Select name="sort" value={sort} onValueChange={setSort}>
        <SelectTrigger className="h-10 w-[180px] bg-white" aria-label="Sort courses by">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </form>
  );
}
