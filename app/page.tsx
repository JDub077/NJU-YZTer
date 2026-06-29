"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/Calendar";
import { Sidebar } from "@/components/Sidebar";
import {
  applyFilter,
  type FilterState,
} from "@/components/FilterChips";
import { fetchActivities, fetchSchools } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  matchesStage,
  sortByStartAsc,
  type StageFilter,
} from "@/lib/stages";
import type { Activity, ActivityView, School } from "@/lib/types";

export default function HomePage() {
  const [schools, setSchools] = React.useState<School[]>([]);
  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<FilterState>({
    provinces: [],
    schoolIds: [],
  });
  const [stage, setStage] = React.useState<StageFilter>("all");

  React.useEffect(() => {
    if (!isSupabaseConfigured) {
      setError(
        "尚未配置 Supabase。请在 .env.local 填入 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY。"
      );
      setLoading(false);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const [s, a] = await Promise.all([fetchSchools(), fetchActivities()]);
        if (!alive) return;
        setSchools(s);
        setActivities(a);
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const viewsAll: ActivityView[] = React.useMemo(() => {
    const map = new Map(schools.map((s) => [s.id, s]));
    return activities.map((a) => {
      const ps = map.get(a.primary_school_id);
      return {
        ...a,
        primary_school: ps ?? {
          id: a.primary_school_id,
          name: "(未知学校)",
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

  const views = React.useMemo(
    () =>
      applyFilter(viewsAll, schools, filter)
        .filter((a) => matchesStage(a, stage))
        .sort((a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
        ),
    [viewsAll, schools, filter, stage]
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar
        schools={schools}
        filter={filter}
        onFilterChange={setFilter}
        stage={stage}
        onStageChange={setStage}
      />

      <main className="flex-1 overflow-hidden">
        <div className="mx-auto flex h-full max-w-full flex-col gap-4 px-6 py-6">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">活动日历</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                四省六地七校 · 共 {views.length} 场活动
              </p>
            </div>
            <Button asChild>
              <Link href="/activities/new">
                <Plus className="mr-1 h-4 w-4" />
                新建活动
              </Link>
            </Button>
          </header>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid h-[640px] place-items-center rounded-2xl border bg-card text-sm text-muted-foreground">
              加载中…
            </div>
          ) : views.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                <div className="text-base font-medium">暂无活动</div>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {filter.provinces.length || filter.schoolIds.length || stage !== "all"
                    ? "当前筛选下没有活动,试试清除筛选。"
                    : "还没有任何活动,点击右上角 “新建活动” 开始。"}
                </p>
                <Button asChild>
                  <Link href="/activities/new">
                    <Plus className="mr-1 h-4 w-4" />
                    新建活动
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="flex-1">
              <Calendar activities={views} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}