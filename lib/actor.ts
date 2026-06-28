// 操作人识别 —— 无登录环境下的轻量身份
// 首次写操作时弹窗输入,后续存 localStorage
// 服务端渲染时无 localStorage,所有调用都安全返回 null/false

const KEY = "yzter_actor";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getActor(): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setActor(name: string): void {
  if (!isBrowser()) return;
  const trimmed = name.trim();
  if (!trimmed) return;
  try {
    window.localStorage.setItem(KEY, trimmed);
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function clearActor(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function hasActor(): boolean {
  return getActor() !== null;
}