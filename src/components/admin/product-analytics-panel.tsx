"use client";

import * as React from "react";
import {
  PlayCircle,
  GraduationCap,
  Award,
  Download,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ProductAnalytics } from "@/lib/analytics";
import { exportPartnerReport } from "@/app/actions/admin-partner-intake";

export function ProductAnalyticsPanel({
  data,
  productId,
}: {
  data: ProductAnalytics;
  productId: string;
}) {
  const [exporting, setExporting] = React.useState(false);
  const [exportError, setExportError] = React.useState<string | null>(null);

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    const res = await exportPartnerReport(productId);
    setExporting(false);
    if ("error" in res) {
      setExportError(res.error);
      return;
    }
    const blob = new Blob([res.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = res.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const metrics = [
    { label: "Published courses", value: data.publishedCourses, icon: GraduationCap },
    { label: "Course starts", value: data.starts, icon: PlayCircle },
    {
      label: "Completions",
      value: data.completions,
      hint: `${data.completionRate}% of starts`,
      icon: GraduationCap,
    },
    { label: "Badge awards", value: data.badgeAwards, icon: Award },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Aggregate performance across all courses for this project.
          Export a markdown summary to share with partners manually.
        </p>
        <Button size="sm" variant="outline" onClick={handleExport} disabled={exporting}>
          {exporting ? <Loader2 className="animate-spin" /> : <Download />}
          Export partner report
        </Button>
      </div>
      {exportError && (
        <p className="text-sm text-destructive">{exportError}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="py-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <m.icon className="size-4" />
                {m.label}
              </div>
              <p className="mt-2 text-2xl font-semibold">{m.value}</p>
              {m.hint && (
                <p className="mt-0.5 text-xs text-muted-foreground">{m.hint}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {data.courses.length > 0 && (
        <Card>
          <CardContent className="py-5">
            <h3 className="text-sm font-semibold">By course</h3>
            <div className="mt-4 space-y-3 md:hidden">
              {data.courses.map((c) => (
                <div
                  key={c.courseId}
                  className="rounded-lg border bg-card p-3 text-sm"
                >
                  <p className="font-medium">{c.title}</p>
                  <p className="mt-1 capitalize text-muted-foreground">
                    {c.status}
                  </p>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Starts</dt>
                      <dd className="font-medium">{c.starts}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Done</dt>
                      <dd className="font-medium">{c.completions}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Badges</dt>
                      <dd className="font-medium">{c.badgeAwards}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Quiz pass</dt>
                      <dd className="font-medium">
                        {c.quizPassRate === null ? "—" : `${c.quizPassRate}%`}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Course</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 pr-4 text-right font-medium">Starts</th>
                    <th className="pb-2 pr-4 text-right font-medium">Done</th>
                    <th className="pb-2 pr-4 text-right font-medium">Badges</th>
                    <th className="pb-2 text-right font-medium">Quiz pass</th>
                  </tr>
                </thead>
                <tbody>
                  {data.courses.map((c) => (
                    <tr key={c.courseId} className="border-b border-border/50">
                      <td className="py-2.5 pr-4 font-medium">{c.title}</td>
                      <td className="py-2.5 pr-4 capitalize text-muted-foreground">
                        {c.status}
                      </td>
                      <td className="py-2.5 pr-4 text-right">{c.starts}</td>
                      <td className="py-2.5 pr-4 text-right">{c.completions}</td>
                      <td className="py-2.5 pr-4 text-right">{c.badgeAwards}</td>
                      <td className="py-2.5 text-right">
                        {c.quizPassRate === null ? "—" : `${c.quizPassRate}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
