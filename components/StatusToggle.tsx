"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getSupabase } from "@/lib/supabase";
import { logAudit } from "@/lib/data";
import {
  APPROVAL_LABELS,
  APPROVAL_STATUSES,
  ARTICLE_LABELS,
  ARTICLE_STATUSES,
  PROPOSAL_LABELS,
  PROPOSAL_STATUSES,
} from "@/lib/status";
import type {
  Activity,
  ApprovalStatus,
  ArticleStatus,
  ProposalStatus,
} from "@/lib/types";
import { getActor } from "@/lib/actor";
import { ActorPrompt } from "./ActorPrompt";
import { ArticleBadge, ApprovalBadge, ProposalBadge } from "./StatusBadge";
import { Save } from "lucide-react";

/**
 * 状态勾选组 + 文章 URL,任何变更点击"保存"才落库。
 * 写操作要求先有 actor;否则弹 ActorPrompt。
 */
export function StatusToggle({
  activity,
  onUpdated,
}: {
  activity: Activity;
  onUpdated: (next: Activity) => void;
}) {
  const [proposal, setProposal] = React.useState<ProposalStatus>(activity.status_proposal);
  const [approval, setApproval] = React.useState<ApprovalStatus>(activity.status_approved);
  const [article, setArticle] = React.useState<ArticleStatus>(activity.status_article);
  const [articleUrl, setArticleUrl] = React.useState<string>(activity.article_url ?? "");
  const [promptOpen, setPromptOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const dirty =
    proposal !== activity.status_proposal ||
    approval !== activity.status_approved ||
    article !== activity.status_article ||
    (articleUrl.trim() || null) !== (activity.article_url ?? null);

  async function doSave(actor: string) {
    setSaving(true);
    const sb = getSupabase();
    const updates: Partial<Activity> = {
      status_proposal: proposal,
      status_approved: approval,
      status_article: article,
      article_url: articleUrl.trim() || null,
      updated_by: actor,
    };
    const { data, error } = await sb
      .from("activities")
      .update(updates)
      .eq("id", activity.id)
      .select("*")
      .single();
    setSaving(false);
    if (error) {
      toast.error("保存失败:" + error.message);
      return;
    }
    await logAudit({
      actor,
      action: "update_status",
      entity_type: "activity",
      entity_id: activity.id,
      diff: {
        before: {
          status_proposal: activity.status_proposal,
          status_approved: activity.status_approved,
          status_article: activity.status_article,
          article_url: activity.article_url,
        },
        after: updates,
      },
    });
    toast.success("已保存");
    onUpdated(data as Activity);
    setPending(false);
  }

  function onSaveClick() {
    const a = getActor();
    if (!a) {
      setPending(true);
      setPromptOpen(true);
      return;
    }
    doSave(a);
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="策划案">
          <Select value={proposal} onValueChange={(v) => setProposal(v as ProposalStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROPOSAL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {PROPOSAL_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="审核">
          <Select value={approval} onValueChange={(v) => setApproval(v as ApprovalStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {APPROVAL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {APPROVAL_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="推文">
          <Select value={article} onValueChange={(v) => setArticle(v as ArticleStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ARTICLE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {ARTICLE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="推文链接 (微信公众号 / 视频号 URL)">
        <Input
          type="url"
          value={articleUrl}
          onChange={(e) => setArticleUrl(e.target.value)}
          placeholder="https://mp.weixin.qq.com/s/..."
        />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <ProposalBadge value={proposal} />
          <ApprovalBadge value={approval} />
          <ArticleBadge value={article} />
        </div>
        <Button onClick={onSaveClick} disabled={!dirty || saving}>
          <Save className="mr-1 h-4 w-4" />
          {saving ? "保存中..." : "保存状态"}
        </Button>
      </div>

      <ActorPrompt
        open={promptOpen}
        onOpenChange={(v) => {
          setPromptOpen(v);
          if (!v) setPending(false);
        }}
        onResolved={(actor) => {
          if (pending) doSave(actor);
        }}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}