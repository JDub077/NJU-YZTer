import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

let _client: SupabaseClient | null = null;

/**
 * 浏览器端 Supabase 单例。
 * 占位 env 时返回一个未连接客户端 — 调用方仍可发起请求,但会因为网络/鉴权失败,
 * 便于在尚未配置 Supabase 的开发机上跑通构建。
 */
export function getSupabase(): SupabaseClient {
  if (_client) return _client;
  _client = createClient(url, anonKey, {
    auth: { persistSession: false },
  });
  return _client;
}

export const isSupabaseConfigured =
  url.startsWith("https://") && !url.includes("placeholder") && anonKey.length > 20;