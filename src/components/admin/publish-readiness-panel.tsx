import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ReadinessReport } from "@/lib/publish-readiness";

export function PublishReadinessPanel({
  report,
  status,
  entityLabel,
}: {
  report: ReadinessReport;
  status: string;
  entityLabel: string;
}) {
  if (status === "published" && report.ready && report.warnings.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 space-y-3">
      {status !== "published" && (
        <Alert variant={report.ready ? "info" : "destructive"}>
          {report.ready ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <AlertTriangle className="size-4" />
          )}
          <AlertTitle>
            {report.ready
              ? `Ready to publish this ${entityLabel}`
              : `Publish blockers for this ${entityLabel}`}
          </AlertTitle>
          <AlertDescription>
            {report.ready ? (
              <p>
                Required content is in place. Review warnings below before going
                live.
              </p>
            ) : (
              <ul className="mt-2 list-disc space-y-1 pl-4">
                {report.blockers.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      {report.warnings.length > 0 && (
        <Alert variant="info">
          <AlertTriangle className="size-4" />
          <AlertTitle>Publish readiness warnings</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {report.warnings.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
