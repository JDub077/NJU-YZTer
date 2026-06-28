"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Trash2,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusToggle } from "@/components/StatusToggle";
import { ProposalUploader } from "@/components/ProposalUploader";
import { ProposalList } from "@/components/ProposalList";
import { ActorPrompt } from "@/components/ActorPrompt";
import { fetchActivityById, fetchProposals, logAudit } from "@/lib/data";
import { getActor } from "@/lib/actor";
import { getSupabase } from "@/lib/supabase";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { schoolColor, schoolColorLight } from "@/lib/schools";
import { cn } from "@/lib/utils";
import type { ActivityView, Proposal } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function ActivityDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-6 text-sm text-muted-foreground">
          加载中…
        </div>
      }
    >
      <ActivityDetailInner />
    </React.Suspense>
  );
}

function ActivityDetailInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = Number(searchParams?.get("id"));

  const [activity, setActivity] = React.useState<ActivityView | null>(null);
  const [proposals, setProposals] = React.useState<Proposal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [promptOpen, setPromptOpen] = React.useState(false);

  async function loadAll() {
    if (!Number.isFinite(id)) {
      setError("无效的活动 ID");
      setLoading(false);
      return;
    }
    if (!isSupabaseConfigured) {
      setError("尚未配置 Supabase");
      setLoading(false);
      return;
    }
    try {
      const [av, ps] = await Promise.all([
        fetchActivityById(id),
        fetchProposals(id),
      ]);
      if (!av) {
        setError("活动不存在或已删除");
        setLoading(false);
        return;
      }
      setActivity(av);
      setProposals(ps);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    setLoading(true);
    setError(null);
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function doDelete(actor: string) {
    setDeleting(true);
    const sb = getSupabase();
    const { error } = await sb
      .from("activities")
      .update({ deleted_at: new Date().toISOString(), updated_by: actor })
      .eq("id", id);
    setDeleting(false);
    if (error) {
      toast.error("删除失败:" + error.message);
      return;
    }
    await logAudit({
      actor,
      action: "soft_delete_activity",
      entity_type: "activity",
      entity_id: id,
    });
    toast.success("活动已删除");
    router.push("/");
  }

  function onDeleteClick() {
    if (!confirm("确定删除此活动?此操作标记为软删除,可通过数据库恢复。")) return;
    const a = getActor();
    if (!a) {
      setPromptOpen(true);
      return;
    }
    doDelete(a);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 text-sm text-muted-foreground">
        加载中…
      </div>
    );
  }
  if (error || !activity) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error ?? "未找到活动"}
        </div>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-1 h-4 w-4" />
              返回日历
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const c = schoolColorLight(activity.primary_school.name);

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-6">
      <div className="text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">
          ← 返回日历
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2 py-0.5 font-medium",
                    c.bg,
                    c.border,
                    c.text
                  )}
                >
                  {activity.primary_school.province} · {activity.primary_school.name}
                </span>
                {activity.is_collaborative && activity.collaborators.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-indigo-700">
                    <Users className="h-3 w-3" />
                    协同活动
                  </span>
                )}
              </div>
              <CardTitle className="mt-2 text-2xl">{activity.title}</CardTitle>
              <div className="mt-1 text-sm text-muted-foreground">
                {fmtDateTime(activity.starts_at)}
                {activity.ends_at && activity.ends_at !== activity.starts_at && (
                  <> ~ {fmtDate(activity.ends_at)}</>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onDeleteClick}
              disabled={deleting}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              {deleting ? "删除中..." : "删除"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {activity.description && (
            <p className="text-sm leading-relaxed text-foreground/80">
              {activity.description}
            </p>
          )}

          {activity.collaborators.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted-foreground">协同学校:</span>
              {activity.collaborators.map((cs) => {
                const cc = schoolColorLight(cs.name);
                return (
                  <span
                    key={cs.id}
                    className={cn(
                      "rounded-full border px-2 py-0.5 font-medium",
                      cc.bg,
                      cc.border,
                      cc.text
                    )}
                  >
                    {cs.name}
                  </span>
                );
              })}
            </div>
          )}

          <div className="h-px bg-border" />

          <StatusToggle
            activity={activity}
            onUpdated={(next) =>
              setActivity((prev) => (prev ? { ...prev, ...next } : prev))
            }
          />

          {activity.article_url && (
            <a
              href={activity.article_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary underline-offset-2 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              查看推文归档
            </a>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            策划案版本
            <span className="text-xs text-muted-foreground">
              ({proposals.length} 个版本)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProposalUploader activityId={id} onUploaded={setProposals} />
          <ProposalList
            activityId={id}
            proposals={proposals}
            onChange={setProposals}
          />
        </CardContent>
      </Card>

      <ActorPrompt
        open={promptOpen}
        onOpenChange={setPromptOpen}
        onResolved={(actor) => doDelete(actor)}
      />
    </div>
  );
}