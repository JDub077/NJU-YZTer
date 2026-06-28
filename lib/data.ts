// 数据访问层 —— 封装 Supabase 查询 + 转换
// 所有函数返回 Promise;组件内自行处理 loading / error

import { getSupabase } from "./supabase";
import type {
  Activity,
  ActivityCollaborator,
  ActivityView,
  Proposal,
  School,
} from "./types";

export async function fetchSchools(): Promise<School[]> {
  const { data, error } = await getSupabase()
    .from("schools")
    .select("*")
    .order("id", { ascending: true });
  if (error) throw error;
  return (data ?? []) as School[];
}

export async function fetchActivities(opts?: {
  from?: string;
  to?: string;
  schoolIds?: number[];
  includeDeleted?: boolean;
}): Promise<Activity[]> {
  let q = getSupabase()
    .from("activities")
    .select("*")
    .order("starts_at", { ascending: true });

  if (!opts?.includeDeleted) q = q.is("deleted_at", null);
  if (opts?.from) q = q.gte("starts_at", opts.from);
  if (opts?.to) q = q.lte("starts_at", opts.to);
  if (opts?.schoolIds && opts.schoolIds.length > 0) {
    // 包含主校或协同学校 — 简化为仅按主校过滤;协同由后续合并处理
    q = q.in("primary_school_id", opts.schoolIds);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Activity[];
}

export async function fetchActivityById(id: number): Promise<ActivityView | null> {
  const sb = getSupabase();
  const [{ data: act, error: e1 }, { data: schools, error: e2 }] = await Promise.all([
    sb.from("activities").select("*").eq("id", id).is("deleted_at", null).maybeSingle(),
    sb.from("schools").select("*"),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  if (!act) return null;

  const schoolMap = new Map<number, School>((schools ?? []).map((s) => [s.id, s as School]));

  const [{ data: collabs, error: e3 }, { data: props, error: e4 }] = await Promise.all([
    sb.from("activity_collaborators").select("school_id").eq("activity_id", id),
    sb
      .from("proposals")
      .select("*")
      .eq("activity_id", id)
      .order("version", { ascending: false }),
  ]);
  if (e3) throw e3;
  if (e4) throw e4;

  const collabSchools: School[] = ((collabs ?? []) as ActivityCollaborator[])
    .map((c) => schoolMap.get(c.school_id))
    .filter((s): s is School => Boolean(s));

  const proposals = (props ?? []) as Proposal[];
  return {
    ...(act as Activity),
    primary_school: schoolMap.get((act as Activity).primary_school_id)!,
    collaborators: collabSchools,
    proposals_count: proposals.length,
    latest_proposal: proposals[0] ?? null,
  };
}

export async function fetchCollaborators(activityId: number): Promise<number[]> {
  const { data, error } = await getSupabase()
    .from("activity_collaborators")
    .select("school_id")
    .eq("activity_id", activityId);
  if (error) throw error;
  return ((data ?? []) as { school_id: number }[]).map((d) => d.school_id);
}

export async function fetchProposals(activityId: number): Promise<Proposal[]> {
  const { data, error } = await getSupabase()
    .from("proposals")
    .select("*")
    .eq("activity_id", activityId)
    .order("version", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Proposal[];
}

export async function nextProposalVersion(activityId: number): Promise<number> {
  const { data, error } = await getSupabase()
    .from("proposals")
    .select("version")
    .eq("activity_id", activityId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return ((data?.version as number | undefined) ?? 0) + 1;
}

export async function logAudit(input: {
  actor: string;
  action: string;
  entity_type: string;
  entity_id?: number | null;
  diff?: Record<string, unknown> | null;
}) {
  const { error } = await getSupabase().from("audit_log").insert({
    actor: input.actor,
    action: input.action,
    entity_type: input.entity_type,
    entity_id: input.entity_id ?? null,
    diff: input.diff ?? null,
  });
  // 审计失败不阻塞主流程,仅 console 提示
  if (error) console.warn("audit_log insert failed:", error.message);
}