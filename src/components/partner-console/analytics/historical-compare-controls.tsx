"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { AnalyticsCompareBaseline } from "@/lib/analytics-date-range";

const OPTIONS: { value: AnalyticsCompareBaseline; label: string }[] = [
  { value: "none", label: "No comparison" },
  { value: "previous_week", label: "Previous week" },
  { value: "previous_month", label: "Previous month" },
  { value: "previous_quarter", label: "Previous quarter" },
];

export function HistoricalCompareControls({
  current,
}: {
  current: AnalyticsCompareBaseline;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "none") params.delete("compare");
    else params.set("compare", value);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="analytics-compare" className="sr-only">
        Compare to
      </Label>
      <Select
        id="analytics-compare"
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-[11.5rem] text-sm"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
