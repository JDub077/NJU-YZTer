"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getActor, setActor } from "@/lib/actor";

/**
 * 首次写操作时弹出,让用户输入"操作人"姓名。
 * 之后存 localStorage,后续写操作直接用。
 * 提供 onResolved / onCancel 让调用方决定后续动作。
 */
export function ActorPrompt({
  open,
  onOpenChange,
  onResolved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onResolved: (actor: string) => void;
}) {
  const [name, setName] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setName(getActor() ?? "");
      setErr(null);
    }
  }, [open]);

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setErr("请输入姓名 / 昵称");
      return;
    }
    setActor(trimmed);
    onOpenChange(false);
    onResolved(trimmed);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>登记操作人</DialogTitle>
          <DialogDescription>
            平台公开,所有写操作都会记录操作人姓名,便于追溯。请输入您的姓名或昵称(本机记住,下次自动填)。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="actor-name">姓名 / 昵称</Label>
          <Input
            id="actor-name"
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErr(null);
            }}
            placeholder="例如:张三、双柏一小李"
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
          />
          {err && <p className="text-xs text-destructive">{err}</p>}
        </div>
        <DialogFooter>
          <Button onClick={submit}>确认</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}