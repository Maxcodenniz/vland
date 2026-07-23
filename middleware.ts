import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { canAccessAdminPath, isPrivilegedRole } from '@/lib/supabase/access';
import type { AppRole } from '@/lib/supabase/auth';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminPath = pathname.startsWith('/admin');
  const isSecureAccessPath = pathname.startsWith('/secure-access');

  if (!isAdminPath && !isSecureAccessPath) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  let role: AppRole = 'visitor';

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    role = (profile?.role as AppRole | undefined) ?? 'visitor';
  }

  if (isSecureAccessPath) {
    if (user && isPrivilegedRole(role)) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    return response;
  }

  if (!user) {
    const loginUrl = new URL('/secure-access', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!canAccessAdminPath(role, pathname)) {
    const deniedUrl = new URL('/secure-access', request.url);
    deniedUrl.searchParams.set('denied', '1');
    return NextResponse.redirect(deniedUrl);
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/secure-access/:path*']
};
