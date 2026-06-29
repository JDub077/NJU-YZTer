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
// 优先级最高,绝不失效。降饱和方案:300 系背景 + 400 系 border。
const EVENT_STYLES: Record<string, { bg: string; border: string }> = {
  "双柏一中":         { bg: "#fda4af", border: "#fb7185" }, // rose-300/400
  "妥甸中学":         { bg: "#c4b5fd", border: "#a78bfa" }, // violet-300/400
  "隆德二中":         { bg: "#fcd34d", border: "#fbbf24" }, // amber-300/400
  "泾源高中":         { bg: "#fdba74", border: "#fb923c" }, // orange-300/400
  "红湖中学":         { bg: "#6ee7b7", border: "#34d399" }, // emerald-300/400
  "平坝一中":         { bg: "#a5b4fc", border: "#818cf8" }, // indigo-300/400
  "官渡口镇初级中学": { bg: "#7dd3fc", border: "#38bdf8" }, // sky-300/400
};
const EVENT_STYLE_FALLBACK = { bg: "#d1d5db", border: "#9ca3af" }; // gray-300/400

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
  defaultView?: "month";
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
        color: "#1f2937", // gray-800:深字保证可读性
        borderLeftWidth: "4px",
        borderLeftStyle: "solid",
        borderRadius: "4px",
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
        views={["month"]}
        popup={true}
        onSelectEvent={(e: CalendarEvent) => router.push(`/activities/detail/?id=${e.id}`)}
        eventPropGetter={eventPropGetter}
        messages={{
          today: "今天",
          previous: "‹",
          next: "›",
          month: "月",
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