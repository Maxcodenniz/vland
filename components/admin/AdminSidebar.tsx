import Image from 'next/image';
import Link from 'next/link';

import { adminNavigation, siteConfig } from '@/lib/config/site';
import { filterAdminLinks } from '@/lib/supabase/access';
import type { AppRole } from '@/lib/supabase/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AdminLogoutButton } from '@/components/admin/AdminLogoutButton';

export async function AdminSidebar() {
  let role: AppRole = 'admin';
  const supabase = await createServerSupabaseClient();

  if (supabase) {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      role = (profile?.role as AppRole | undefined) ?? 'visitor';
    }
  }

  const visibleLinks = filterAdminLinks(adminNavigation, role);

  return (
    <aside className="admin-sidebar">
      <div className="stack">
        <span className="section-label">Dashboard</span>
        <Link className="admin-brand" href="/">
          <Image
            alt={`${siteConfig.name} logo`}
            className="logo-image"
            height={48}
            src="/logo.png"
            width={48}
          />
          <h2 style={{ margin: 0 }}>{siteConfig.name}</h2>
        </Link>
        <p className="muted" style={{ margin: 0 }}>
          Private workspace for administrators and moderators.
        </p>
        <span className="badge">{role.replace('_', ' ')}</span>
      </div>
      <nav className="admin-nav" aria-label="Admin navigation">
        {visibleLinks.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
      <div style={{ marginTop: '1.5rem' }}>
        <AdminLogoutButton />
      </div>
    </aside>
  );
}
