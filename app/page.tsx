"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Calendar } from "@/components/Calendar";
import { ActivityCard } from "@/components/ActivityCard";
import {
  FilterChips,
  applyFilter,
  type FilterState,
} from "@/components/FilterChips";
import { EmptyState } from "@/components/EmptyState";
import { fetchActivities, fetchSchools } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase";
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

  // 把 activities 展平成 ActivityView,只填 primary_school(协同学校留空,因为日历不显示)
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
    () => applyFilter(viewsAll, schools, filter),
    [viewsAll, schools, filter]
  );

  const upcoming = React.useMemo(() => {
    const now = Date.now();
    return views
      .filter((a) => new Date(a.starts_at).getTime() >= now - 7 * 86400_000)
      .slice(0, 8);
  }, [views]);

  const events = React.useMemo(() => views.length, [views]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">活动日历</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            四省六地七校活动统一视图,按学校 / 省份筛选追踪。
          </p>
        </div>
        <Button asChild>
          <Link href="/activities/new">
            <Plus className="mr-1 h-4 w-4" />
            新建活动
          </Link>
        </Button>
      </header>

      <Card>
        <CardContent className="space-y-4 p-4">
          <FilterChips
            schools={schools}
            value={filter}
            onChange={setFilter}
          />
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid h-[520px] place-items-center rounded-md border bg-muted text-sm text-muted-foreground">
          加载中…
        </div>
      ) : (
        <Tabs defaultValue="calendar" className="w-full">
          <TabsList>
            <TabsTrigger value="calendar">日历</TabsTrigger>
            <TabsTrigger value="list">列表</TabsTrigger>
            <TabsTrigger value="upcoming">即将进行</TabsTrigger>
          </TabsList>
          <TabsContent value="calendar">
            {views.length === 0 ? (
              <EmptyState
                title="暂无活动"
                description={
                  filter.provinces.length || filter.schoolIds.length
                    ? "当前筛选下没有活动,试试清除筛选。"
                    : "还没有任何活动,点击右上角 “新建活动” 开始。"
                }
                action={
                  <Button asChild>
                    <Link href="/activities/new">
                      <Plus className="mr-1 h-4 w-4" />
                      新建活动
                    </Link>
                  </Button>
                }
              />
            ) : (
              <Calendar activities={views} />
            )}
          </TabsContent>
          <TabsContent value="list">
            {views.length === 0 ? (
              <EmptyState title="暂无活动" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {views.map((a) => (
                  <ActivityCard key={a.id} activity={a} />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="upcoming">
            {upcoming.length === 0 ? (
              <EmptyState title="近期无活动" description="未来一周 + 正在进行的活动会显示在这里。" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((a) => (
                  <ActivityCard key={a.id} activity={a} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* 调试用:打印事件数量,避免 lint 警告未使用变量 */}
      <span className="hidden" data-events-count={events} />
    </div>
  );
}