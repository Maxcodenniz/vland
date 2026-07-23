import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { adminGalleryMediaUpdateSchema } from '@/lib/schemas/admin';
import { requireAdminAccess } from '@/lib/supabase/admin';

function toRecord(data: {
  id: string;
  album_id: string | null;
  title: string;
  media_type: string;
  file_path: string;
  thumbnail_path: string | null;
  alt_text: string | null;
  sort_order: number;
  is_featured: boolean;
}) {
  return {
    id: data.id,
    albumId: data.album_id,
    title: data.title,
    mediaType: data.media_type === 'video' ? 'video' : 'image',
    fileUrl: data.file_path,
    thumbnailUrl: data.thumbnail_path ?? data.file_path,
    altText: data.alt_text ?? data.title,
    sortOrder: data.sort_order,
    isFeatured: data.is_featured
  };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ mediaId: string }> }
) {
  const access = await requireAdminAccess(['manage_gallery', 'manage_gallery_media']);

  if ('error' in access) {
    return access.error;
  }

  const { mediaId } = await context.params;
  const body = await request.json();
  const parsed = adminGalleryMediaUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten(), message: 'Invalid gallery media data.' },
      { status: 400 }
    );
  }

  const { data, error } = await access.supabase
    .from('gallery_media')
    .update({
      title: parsed.data.title,
      media_type: parsed.data.mediaType,
      file_path: parsed.data.fileUrl,
      thumbnail_path: parsed.data.thumbnailUrl || null,
      alt_text: parsed.data.altText || null,
      sort_order: parsed.data.sortOrder,
      is_featured: parsed.data.isFeatured
    })
    .eq('id', mediaId)
    .select(
      'id, album_id, title, media_type, file_path, thumbnail_path, alt_text, sort_order, is_featured'
    )
    .single();

  if (error || !data) {
    return NextResponse.json(
      { ok: false, message: 'Unable to update this media item right now.' },
      { status: 502 }
    );
  }

  revalidatePath('/admin');
  revalidatePath('/admin/gallery');
  revalidatePath('/gallery');

  return NextResponse.json({
    ok: true,
    message: 'Media item updated successfully.',
    record: toRecord(data)
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ mediaId: string }> }
) {
  const access = await requireAdminAccess(['manage_gallery', 'manage_gallery_media']);

  if ('error' in access) {
    return access.error;
  }

  const { mediaId } = await context.params;

  const { data: existingMedia } = await access.supabase
    .from('gallery_media')
    .select(
      'id, album_id, title, media_type, file_path, thumbnail_path, alt_text, sort_order, is_featured'
    )
    .eq('id', mediaId)
    .maybeSingle();

  if (!existingMedia) {
    return NextResponse.json(
      { ok: false, message: 'This media item could not be found. Refresh and try again.' },
      { status: 404 }
    );
  }

  const { error } = await access.supabase.from('gallery_media').delete().eq('id', mediaId);

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message || 'Unable to delete this media item right now.' },
      { status: 502 }
    );
  }

  revalidatePath('/admin');
  revalidatePath('/admin/gallery');
  revalidatePath('/gallery');

  return NextResponse.json({
    ok: true,
    message: `Media item "${existingMedia.title}" deleted successfully.`,
    record: toRecord(existingMedia)
  });
}
