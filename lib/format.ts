// 日期/文件大小格式化 —— 统一使用 Asia/Shanghai
import { format as dfFormat } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

const TZ = "Asia/Shanghai";
const LOCALE = "zh-CN";

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return formatInTimeZone(new Date(iso), TZ, "yyyy-MM-dd", { locale: undefined });
  } catch {
    return "—";
  }
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return formatInTimeZone(new Date(iso), TZ, "yyyy-MM-dd HH:mm");
  } catch {
    return "—";
  }
}

export function fmtDateShort(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return formatInTimeZone(new Date(iso), TZ, "MM-dd");
  } catch {
    return "—";
  }
}

export function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return formatInTimeZone(new Date(iso), TZ, "HH:mm");
  } catch {
    return "—";
  }
}

export function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const now = new Date();
  const target = new Date(iso);
  const diffMs = target.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);
  const diffHr = Math.round(diffMs / 3600000);
  const diffDay = Math.round(diffMs / 86400000);
  if (Math.abs(diffMin) < 60) return diffMin === 0 ? "刚刚" : diffMin > 0 ? `${diffMin} 分钟后` : `${-diffMin} 分钟前`;
  if (Math.abs(diffHr) < 24) return diffHr > 0 ? `${diffHr} 小时后` : `${-diffHr} 小时前`;
  return diffDay > 0 ? `${diffDay} 天后` : `${-diffDay} 天前`;
}

export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function fmtPct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

// 把活动裁剪成"全天或多日"以便日历展示
export function isAllDay(start: string, end: string | null): boolean {
  if (!end) return false;
  const s = new Date(start);
  const e = new Date(end);
  return s.getHours() === 0 && s.getMinutes() === 0 && e.getHours() === 0 && e.getMinutes() === 0;
}

// 给 ISO 字符串附加 :00 时间(用户未填时间时默认整天)
export function toLocalIsoStart(d: string, time = "00:00"): string {
  return `${d}T${time}:00+08:00`;
}

export function nowIso() {
  return new Date().toISOString();
}

export { dfFormat };