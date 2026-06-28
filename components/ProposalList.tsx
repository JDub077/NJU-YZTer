"use client";

import * as React from "react";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { getSupabase } from "@/lib/supabase";
import { getActor } from "@/lib/actor";
import { logAudit } from "@/lib/data";
import { fmtBytes, fmtDateTime } from "@/lib/format";
import type { Proposal } from "@/lib/types";
import { ActorPrompt } from "./ActorPrompt";

export function ProposalList({
  activityId,
  proposals,
  onChange,
}: {
  activityId: number;
  proposals: Proposal[];
  onChange: (next: Proposal[]) => void;
}) {
  const [pendingDelete, setPendingDelete] = React.useState<Proposal | null>(null);
  const [promptOpen, setPromptOpen] = React.useState(false);

  function publicUrl(p: Proposal): string {
    const { data } = getSupabase().storage.from("proposals").getPublicUrl(p.file_path);
    return data.publicUrl;
  }

  async function refresh(): Promise<Proposal[]> {
    const { data, error } = await getSupabase()
      .from("proposals")
      .select("*")
      .eq("activity_id", activityId)
      .order("version", { ascending: false });
    if (error) {
      toast.error("刷新失败:" + error.message);
      return proposals;
    }
    const list = (data ?? []) as Proposal[];
    onChange(list);
    return list;
  }

  async function doDelete(p: Proposal, actor: string) {
    const sb = getSupabase();
    // 先尝试删 Storage 对象(失败不阻塞 DB 删除)
    await sb.storage.from("proposals").remove([p.file_path]);
    const { error } = await sb.from("proposals").delete().eq("id", p.id);
    if (error) {
      toast.error("删除失败:" + error.message);
      return;
    }
    await logAudit({
      actor,
      action: "delete_proposal",
      entity_type: "proposal",
      entity_id: p.id,
      diff: { version: p.version, file_name: p.file_name },
    });
    toast.success(`已删除 v${p.version}`);
    await refresh();
  }

  function onDeleteClick(p: Proposal) {
    const a = getActor();
    if (!a) {
      setPendingDelete(p);
      setPromptOpen(true);
      return;
    }
    if (!confirm(`确定删除 v${p.version} · ${p.file_name}?此操作不可撤销。`)) return;
    doDelete(p, a);
  }

  if (proposals.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
        还没有策划案,上传第一版以开启版本管理。
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">版本</TableHead>
            <TableHead>文件</TableHead>
            <TableHead className="hidden sm:table-cell">上传人</TableHead>
            <TableHead className="hidden md:table-cell">大小</TableHead>
            <TableHead className="hidden md:table-cell">上传时间</TableHead>
            <TableHead className="w-32 text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {proposals.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-mono text-sm">v{p.version}</TableCell>
              <TableCell className="max-w-xs">
                <div className="truncate font-medium" title={p.file_name}>
                  {p.file_name}
                </div>
                {p.notes && (
                  <div className="mt-0.5 truncate text-xs text-muted-foreground" title={p.notes}>
                    {p.notes}
                  </div>
                )}
              </TableCell>
              <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                {p.uploaded_by ?? "—"}
              </TableCell>
              <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                {fmtBytes(p.file_size)}
              </TableCell>
              <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                {fmtDateTime(p.uploaded_at)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button asChild size="icon" variant="ghost" className="h-7 w-7">
                    <a href={publicUrl(p)} target="_blank" rel="noopener noreferrer" download>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => onDeleteClick(p)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ActorPrompt
        open={promptOpen}
        onOpenChange={(v) => {
          setPromptOpen(v);
          if (!v) setPendingDelete(null);
        }}
        onResolved={(actor) => {
          if (pendingDelete) {
            if (confirm(`确定删除 v${pendingDelete.version} · ${pendingDelete.file_name}?此操作不可撤销。`))
              doDelete(pendingDelete, actor);
            setPendingDelete(null);
          }
        }}
      />
    </div>
  );
}