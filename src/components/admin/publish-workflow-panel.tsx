"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EntityStatusControls } from "@/components/admin/entity-status-controls";
import { StaffPartnerReviewControls } from "@/components/admin/staff-partner-review-controls";
import type { ReadinessReport } from "@/lib/publish-readiness";
import type { CourseStatus, ProductStatus } from "@prisma/client";

type PublishWorkflowPanelProps =
  | {
      entityType: "course";
      entityId: string;
      status: CourseStatus;
      report: ReadinessReport;
      entityLabel?: string;
    }
  | {
      entityType: "product";
      entityId: string;
      status: ProductStatus;
      report: ReadinessReport;
      entityLabel?: string;
    };

export function PublishWorkflowPanel(props: PublishWorkflowPanelProps) {
  const entityLabel =
    props.entityLabel ?? (props.entityType === "course" ? "course" : "project");
  const { report, status } = props;
  const isPublished = status === "published";
  const publishDisabled = !isPublished && !report.ready;
  const showReadiness =
    !isPublished || report.warnings.length > 0 || !report.ready;

  if (isPublished && report.ready && report.warnings.length === 0) {
    return (
      <div className="mt-6 flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>This {entityLabel} is live.</span>
        </div>
        {props.entityType === "course" ? (
          <EntityStatusControls
            entityType="course"
            entityId={props.entityId}
            status={props.status}
          />
        ) : (
          <EntityStatusControls
            entityType="product"
            entityId={props.entityId}
            status={props.status}
          />
        )}
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4 rounded-xl border bg-card p-4">
      {showReadiness && (
        <div className="space-y-3">
          {!isPublished && (
            <Alert variant={report.ready ? "info" : "destructive"}>
              {report.ready ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <AlertTriangle className="size-4" />
              )}
              <AlertTitle>
                {report.ready
                  ? `Ready to publish this ${entityLabel}`
                  : `Resolve these items before publishing`}
              </AlertTitle>
              <AlertDescription>
                {report.ready ? (
                  <p>
                    Required content is in place. Publishing will make required
                    lessons, the final quiz, and the badge visible to learners.
                    Review warnings below before going live.
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
              <AlertTitle>Before you publish</AlertTitle>
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
      )}

      <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-start sm:justify-between">
        {props.entityType === "course" && (
          <StaffPartnerReviewControls
            courseId={props.entityId}
            status={props.status}
          />
        )}
        <div className="sm:ml-auto">
          {props.entityType === "course" ? (
            <EntityStatusControls
              entityType="course"
              entityId={props.entityId}
              status={props.status}
              publishDisabled={publishDisabled}
            />
          ) : (
            <EntityStatusControls
              entityType="product"
              entityId={props.entityId}
              status={props.status}
              publishDisabled={publishDisabled}
            />
          )}
        </div>
      </div>
    </div>
  );
}
