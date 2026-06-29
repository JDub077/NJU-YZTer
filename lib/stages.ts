import type { ActivityView } from "./types";
import { isActivityComplete } from "./status";

export type StageFilter = "all" | "pending" | "in_progress" | "complete";

export interface StageOption {
  value: StageFilter;
  label: string;
  tone: string; // 选中态 Tailwind class
}

export const STAGE_OPTIONS: StageOption[] = [
  {
    value: "all",
    label: "全部",
    tone: "bg-secondary text-secondary-foreground border-transparent",
  },
  {
    value: "pending",
    label: "未开始",
    tone: "bg-gray-100 text-gray-700 border-gray-200",
  },
  {
    value: "in_progress",
    label: "进行中",
    tone: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    value: "complete",
    label: "已完成",
    tone: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
];

export function matchesStage(a: ActivityView, stage: StageFilter): boolean {
  if (stage === "all") return true;
  const done = isActivityComplete(a.status_proposal, a.status_approved, a.status_article);
  if (stage === "complete") return done;
  if (stage === "pending") {
    return (
      a.status_proposal === "not_started" &&
      a.status_approved === "pending" &&
      a.status_article === "not_started"
    );
  }
  // in_progress: 已开始但未全部完成
  return !done && !matchesStage(a, "pending");
}

export function sortByStartAsc<T extends { starts_at: string }>(arr: T[]): T[] {
  return [...arr].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  );
}