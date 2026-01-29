import { createClient, SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Supabase 연결 여부 확인
export function isSupabaseConfigured(): boolean {
  const configured = Boolean(supabaseUrl && supabaseAnonKey)
  console.log("[Supabase] Configured:", configured)
  console.log("[Supabase] URL:", supabaseUrl ? "SET" : "NOT SET")
  console.log("[Supabase] Key:", supabaseAnonKey ? "SET" : "NOT SET")
  return configured
}

// Supabase 클라이언트 (설정되어 있을 때만 생성)
let _supabase: SupabaseClient | null = null

export const supabase: SupabaseClient = (() => {
  if (supabaseUrl && supabaseAnonKey) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey)
    console.log("[Supabase] Client created successfully")
  } else {
    console.warn("[Supabase] Client not created - missing URL or Key")
    // 더미 클라이언트 반환 (에러 방지)
    _supabase = createClient("https://placeholder.supabase.co", "placeholder-key")
  }
  return _supabase
})()
