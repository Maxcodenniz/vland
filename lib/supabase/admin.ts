import 'server-only';

import { NextResponse } from 'next/server';

import { isPrivilegedRole } from '@/lib/supabase/access';
import { hasCapability, type AppRole } from '@/lib/supabase/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function requireAdminAccess(requiredCapabilities?: string | string[]) {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return {
      error: NextResponse.json(
        {
          ok: false,
          message: 'Supabase environment variables are required for admin actions.'
        },
        { status: 503 }
      )
    };
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: NextResponse.json(
        {
          ok: false,
          message: 'You must sign in to continue.'
        },
        { status: 401 }
      )
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = (profile?.role as AppRole | undefined) ?? 'visitor';

  if (profileError || !isPrivilegedRole(role)) {
    return {
      error: NextResponse.json(
        {
          ok: false,
          message: 'Your account does not have access to this workspace.'
        },
        { status: 403 }
      )
    };
  }

  const capabilityList = Array.isArray(requiredCapabilities)
    ? requiredCapabilities
    : requiredCapabilities
      ? [requiredCapabilities]
      : [];

  if (
    capabilityList.length &&
    !capabilityList.some((capability) => hasCapability(role, capability))
  ) {
    return {
      error: NextResponse.json(
        {
          ok: false,
          message: 'Your role does not have permission to perform this action.'
        },
        { status: 403 }
      )
    };
  }

  return {
    supabase,
    user,
    role
  };
}
