"use client";

import Link from "next/link";
import { schoolColor } from "@/lib/schools";
import { fmtDateTime, fmtRelative } from "@/lib/format";
import { isActivityComplete } from "@/lib/status";
import { ArticleBadge, ApprovalBadge, ProposalBadge } from "./StatusBadge";
import type { ActivityView } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

export function ActivityCard({
  activity,
  className,
  showDate = true,
}: {
  activity: ActivityView;
  className?: string;
  showDate?: boolean;
}) {
  const c = schoolColor(activity.primary_school.name);
  const complete = isActivityComplete(
    activity.status_proposal,
    activity.status_approved,
    activity.status_article
  );
  return (
    <Link
      href={`/activities/detail/?id=${activity.id}`}
      className={cn(
        "block rounded-lg border bg-card p-4 transition-colors hover:bg-accent/40",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium",
                c.bg,
                c.border,
                c.text
              )}
            >
              {activity.primary_school.name}
            </span>
            {activity.is_collaborative && activity.collaborators.length > 0 && (
              <span className="text-xs text-muted-foreground">
                + {activity.collaborators.length} 协同
              </span>
            )}
            {complete && (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-label="已完成" />
            )}
          </div>
          <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold">{activity.title}</h3>
          {showDate && (
            <div className="mt-1 text-xs text-muted-foreground">
              {fmtDateTime(activity.starts_at)} · {fmtRelative(activity.starts_at)}
            </div>
          )}
        </div>
      </div>

      {activity.description && (
        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
          {activity.description}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        <ProposalBadge value={activity.status_proposal} />
        <ApprovalBadge value={activity.status_approved} />
        <ArticleBadge value={activity.status_article} />
      </div>
    </Link>
  );
}