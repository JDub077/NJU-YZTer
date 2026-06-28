"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityForm } from "@/components/ActivityForm";
import { fetchSchools } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { School } from "@/lib/types";

export default function NewActivityPage() {
  const [schools, setSchools] = React.useState<School[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isSupabaseConfigured) {
      setError("尚未配置 Supabase,请在 .env.local 填入连接信息。");
      setLoading(false);
      return;
    }
    let alive = true;
    fetchSchools()
      .then((s) => {
        if (alive) setSchools(s);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "加载失败");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">
          ← 返回日历
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>新建活动</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">加载学校列表…</div>
          ) : (
            <ActivityForm schools={schools} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}