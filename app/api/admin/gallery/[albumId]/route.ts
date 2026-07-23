import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { adminGalleryAlbumSchema } from '@/lib/schemas/admin';
import { requireAdminAccess } from '@/lib/supabase/admin';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ albumId: string }> }
) {
  const access = await requireAdminAccess(['manage_gallery', 'manage_content']);

  if ('error' in access) {
    return access.error;
  }

  const { albumId } = await context.params;
  const body = await request.json();
  const parsed = adminGalleryAlbumSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten(), message: 'Invalid gallery album data.' },
      { status: 400 }
    );
  }

  const { error } = await access.supabase
    .from('gallery_albums')
    .update({
      title: parsed.data.title,
      slug: parsed.data.slug,
      category: parsed.data.category,
      description: parsed.data.description || null,
      cover_url: parsed.data.coverUrl || null,
      is_featured: parsed.data.isFeatured,
      is_active: parsed.data.isActive
    })
    .eq('id', albumId);

  if (error) {
    return NextResponse.json(
      { ok: false, message: 'Unable to update this gallery album right now.' },
      { status: 502 }
    );
  }

  revalidatePath('/admin');
  revalidatePath('/admin/gallery');
  revalidatePath('/gallery');

  return NextResponse.json({ ok: true, message: 'Gallery album updated successfully.' });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ albumId: string }> }
) {
  const access = await requireAdminAccess(['manage_gallery', 'manage_content']);

  if ('error' in access) {
    return access.error;
  }

  const { albumId } = await context.params;

  const { data: existingAlbum } = await access.supabase
    .from('gallery_albums')
    .select('title')
    .eq('id', albumId)
    .maybeSingle();

  if (!existingAlbum) {
    return NextResponse.json(
      { ok: false, message: 'This gallery album could not be found. Refresh and try again.' },
      { status: 404 }
    );
  }

  const { error } = await access.supabase
    .from('gallery_albums')
    .delete()
    .eq('id', albumId);

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error.message || 'Unable to delete this gallery album right now.'
      },
      { status: 502 }
    );
  }

  revalidatePath('/admin');
  revalidatePath('/admin/gallery');
  revalidatePath('/gallery');

  return NextResponse.json({
    ok: true,
    message: `Gallery album "${existingAlbum.title}" deleted successfully.`
  });
}
