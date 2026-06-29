"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  Plus,
  Filter,
  ListChecks,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PROVINCES,
  SCHOOLS_BY_PROVINCE,
  schoolColorLight,
  provinceColor,
} from "@/lib/schools";
import {
  type StageFilter,
  STAGE_OPTIONS,
} from "@/lib/stages";
import { getActor, clearActor } from "@/lib/actor";

interface SidebarProps {
  schools: { id: number; name: string; province: string }[];
  filter: { provinces: string[]; schoolIds: number[] };
  onFilterChange: (next: { provinces: string[]; schoolIds: number[] }) => void;
  stage: StageFilter;
  onStageChange: (s: StageFilter) => void;
}

export function Sidebar({
  schools,
  filter,
  onFilterChange,
  stage,
  onStageChange,
}: SidebarProps) {
  const pathname = usePathname();
  const [actor, setActor] = React.useState<string | null>(null);

  React.useEffect(() => {
    setActor(getActor());
  }, [pathname]);

  function toggleProvince(p: string) {
    const set = new Set(filter.provinces);
    if (set.has(p)) set.delete(p);
    else set.add(p);
    onFilterChange({ provinces: Array.from(set), schoolIds: filter.schoolIds });
  }

  function toggleSchool(id: number) {
    const set = new Set(filter.schoolIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onFilterChange({ provinces: filter.provinces, schoolIds: Array.from(set) });
  }

  const navItems = [
    { href: "/", label: "日历", icon: CalendarDays, exact: true },
    { href: "/dashboard", label: "仪表盘", icon: LayoutDashboard },
    { href: "/activities/new", label: "新建活动", icon: Plus },
  ];

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card md:flex md:flex-col">
      {/* Logo 区 */}
      <div className="flex h-16 items-center gap-3 border-b px-5">
        <img
          src="/NJU-YZTer/logo.png"
          alt="校徽"
          width={36}
          height={36}
          className="h-9 w-9 rounded-xl object-contain ring-1 ring-border"
        />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">研支团协同</div>
          <div className="truncate text-xs text-muted-foreground">活动统一视图</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 p-3 text-sm">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 省份 / 学校筛选(仅主页显示) */}
      {(pathname === "/" || pathname === "/dashboard") && (
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <div className="mb-2 flex items-center gap-1.5 px-3 text-xs font-medium text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            筛选
          </div>

          <div className="mb-3 rounded-xl bg-muted/40 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Building2 className="h-3 w-3" />
              省份
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PROVINCES.map((p) => {
                const active = filter.provinces.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggleProvince(p)}
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-xs transition-colors",
                      active
                        ? provinceColor(p)
                        : "bg-background text-muted-foreground hover:bg-accent"
                    )}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-3 rounded-xl bg-muted/40 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Building2 className="h-3 w-3" />
              学校
            </div>
            <div className="flex flex-col gap-1">
              {schools.map((s) => {
                const active = filter.schoolIds.includes(s.id);
                const c = schoolColorLight(s.name);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSchool(s.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-2 py-1 text-left text-xs transition-colors",
                      active
                        ? `${c.bg} ${c.text} ${c.border}`
                        : "bg-background text-muted-foreground hover:bg-accent"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-2 w-2 shrink-0 rounded-full",
                        c.bg.replace("-100", "-400")
                      )}
                    />
                    <span className="truncate">{s.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-3 rounded-xl bg-muted/40 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <ListChecks className="h-3 w-3" />
              阶段
            </div>
            <div className="flex flex-col gap-1">
              {STAGE_OPTIONS.map((opt) => {
                const active = stage === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onStageChange(opt.value)}
                    className={cn(
                      "rounded-lg border px-2 py-1 text-left text-xs transition-colors",
                      active
                        ? opt.tone
                        : "bg-background text-muted-foreground hover:bg-accent"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {(filter.provinces.length > 0 || filter.schoolIds.length > 0 || stage !== "all") && (
            <button
              type="button"
              onClick={() => {
                onFilterChange({ provinces: [], schoolIds: [] });
                onStageChange("all");
              }}
              className="w-full rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              清除所有筛选
            </button>
          )}
        </div>
      )}

      {/* 底部:操作人 */}
      <div className="border-t p-3">
        {actor ? (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2 text-xs">
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{actor}</div>
              <div className="text-muted-foreground">当前操作人</div>
            </div>
            <button
              type="button"
              onClick={() => {
                clearActor();
                setActor(null);
              }}
              className="shrink-0 rounded-md px-2 py-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              切换
            </button>
          </div>
        ) : (
          <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700 ring-1 ring-amber-200">
            未登记操作人(首次写入时会弹窗)
          </div>
        )}
      </div>
    </aside>
  );
}