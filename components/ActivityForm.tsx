"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getSupabase as gs } from "@/lib/supabase";
import { getActor } from "@/lib/actor";
import { logAudit } from "@/lib/data";
import type { School } from "@/lib/types";
import { ActorPrompt } from "./ActorPrompt";

export function ActivityForm({ schools }: { schools: School[] }) {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [primarySchoolId, setPrimarySchoolId] = React.useState<number | "">("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [isCollab, setIsCollab] = React.useState(false);
  const [collabIds, setCollabIds] = React.useState<Set<number>>(new Set());
  const [saving, setSaving] = React.useState(false);
  const [promptOpen, setPromptOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const valid = title.trim() && primarySchoolId !== "" && startDate;

  async function doCreate(actor: string) {
    if (!valid) {
      toast.warning("请填写标题、主办学校、开始日期");
      return;
    }
    setSaving(true);
    const sb = gs();
    const startsAt = `${startDate}T00:00:00+08:00`;
    const endsAt = endDate ? `${endDate}T23:59:59+08:00` : null;

    const { data: created, error } = await sb
      .from("activities")
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        primary_school_id: primarySchoolId,
        starts_at: startsAt,
        ends_at: endsAt,
        is_collaborative: isCollab,
        created_by: actor,
        updated_by: actor,
      })
      .select("*")
      .single();
    if (error) {
      setSaving(false);
      toast.error("创建失败:" + error.message);
      return;
    }

    if (isCollab && collabIds.size > 0) {
      const rows = Array.from(collabIds).map((sid) => ({
        activity_id: (created as { id: number }).id,
        school_id: sid,
      }));
      const { error: ce } = await sb.from("activity_collaborators").insert(rows);
      if (ce) {
        toast.error("协同学校关联失败:" + ce.message);
      }
    }

    await logAudit({
      actor,
      action: "create_activity",
      entity_type: "activity",
      entity_id: (created as { id: number }).id,
      diff: { title: title.trim(), primary_school_id: primarySchoolId },
    });

    toast.success("活动已创建");
    setSaving(false);
    setPending(false);
    router.push(`/activities/detail/?id=${(created as { id: number }).id}`);
  }

  function onSubmit() {
    const a = getActor();
    if (!a) {
      setPending(true);
      setPromptOpen(true);
      return;
    }
    doCreate(a);
  }

  return (
    <div className="grid gap-4">
      <Field label="活动标题 *">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如:双柏一中校园文化节"
          maxLength={120}
        />
      </Field>

      <Field label="活动描述">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="参与对象 / 主要内容 / 目标"
          rows={3}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="主办学校 *">
          <Select
            value={primarySchoolId === "" ? undefined : String(primarySchoolId)}
            onValueChange={(v) => setPrimarySchoolId(Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择学校" />
            </SelectTrigger>
            <SelectContent>
              {schools.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.province} · {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="开始日期 *">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field label="结束日期 (可选)">
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </Field>
      </div>

      <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
        <Checkbox
          id="is-collab"
          checked={isCollab}
          onCheckedChange={(v) => setIsCollab(v === true)}
        />
        <Label htmlFor="is-collab" className="cursor-pointer">
          协同活动 (多校联合)
        </Label>
      </div>

      {isCollab && (
        <Field label="协同学校 (可多选)">
          <div className="grid gap-2 sm:grid-cols-2">
            {schools
              .filter((s) => s.id !== primarySchoolId)
              .map((s) => {
                const checked = collabIds.has(s.id);
                return (
                  <label
                    key={s.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-accent/50",
                      checked && "border-primary bg-accent"
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        const next = new Set(collabIds);
                        if (v === true) next.add(s.id);
                        else next.delete(s.id);
                        setCollabIds(next);
                      }}
                    />
                    <span>
                      {s.province} · {s.name}
                    </span>
                  </label>
                );
              })}
          </div>
        </Field>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={() => router.back()} type="button">
          取消
        </Button>
        <Button onClick={onSubmit} disabled={!valid || saving}>
          {saving ? "保存中..." : "创建活动"}
        </Button>
      </div>

      <ActorPrompt
        open={promptOpen}
        onOpenChange={(v) => {
          setPromptOpen(v);
          if (!v) setPending(false);
        }}
        onResolved={(actor) => {
          if (pending) doCreate(actor);
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