"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityCard } from "@/components/ActivityCard";
import { EmptyState } from "@/components/EmptyState";
import { fetchActivities, fetchSchools } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase";
import { fmtPct } from "@/lib/format";
import { isActivityComplete, completionRatio } from "@/lib/status";
import { provinceColor, schoolColor } from "@/lib/schools";
import { cn } from "@/lib/utils";
import type { Activity, ActivityView, School } from "@/lib/types";

interface SchoolStat {
  school: School;
  total: number;
  proposalApproved: number;
  approved: number;
  published: number;
  complete: number;
  completion: number;
}

export default function DashboardPage() {
  const [schools, setSchools] = React.useState<School[]>([]);
  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isSupabaseConfigured) {
      setError("尚未配置 Supabase");
      setLoading(false);
      return;
    }
    let alive = true;
    Promise.all([fetchSchools(), fetchActivities()])
      .then(([s, a]) => {
        if (!alive) return;
        setSchools(s);
        setActivities(a);
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

  const stats = React.useMemo<SchoolStat[]>(() => {
    const schoolMap = new Map(schools.map((s) => [s.id, s]));
    const cutoff = Date.now() - 90 * 86400_000;
    const recent = activities.filter((a) => new Date(a.starts_at).getTime() >= cutoff);

    return schools.map((s) => {
      const list = recent.filter((a) => a.primary_school_id === s.id);
      const proposalApproved = list.filter((a) => a.status_proposal === "approved").length;
      const approved = list.filter((a) => a.status_approved === "approved").length;
      const published = list.filter((a) => a.status_article === "published").length;
      const complete = list.filter((a) =>
        isActivityComplete(a.status_proposal, a.status_approved, a.status_article)
      ).length;
      const avg =
        list.length > 0
          ? list.reduce(
              (acc, a) => acc + completionRatio(a.status_proposal, a.status_approved, a.status_article),
              0
            ) / list.length
          : 0;
      return {
        school: s,
        total: list.length,
        proposalApproved,
        approved,
        published,
        complete,
        completion: avg,
      };
    });
  }, [schools, activities]);

  const overall = React.useMemo(() => {
    const total = stats.reduce((a, s) => a + s.total, 0);
    const complete = stats.reduce((a, s) => a + s.complete, 0);
    const allApproved = stats.reduce((a, s) => a + s.approved, 0);
    const allPublished = stats.reduce((a, s) => a + s.published, 0);
    return {
      total,
      complete,
      approveRate: total > 0 ? allApproved / total : 0,
      publishRate: total > 0 ? allPublished / total : 0,
    };
  }, [stats]);

  const provinceStats = React.useMemo(() => {
    const map = new Map<string, { total: number; complete: number }>();
    stats.forEach((s) => {
      const cur = map.get(s.school.province) ?? { total: 0, complete: 0 };
      cur.total += s.total;
      cur.complete += s.complete;
      map.set(s.school.province, cur);
    });
    return Array.from(map.entries()).map(([p, v]) => ({ province: p, ...v }));
  }, [stats]);

  const recent: ActivityView[] = React.useMemo(() => {
    const map = new Map(schools.map((s) => [s.id, s]));
    return [...activities]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6)
      .map((a) => {
        const ps = map.get(a.primary_school_id);
        return {
          ...a,
          primary_school: ps ?? {
            id: a.primary_school_id,
            name: "(未知)",
            province: "",
            location: "",
            created_at: "",
          },
          collaborators: [],
          proposals_count: 0,
          latest_proposal: null,
        };
      });
  }, [activities, schools]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">完成度仪表盘</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          近 90 天活动 · 各校 / 省份完成情况 · 最近新建
        </p>
      </header>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid place-items-center rounded-md border bg-muted py-16 text-sm text-muted-foreground">
          加载中…
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label="活动总数" value={overall.total} />
            <SummaryCard label="全部完成" value={overall.complete} accent />
            <SummaryCard label="审核通过率" value={fmtPct(overall.approveRate)} />
            <SummaryCard label="推文发布率" value={fmtPct(overall.publishRate)} />
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">各校完成度</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {stats.map((s) => (
                <Card key={s.school.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>{s.school.name}</span>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-xs font-medium",
                          provinceColor(s.school.province)
                        )}
                      >
                        {s.school.province}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">活动数</span>
                      <span className="font-medium">{s.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">策划案过审</span>
                      <span className="font-medium">{s.proposalApproved}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">活动审核通过</span>
                      <span className="font-medium">{s.approved}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">推文已发布</span>
                      <span className="font-medium">{s.published}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-muted-foreground">全部完成</span>
                      <span className="font-semibold text-emerald-700">{s.complete}</span>
                    </div>
                    <ProgressBar value={s.completion} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">省份汇总</h2>
            <div className="flex flex-wrap gap-3">
              {provinceStats.map((p) => (
                <div
                  key={p.province}
                  className={cn(
                    "rounded-lg border px-4 py-3",
                    provinceColor(p.province)
                  )}
                >
                  <div className="text-xs opacity-80">{p.province}</div>
                  <div className="mt-1 text-lg font-semibold">
                    {p.complete} / {p.total}
                  </div>
                  <div className="text-xs opacity-80">
                    {p.total > 0 ? fmtPct(p.complete / p.total) : "—"} 完成
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">最近新建</h2>
              <Link
                href="/"
                className="text-xs text-muted-foreground hover:underline"
              >
                查看全部
              </Link>
            </div>
            {recent.length === 0 ? (
              <EmptyState
                title="尚无活动"
                description="点击日历页右上角 “新建活动” 开始。"
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recent.map((a) => (
                  <ActivityCard key={a.id} activity={a} showDate={false} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div
          className={cn(
            "mt-1 text-2xl font-semibold",
            accent && "text-emerald-700"
          )}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="space-y-1 pt-1">
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-right text-xs text-muted-foreground">{pct}%</div>
    </div>
  );
}