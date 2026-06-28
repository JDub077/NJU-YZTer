"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { zhCN } from "date-fns/locale/zh-CN";
import { useRouter } from "next/navigation";
import { isAllDay } from "@/lib/format";
import type { ActivityView } from "@/lib/types";

// ⚠️ Tailwind v4 只扫描源代码中的字面量字符串,模板拼接看不到。
// 这里必须显式列出每个学校完整的 className 字符串,否则日历事件不会着色。
const EVENT_CLASSES: Record<string, string> = {
  "双柏一中":         "bg-rose-500 border-rose-700 text-white",
  "妥甸中学":         "bg-violet-500 border-violet-700 text-white",
  "隆德二中":         "bg-amber-500 border-amber-700 text-white",
  "泾源高中":         "bg-orange-500 border-orange-700 text-white",
  "红湖中学":         "bg-emerald-500 border-emerald-700 text-white",
  "平坝一中":         "bg-cyan-500 border-cyan-700 text-white",
  "官渡口镇初级中学": "bg-sky-500 border-sky-700 text-white",
};
const EVENT_CLASS_FALLBACK = "bg-gray-500 border-gray-700 text-white";

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
    const base =
      EVENT_CLASSES[event.resource.primary_school.name] ?? EVENT_CLASS_FALLBACK;
    return { className: `${base} border-l-4` };
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