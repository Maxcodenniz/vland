import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { isPrivilegedRole } from '@/lib/supabase/access';
import type { AppRole } from '@/lib/supabase/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function DashboardLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const supabase = await createServerSupabaseClient();

  if (supabase) {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/secure-access?redirectTo=/admin');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = (profile?.role as AppRole | undefined) ?? 'visitor';

    if (!isPrivilegedRole(role)) {
      redirect('/secure-access?denied=1');
    }
  }

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <main className="admin-main">{children}</main>
    </div>
  );
}
