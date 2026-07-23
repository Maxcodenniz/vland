import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { adminGalleryAlbumSchema } from '@/lib/schemas/admin';
import { requireAdminAccess } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const access = await requireAdminAccess(['manage_gallery', 'manage_content']);

  if ('error' in access) {
    return access.error;
  }

  const body = await request.json();
  const parsed = adminGalleryAlbumSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten(), message: 'Invalid gallery album data.' },
      { status: 400 }
    );
  }

  const { error } = await access.supabase.from('gallery_albums').insert({
    title: parsed.data.title,
    slug: parsed.data.slug,
    category: parsed.data.category,
    description: parsed.data.description || null,
    cover_url: parsed.data.coverUrl || null,
    is_featured: parsed.data.isFeatured,
    is_active: parsed.data.isActive
  });

  if (error) {
    return NextResponse.json(
      { ok: false, message: 'Unable to create this gallery album right now.' },
      { status: 502 }
    );
  }

  revalidatePath('/admin');
  revalidatePath('/admin/gallery');
  revalidatePath('/gallery');

  return NextResponse.json({ ok: true, message: 'Gallery album created successfully.' });
}
