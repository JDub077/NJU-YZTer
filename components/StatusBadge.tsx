"use client";

import {
  APPROVAL_BADGE,
  APPROVAL_LABELS,
  ARTICLE_BADGE,
  ARTICLE_LABELS,
  PROPOSAL_BADGE,
  PROPOSAL_LABELS,
} from "@/lib/status";
import type {
  ApprovalStatus,
  ArticleStatus,
  ProposalStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProposalBadge({
  value,
  className,
}: {
  value: ProposalStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        PROPOSAL_BADGE[value],
        className
      )}
    >
      策划案 · {PROPOSAL_LABELS[value]}
    </span>
  );
}

export function ApprovalBadge({
  value,
  className,
}: {
  value: ApprovalStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        APPROVAL_BADGE[value],
        className
      )}
    >
      审核 · {APPROVAL_LABELS[value]}
    </span>
  );
}

export function ArticleBadge({
  value,
  className,
}: {
  value: ArticleStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        ARTICLE_BADGE[value],
        className
      )}
    >
      推文 · {ARTICLE_LABELS[value]}
    </span>
  );
}