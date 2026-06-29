"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { zhCN } from "date-fns/locale/zh-CN";
import { useRouter } from "next/navigation";
import { isAllDay } from "@/lib/format";
import { schoolBgStyle } from "@/lib/schools";
import type { ActivityView } from "@/lib/types";

// ⚠️ react-big-calendar 默认 .rbc-event 不设 background,但它的样式表加载
// 顺序可能让 Tailwind 的 className 被覆盖。用 inline style 直接给 hex 色,
// 优先级最高,绝不失效。颜色由 lib/schools.SCHOOL_HEX 统一管理。
const EVENT_STYLE_FALLBACK = { bg: "#9ca3af", border: "#6b7280", color: "#ffffff" };

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
      schoolBgStyle(event.resource.primary_school.name);
    return {
      style: {
        backgroundColor: c.backgroundColor,
        color: c.color,
        borderLeftWidth: "4px",
        borderLeftStyle: "solid",
        borderLeftColor: "rgba(0,0,0,0.18)",
        borderRadius: "6px",
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