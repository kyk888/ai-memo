import { createClient, SupabaseClient } from '@supabase/supabase-js'

// 서버 액션에서만 사용하는 Supabase 클라이언트 (세션 미사용)
export const createSupabaseClient = (): SupabaseClient => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.')
  }

  return createClient(url, anonKey, { auth: { persistSession: false } })
}
