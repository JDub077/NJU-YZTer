import type {
  ArticleStatus,
  ApprovalStatus,
  ProposalStatus,
} from "./types";

// 策划案状态
export const PROPOSAL_STATUSES: ProposalStatus[] = [
  "not_started",
  "drafting",
  "submitted",
  "approved",
];

export const PROPOSAL_LABELS: Record<ProposalStatus, string> = {
  not_started: "未开始",
  drafting: "撰写中",
  submitted: "已提交",
  approved: "已过审",
};

export const PROPOSAL_BADGE: Record<ProposalStatus, string> = {
  not_started: "bg-gray-100 text-gray-600 border-gray-200",
  drafting:    "bg-blue-50 text-blue-700 border-blue-200",
  submitted:   "bg-amber-50 text-amber-700 border-amber-200",
  approved:    "bg-emerald-50 text-emerald-700 border-emerald-200",
};

// 审核状态
export const APPROVAL_STATUSES: ApprovalStatus[] = ["pending", "approved", "rejected"];

export const APPROVAL_LABELS: Record<ApprovalStatus, string> = {
  pending: "待审",
  approved: "通过",
  rejected: "驳回",
};

export const APPROVAL_BADGE: Record<ApprovalStatus, string> = {
  pending:  "bg-gray-100 text-gray-600 border-gray-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

// 推文状态
export const ARTICLE_STATUSES: ArticleStatus[] = ["not_started", "in_progress", "published"];

export const ARTICLE_LABELS: Record<ArticleStatus, string> = {
  not_started: "未开始",
  in_progress: "撰写中",
  published: "已发布",
};

export const ARTICLE_BADGE: Record<ArticleStatus, string> = {
  not_started: "bg-gray-100 text-gray-600 border-gray-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  published:   "bg-emerald-50 text-emerald-700 border-emerald-200",
};

// 综合完成度判定
export function isActivityComplete(
  proposal: ProposalStatus,
  approved: ApprovalStatus,
  article: ArticleStatus
): boolean {
  return proposal === "approved" && approved === "approved" && article === "published";
}

export function completionRatio(
  proposal: ProposalStatus,
  approved: ApprovalStatus,
  article: ArticleStatus
): number {
  let score = 0;
  if (proposal === "approved") score += 1;
  if (approved === "approved") score += 1;
  if (article === "published") score += 1;
  return score / 3;
}