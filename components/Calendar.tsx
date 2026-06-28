"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { zhCN } from "date-fns/locale/zh-CN";
import { useRouter } from "next/navigation";
import { isAllDay } from "@/lib/format";
import type { ActivityView } from "@/lib/types";

// ⚠️ react-big-calendar 默认 .rbc-event 不设 background,但它的样式表加载
// 顺序可能让 Tailwind 的 className 被覆盖。用 inline style 直接给 hex 色,
// 优先级最高,绝不失效。
const EVENT_STYLES: Record<string, { bg: string; border: string }> = {
  "双柏一中":         { bg: "#f43f5e", border: "#be123c" }, // rose-500/700
  "妥甸中学":         { bg: "#8b5cf6", border: "#6d28d9" }, // violet-500/700
  "隆德二中":         { bg: "#f59e0b", border: "#b45309" }, // amber-500/700
  "泾源高中":         { bg: "#f97316", border: "#c2410c" }, // orange-500/700
  "红湖中学":         { bg: "#10b981", border: "#047857" }, // emerald-500/700
  "平坝一中":         { bg: "#6366f1", border: "#4338ca" }, // indigo-500/700
  "官渡口镇初级中学": { bg: "#0ea5e9", border: "#0369a1" }, // sky-500/700
};
const EVENT_STYLE_FALLBACK = { bg: "#6b7280", border: "#374151" }; // gray-500/700

// react-big-calendar 访问 window,必须只在客户端运行
const RBCalendar = dynamic(
  () => import("react-big-calendar").then((m) => m.Calendar),
  {
    ssr: false,
    loading: () => <div className="h-[520px] animate-pulse rounded-md bg-muted" />,
  }
);

const locales = { "zh-CN": zhCN };

export interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: ActivityView;
}

export function buildEvents(activities: ActivityView[]): CalendarEvent[] {
  return activities.map((a) => {
    const start = new Date(a.starts_at);
    const end = a.ends_at
      ? new Date(a.ends_at)
      : new Date(start.getTime() + 3600_000);
    return {
      id: a.id,
      title: a.title,
      start,
      end,
      allDay: isAllDay(a.starts_at, a.ends_at),
      resource: a,
    };
  });
}

export function Calendar({
  activities,
  defaultView = "month",
}: {
  activities: ActivityView[];
  defaultView?: "month" | "agenda";
}) {
  const router = useRouter();
  const [localizer, setLocalizer] = React.useState<unknown>(null);

  React.useEffect(() => {
    let alive = true;
    import("react-big-calendar").then((m) => {
      if (!alive) return;
      setLocalizer(
        m.dateFnsLocalizer({
          format,
          parse,
          startOfWeek: (d: Date) => startOfWeek(d, { weekStartsOn: 1 }),
          getDay,
          locales,
        })
      );
    });
    return () => {
      alive = false;
    };
  }, []);

  const events = React.useMemo(() => buildEvents(activities), [activities]);

  function eventPropGetter(event: CalendarEvent) {
    const c =
      EVENT_STYLES[event.resource.primary_school.name] ?? EVENT_STYLE_FALLBACK;
    return {
      style: {
        backgroundColor: c.bg,
        borderColor: c.border,
        color: "#ffffff",
        borderLeftWidth: "4px",
        borderLeftStyle: "solid",
      },
    };
  }

  if (!localizer) {
    return <div className="h-[520px] animate-pulse rounded-md bg-muted" />;
  }

  // localizer 类型复杂,用 any 通过(它是 react-big-calendar 内部契约)
  const Cal = RBCalendar as unknown as React.ComponentType<
    Record<string, unknown>
  >;

  return (
    <div className="h-[calc(100vh-220px)] min-h-[520px]">
      <Cal
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView={defaultView}
        views={["month", "agenda"]}
        popup={true}
        onSelectEvent={(e: CalendarEvent) => router.push(`/activities/detail/?id=${e.id}`)}
        eventPropGetter={eventPropGetter}
        messages={{
          today: "今天",
          previous: "‹",
          next: "›",
          month: "月",
          agenda: "列表",
          date: "日期",
          time: "时间",
          event: "活动",
          allDay: "全天",
          noEventsInRange: "此范围内暂无活动",
          showMore: (n: number) => `+ ${n} 个`,
        }}
      />
    </div>
  );
}