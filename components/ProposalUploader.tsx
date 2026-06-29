"use client";

import * as React from "react";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getSupabase } from "@/lib/supabase";
import { getActor } from "@/lib/actor";
import { logAudit, nextProposalVersion } from "@/lib/data";
import type { Proposal } from "@/lib/types";
import { ActorPrompt } from "./ActorPrompt";
import { fmtBytes } from "@/lib/format";

const MAX_BYTES = 20 * 1024 * 1024;
const ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.md,.txt";

export function ProposalUploader({
  activityId,
  onUploaded,
}: {
  activityId: number;
  onUploaded: (next: Proposal[]) => void;
}) {
  const [file, setFile] = React.useState<File | null>(null);
  const [notes, setNotes] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);
  const [promptOpen, setPromptOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function pickFile(f: File | null) {
    setFile(f);
  }

  async function refreshList(): Promise<Proposal[]> {
    const { data, error } = await getSupabase()
      .from("proposals")
      .select("*")
      .eq("activity_id", activityId)
      .order("version", { ascending: false });
    if (error) {
      toast.error("刷新失败:" + error.message);
      return [];
    }
    const list = (data ?? []) as Proposal[];
    onUploaded(list);
    return list;
  }

  async function doUpload(actor: string) {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error(`文件超过 20MB 上限 (当前 ${fmtBytes(file.size)})`);
      return;
    }
    setUploading(true);
    let path = "";
    try {
      const version = await nextProposalVersion(activityId);
      // Supabase Storage 不接受中文等非 ASCII 字符在 object key 中(InvalidKey 400)。
      // 用 timestamp + 随机串 + 保留 ASCII 扩展名。原始文件名存 proposals.file_name 用于显示。
      const m = file.name.match(/\.([^.]+)$/);
      const rawExt = m ? m[1].toLowerCase() : "";
      const ext = rawExt.replace(/[^a-z0-9]/g, "").slice(0, 8);
      const safeName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${
        ext ? "." + ext : ""
      }`;
      path = `proposals/${activityId}/v${version}_${safeName}`;

      const sb = getSupabase();
      const { error: upErr } = await sb.storage
        .from("proposals")
        .upload(path, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
      if (upErr) throw upErr;

      const { data: row, error: insErr } = await sb
        .from("proposals")
        .insert({
          activity_id: activityId,
          version,
          file_name: file.name,
          file_path: path,
          file_size: file.size,
          mime_type: file.type || null,
          notes: notes.trim() || null,
          uploaded_by: actor,
        })
        .select("*")
        .single();
      if (insErr) throw insErr;

      await logAudit({
        actor,
        action: "upload_proposal",
        entity_type: "proposal",
        entity_id: (row as Proposal).id,
        diff: { version, file_name: file.name },
      });

      toast.success(`已上传 v${version}`);
      setFile(null);
      setNotes("");
      if (inputRef.current) inputRef.current.value = "";
      await refreshList();
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      // 详细诊断日志,帮用户排查 CORS / 鉴权 / 网络问题
      console.error("[ProposalUploader] 上传失败", {
        activityId,
        fileName: file?.name,
        fileSize: file?.size,
        fileType: file?.type,
        path,
        error: err,
        // 常见原因提示
        hints: [
          raw.includes("Failed to fetch") || raw.includes("NetworkError")
            ? "网络/CORS:浏览器无法访问 Supabase Storage,请检查 Storage → CORS 配置"
            : null,
          raw.includes("401") || raw.includes("Unauthorized")
            ? "鉴权:anon key 无效,检查 Secrets"
            : null,
          raw.includes("403") || raw.includes("Forbidden")
            ? "权限:Storage RLS 不允许 anon 上传,跑 supabase/storage.sql"
            : null,
          raw.includes("413") || raw.includes("Payload Too Large")
            ? "文件超过 20MB"
            : null,
        ].filter(Boolean),
      });
      toast.error("上传失败:" + raw, { duration: 6000 });
    } finally {
      setUploading(false);
      setPending(false);
    }
  }

  function onSubmit() {
    if (!file) {
      toast.warning("请先选择文件");
      return;
    }
    const a = getActor();
    if (!a) {
      setPending(true);
      setPromptOpen(true);
      return;
    }
    doUpload(a);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <div
        className={`flex flex-col items-center justify-center rounded-md border-2 border-dashed px-4 py-6 text-center text-sm transition-colors ${
          dragOver ? "border-primary bg-accent" : "border-input"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          pickFile(e.dataTransfer.files?.[0] ?? null);
        }}
      >
        <Upload className="mb-2 h-5 w-5 text-muted-foreground" />
        <div className="text-muted-foreground">
          拖拽文件到此处,或
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="ml-1 font-medium text-primary underline-offset-2 hover:underline"
          >
            点击选择
          </button>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          支持 PDF / Word / PPT / Excel / ZIP,单文件 ≤ 20MB
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {file && (
        <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <div className="min-w-0 flex-1 truncate">
            <div className="truncate font-medium">{file.name}</div>
            <div className="text-xs text-muted-foreground">{fmtBytes(file.size)}</div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setFile(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="h-7 w-7"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="grid gap-1.5">
        <Label htmlFor="proposal-notes">备注 (可选)</Label>
        <Textarea
          id="proposal-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="例如:第二版,补充预算明细"
          rows={2}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={onSubmit} disabled={!file || uploading}>
          <Upload className="mr-1 h-4 w-4" />
          {uploading ? "上传中..." : file ? `上传新版本` : "请先选择文件"}
        </Button>
      </div>

      <ActorPrompt
        open={promptOpen}
        onOpenChange={(v) => {
          setPromptOpen(v);
          if (!v) setPending(false);
        }}
        onResolved={(actor) => {
          if (pending) doUpload(actor);
        }}
      />
    </div>
  );
}