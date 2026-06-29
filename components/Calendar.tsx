"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { zhCN } from "date-fns/locale/zh-CN";
import { useRouter } from "next/navigation";
import { fmtTime, isAllDay } from "@/lib/format";
import { schoolBgStyle } from "@/lib/schools";
import type { ActivityView } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

  // 点击月历日期头 → 弹窗显示当天活动
  const [dialogDate, setDialogDate] = React.useState<Date | null>(null);
  const dialogEvents = React.useMemo(() => {
    if (!dialogDate) return [];
    const y = dialogDate.getFullYear();
    const m = dialogDate.getMonth();
    const d = dialogDate.getDate();
    return events
      .filter((e) => {
        const s = e.start;
        return (
          s.getFullYear() === y &&
          s.getMonth() === m &&
          s.getDate() === d
        );
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [dialogDate, events]);

  if (!localizer) {
    return <div className="h-[520px] animate-pulse rounded-md bg-muted" />;
  }

  // localizer 类型复杂,用 any 通过(它是 react-big-calendar 内部契约)
  const Cal = RBCalendar as unknown as React.ComponentType<
    Record<string, unknown>
  >;

  return (
    <>
      <div className="h-[820px]">
        <Cal
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          defaultView={defaultView}
          views={["month"]}
          popup={true}
          onSelectEvent={(e: CalendarEvent) => router.push(`/activities/detail/?id=${e.id}`)}
          onDrillDown={(d: Date) => setDialogDate(d)}
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

      <DayEventsDialog
        date={dialogDate}
        events={dialogEvents}
        onOpenChange={(open) => !open && setDialogDate(null)}
      />
    </>
  );
}

function DayEventsDialog({
  date,
  events,
  onOpenChange,
}: {
  date: Date | null;
  events: CalendarEvent[];
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={date !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {date && fmtDayTitle(date)} 的活动
          </DialogTitle>
          <DialogDescription>
            共 {events.length} 场活动
          </DialogDescription>
        </DialogHeader>
        {events.length === 0 ? (
          <div className="rounded-md border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            当天暂无活动
          </div>
        ) : (
          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {events.map((e) => (
              <Link
                key={e.id}
                href={`/activities/detail/?id=${e.id}`}
                className="flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/40"
              >
                <span
                  className="mt-1 h-3 w-3 shrink-0 rounded-sm"
                  style={{
                    backgroundColor: schoolBgStyle(
                      e.resource.primary_school.name
                    ).backgroundColor,
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{e.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {e.resource.primary_school.province} ·{" "}
                    {e.resource.primary_school.name}
                    {e.resource.is_collaborative &&
                      e.resource.collaborators.length > 0 && (
                        <> · +{e.resource.collaborators.length} 协同</>
                      )}
                  </div>
                </div>
                <div className="shrink-0 text-xs text-muted-foreground">
                  {fmtTime(e.start.toISOString())}
                </div>
              </Link>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function fmtDayTitle(d: Date): string {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const week = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
  return `${m} 月 ${day} 日 (周${week})`;
}