import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return { supabaseUrl, supabaseAnonKey };
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const env = getSupabaseEnv();

  if (!env) {
    return null;
  }

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server component renders can read cookies but cannot mutate them.
          // Route handlers and server actions still perform the actual write.
        }
      },
      remove(name: string, options: Record<string, unknown>) {
        try {
          cookieStore.set({ name, value: '', ...options, maxAge: 0 });
        } catch {
          // Ignore cookie mutation attempts outside request mutation contexts.
        }
      }
    }
  });
}

export function createPublicServerSupabaseClient() {
  const env = getSupabaseEnv();

  if (!env) {
    return null;
  }

  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
