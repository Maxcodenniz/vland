import type { AppRole } from '@/lib/supabase/auth';

export const privilegedRoles: AppRole[] = [
  'super_admin',
  'admin',
  'moderator'
];

const moderatorAllowedPaths = [
  '/admin',
  '/admin/moderation',
  '/admin/posts',
  '/admin/gallery'
];

export function isPrivilegedRole(role: AppRole) {
  return privilegedRoles.includes(role);
}

export function canAccessAdminPath(role: AppRole, pathname: string) {
  if (role === 'super_admin' || role === 'admin') {
    return true;
  }

  if (role === 'moderator') {
    return moderatorAllowedPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    );
  }

  return false;
}

export function filterAdminLinks<T extends { href: string }>(
  links: readonly T[],
  role: AppRole
) {
  return links.filter((link) => canAccessAdminPath(role, link.href));
}
