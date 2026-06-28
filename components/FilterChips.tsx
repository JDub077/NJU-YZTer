"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  PROVINCES,
  SCHOOLS_BY_PROVINCE,
  provinceColor,
  schoolColor,
} from "@/lib/schools";

export interface FilterState {
  provinces: string[];
  schoolIds: number[];
}

export function FilterChips({
  schools,
  value,
  onChange,
}: {
  schools: { id: number; name: string; province: string }[];
  value: FilterState;
  onChange: (next: FilterState) => void;
}) {
  function toggleProvince(p: string) {
    const set = new Set(value.provinces);
    if (set.has(p)) set.delete(p);
    else set.add(p);
    onChange({ provinces: Array.from(set), schoolIds: value.schoolIds });
  }

  function toggleSchool(id: number) {
    const set = new Set(value.schoolIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange({ provinces: value.provinces, schoolIds: Array.from(set) });
  }

  const allSelected = value.provinces.length === 0 && value.schoolIds.length === 0;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground">省份:</span>
      {PROVINCES.map((p) => {
        const active = value.provinces.includes(p);
        return (
          <button
            key={p}
            type="button"
            onClick={() => toggleProvince(p)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
              active ? provinceColor(p) : "bg-background text-muted-foreground hover:bg-accent"
            )}
          >
            {p}
          </button>
        );
      })}

      <span className="ml-3 text-muted-foreground">学校:</span>
      {schools.map((s) => {
        const active = value.schoolIds.includes(s.id);
        const c = schoolColor(s.name);
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => toggleSchool(s.id)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
              active
                ? `${c.bg} ${c.text} ${c.border}`
                : "bg-background text-muted-foreground hover:bg-accent"
            )}
          >
            {s.name}
          </button>
        );
      })}

      {!allSelected && (
        <button
          type="button"
          onClick={() => onChange({ provinces: [], schoolIds: [] })}
          className="ml-1 rounded-full px-2 py-0.5 text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          清除筛选
        </button>
      )}
    </div>
  );
}

/**
 * 根据筛选条件过滤活动:
 * - 选了省份:展示 primary_school 在该省的所有活动
 * - 选了学校:展示 primary_school_id 命中或协同学校命中
 */
export function applyFilter<
  T extends { primary_school_id: number; collaborators?: { id: number }[] }
>(
  items: T[],
  schools: { id: number; province: string }[],
  filter: FilterState
): T[] {
  if (filter.provinces.length === 0 && filter.schoolIds.length === 0) return items;
  const schoolProvince = new Map(schools.map((s) => [s.id, s.province]));
  return items.filter((a) => {
    const province = schoolProvince.get(a.primary_school_id);
    if (filter.provinces.length > 0 && (!province || !filter.provinces.includes(province)))
      return false;
    if (filter.schoolIds.length > 0) {
      const hits =
        filter.schoolIds.includes(a.primary_school_id) ||
        (a.collaborators ?? []).some((c) => filter.schoolIds.includes(c.id));
      if (!hits) return false;
    }
    return true;
  });
}

export { PROVINCES, SCHOOLS_BY_PROVINCE };