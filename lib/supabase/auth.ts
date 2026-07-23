export type AppRole = 'super_admin' | 'admin' | 'moderator' | 'visitor';

export const roleCapabilities: Record<AppRole, string[]> = {
  super_admin: ['*'],
  admin: [
    'manage_content',
    'manage_services',
    'manage_courses',
    'manage_recruitment',
    'manage_bookings',
    'manage_gallery',
    'manage_posts',
    'moderate_comments',
    'manage_settings'
  ],
  moderator: ['moderate_posts', 'moderate_comments', 'manage_gallery_media'],
  visitor: ['create_booking', 'like_post', 'comment_post', 'manage_profile']
};

export function hasCapability(role: AppRole, capability: string) {
  const permissions = roleCapabilities[role] ?? [];
  return permissions.includes('*') || permissions.includes(capability);
}
