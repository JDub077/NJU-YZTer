import type { School } from "./types";

// 省份 → 学校的固定映射,与 db/seed.sql 顺序对应
export const SCHOOLS_BY_PROVINCE: Record<string, string[]> = {
  云南: ["双柏一中", "妥甸中学"],
  宁夏: ["隆德二中", "泾源高中"],
  贵州: ["红湖中学", "平坝一中"],
  湖北: ["官渡口镇初级中学"],
};

export const PROVINCES = Object.keys(SCHOOLS_BY_PROVINCE);

// 给 7 所学校分配稳定的调色板(用于日历事件着色)
// 颜色采用 Tailwind 语义风格,在 CSS 中通过 className 引用
export const SCHOOL_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  "双柏一中":         { bg: "bg-rose-100",   border: "border-rose-300",   text: "text-rose-900"   },
  "妥甸中学":         { bg: "bg-pink-100",   border: "border-pink-300",   text: "text-pink-900"   },
  "隆德二中":         { bg: "bg-amber-100",  border: "border-amber-300",  text: "text-amber-900"  },
  "泾源高中":         { bg: "bg-yellow-100", border: "border-yellow-300", text: "text-yellow-900" },
  "红湖中学":         { bg: "bg-emerald-100",border: "border-emerald-300",text: "text-emerald-900"},
  "平坝一中":         { bg: "bg-teal-100",   border: "border-teal-300",   text: "text-teal-900"   },
  "官渡口镇初级中学": { bg: "bg-sky-100",    border: "border-sky-300",    text: "text-sky-900"    },
};

// 给省份分配一个摘要色(用于仪表盘省份 chip)
export const PROVINCE_COLORS: Record<string, string> = {
  云南: "bg-rose-50 text-rose-700 border-rose-200",
  宁夏: "bg-amber-50 text-amber-700 border-amber-200",
  贵州: "bg-emerald-50 text-emerald-700 border-emerald-200",
  湖北: "bg-sky-50 text-sky-700 border-sky-200",
};

export function schoolColor(name: string) {
  return SCHOOL_COLORS[name] ?? { bg: "bg-gray-100", border: "border-gray-300", text: "text-gray-900" };
}

export function provinceColor(province: string) {
  return PROVINCE_COLORS[province] ?? "bg-gray-50 text-gray-700 border-gray-200";
}

export function provinceOf(school: School): string {
  return school.province;
}