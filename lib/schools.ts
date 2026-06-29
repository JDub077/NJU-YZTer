import type { School } from "./types";

// 7 所学校 → 用户指定的调色板 hex(用于所有场景)
export const SCHOOL_HEX: Record<string, { bg: string; light: string; text: string }> = {
  "双柏一中":         { bg: "#5A6E5D", light: "#DDE3DD", text: "#FFFFFF" }, // 深绿灰
  "妥甸中学":         { bg: "#A19245", light: "#E8E2C8", text: "#FFFFFF" }, // 橄榄黄
  "隆德二中":         { bg: "#F2D057", light: "#FAF1C7", text: "#3F2E00" }, // 金黄(浅底深字)
  "泾源高中":         { bg: "#F5EB9A", light: "#FBF7D7", text: "#3F2E00" }, // 浅米黄
  "红湖中学":         { bg: "#ECA056", light: "#F8DDB9", text: "#3F1F00" }, // 杏色
  "平坝一中":         { bg: "#98BDD3", light: "#DDEBF3", text: "#0F2A3A" }, // 浅蓝
  "官渡口镇初级中学": { bg: "#E3E5DE", light: "#F2F3EF", text: "#1F2937" }, // 浅灰米
};

export const SCHOOLS_BY_PROVINCE: Record<string, string[]> = {
  云南: ["双柏一中", "妥甸中学"],
  宁夏: ["隆德二中", "泾源高中"],
  贵州: ["红湖中学", "平坝一中"],
  湖北: ["官渡口镇初级中学"],
};

export const PROVINCES = Object.keys(SCHOOLS_BY_PROVINCE);

export const PROVINCE_COLORS: Record<string, string> = {
  云南: "bg-rose-50 text-rose-700 border-rose-200",
  宁夏: "bg-amber-50 text-amber-700 border-amber-200",
  贵州: "bg-emerald-50 text-emerald-700 border-emerald-200",
  湖北: "bg-sky-50 text-sky-700 border-sky-200",
};

// 兼容旧 API(SCHOOL_COLORS / SCHOOL_COLORS_LIGHT),返回 Tailwind class 名(用 bg-rose-100 之类占位)
// 实际渲染请优先用 schoolBgStyle() / schoolLightBgStyle()
export const SCHOOL_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  "双柏一中":         { bg: "bg-[#5A6E5D]", border: "border-[#3F4F41]", text: "text-white" },
  "妥甸中学":         { bg: "bg-[#A19245]", border: "border-[#7B6E33]", text: "text-white" },
  "隆德二中":         { bg: "bg-[#F2D057]", border: "border-[#C7A938]", text: "text-[#3F2E00]" },
  "泾源高中":         { bg: "bg-[#F5EB9A]", border: "border-[#C9BE7A]", text: "text-[#3F2E00]" },
  "红湖中学":         { bg: "bg-[#ECA056]", border: "border-[#BF7E36]", text: "text-[#3F1F00]" },
  "平坝一中":         { bg: "bg-[#98BDD3]", border: "border-[#6B98AF]", text: "text-[#0F2A3A]" },
  "官渡口镇初级中学": { bg: "bg-[#E3E5DE]", border: "border-[#B0B5A8]", text: "text-[#1F2937]" },
};

export const SCHOOL_COLORS_LIGHT: Record<string, { bg: string; border: string; text: string }> = {
  "双柏一中":         { bg: "bg-[#DDE3DD]", border: "border-[#B5BFB6]", text: "text-[#2A3A2D]" },
  "妥甸中学":         { bg: "bg-[#E8E2C8]", border: "border-[#BFB595]", text: "text-[#5C4F22]" },
  "隆德二中":         { bg: "bg-[#FAF1C7]", border: "border-[#D9C682]", text: "text-[#5C4300]" },
  "泾源高中":         { bg: "bg-[#FBF7D7]", border: "border-[#DBD49E]", text: "text-[#5C4D1A]" },
  "红湖中学":         { bg: "bg-[#F8DDB9]", border: "border-[#D9B285]", text: "text-[#5C2F00]" },
  "平坝一中":         { bg: "bg-[#DDEBF3]", border: "border-[#A5C0D2]", text: "text-[#1F3F52]" },
  "官渡口镇初级中学": { bg: "bg-[#F2F3EF]", border: "border-[#C0C4BB]", text: "text-[#2A2D26]" },
};

/** 返回 inline style —— 用于日历事件/月历色块 */
export function schoolBgStyle(name: string): { backgroundColor: string; color: string } {
  const c = SCHOOL_HEX[name] ?? SCHOOL_HEX["双柏一中"];
  return { backgroundColor: c.bg, color: c.text };
}

/** 返回 inline style —— 用于卡片/chip 浅底场景 */
export function schoolLightBgStyle(name: string): { backgroundColor: string; color: string } {
  const c = SCHOOL_HEX[name] ?? SCHOOL_HEX["双柏一中"];
  return { backgroundColor: c.light, color: c.text };
}

export function schoolColor(name: string) {
  return SCHOOL_COLORS[name] ?? { bg: "bg-gray-300", border: "border-gray-400", text: "text-gray-900" };
}

export function schoolColorLight(name: string) {
  return SCHOOL_COLORS_LIGHT[name] ?? { bg: "bg-gray-100", border: "border-gray-200", text: "text-gray-800" };
}

export function provinceColor(province: string) {
  return PROVINCE_COLORS[province] ?? "bg-gray-50 text-gray-700 border-gray-200";
}

export function provinceOf(school: School): string {
  return school.province;
}