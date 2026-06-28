// 与 db/schema.sql 一一对应的 TypeScript 类型
// 静态导出站无需 supabase gen types,手写即可

export type ProposalStatus =
  | "not_started"
  | "drafting"
  | "submitted"
  | "approved";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type ArticleStatus = "not_started" | "in_progress" | "published";

export interface School {
  id: number;
  name: string;
  province: string;
  location: string;
  created_at: string;
}

export interface Activity {
  id: number;
  title: string;
  description: string | null;
  primary_school_id: number;
  starts_at: string; // ISO
  ends_at: string | null;
  is_collaborative: boolean;
  status_proposal: ProposalStatus;
  status_approved: ApprovalStatus;
  status_article: ArticleStatus;
  article_url: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ActivityCollaborator {
  activity_id: number;
  school_id: number;
}

export interface Proposal {
  id: number;
  activity_id: number;
  version: number;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string | null;
  notes: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface AuditLog {
  id: number;
  actor: string;
  action: string;
  entity_type: string;
  entity_id: number | null;
  diff: Record<string, unknown> | null;
  created_at: string;
}

// 用于日历与列表的视图模型:把外键展平
export interface ActivityView extends Activity {
  primary_school: School;
  collaborators: School[];
  proposals_count: number;
  latest_proposal: Proposal | null;
}