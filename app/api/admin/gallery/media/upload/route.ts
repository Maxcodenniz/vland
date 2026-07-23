import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { requireAdminAccess } from '@/lib/supabase/admin';

const MAX_UPLOAD_SIZE = 20 * 1024 * 1024;

function sanitizeFilename(filename: string) {
  return filename.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
}

function toBoolean(value: FormDataEntryValue | null) {
  return String(value ?? '').toLowerCase() === 'true';
}

function toNumber(value: FormDataEntryValue | null) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function inferMediaType(file: File) {
  if (file.type.startsWith('video/')) {
    return 'video' as const;
  }

  return 'image' as const;
}

export async function POST(request: Request) {
  const access = await requireAdminAccess(['manage_gallery', 'manage_gallery_media']);

  if ('error' in access) {
    return access.error;
  }

  const formData = await request.formData();
  const albumId = String(formData.get('albumId') ?? '').trim();
  const title = String(formData.get('title') ?? '').trim();
  const altText = String(formData.get('altText') ?? '').trim();
  const sortOrder = toNumber(formData.get('sortOrder'));
  const isFeatured = toBoolean(formData.get('isFeatured'));
  const fileEntry = formData.get('file');

  if (!albumId || !title || !(fileEntry instanceof File)) {
    return NextResponse.json(
      { ok: false, message: 'Album, title, and file are required.' },
      { status: 400 }
    );
  }

  if (!fileEntry.size) {
    return NextResponse.json(
      { ok: false, message: 'Please choose a media file to upload.' },
      { status: 400 }
    );
  }

  if (fileEntry.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json(
      { ok: false, message: 'Files must be 20MB or smaller.' },
      { status: 400 }
    );
  }

  const mediaType = inferMediaType(fileEntry);
  const objectPath = `${albumId}/${Date.now()}-${sanitizeFilename(fileEntry.name)}`;
  const arrayBuffer = await fileEntry.arrayBuffer();

  const { error: uploadError } = await access.supabase.storage
    .from('gallery-media')
    .upload(objectPath, Buffer.from(arrayBuffer), {
      cacheControl: '3600',
      contentType: fileEntry.type,
      upsert: false
    });

  if (uploadError) {
    return NextResponse.json(
      { ok: false, message: 'Unable to upload this file right now.' },
      { status: 502 }
    );
  }

  const {
    data: { publicUrl }
  } = access.supabase.storage.from('gallery-media').getPublicUrl(objectPath);

  const { data, error } = await access.supabase
    .from('gallery_media')
    .insert({
      album_id: albumId,
      title,
      media_type: mediaType,
      file_path: publicUrl,
      thumbnail_path: mediaType === 'image' ? publicUrl : null,
      alt_text: altText || null,
      sort_order: sortOrder,
      is_featured: isFeatured
    })
    .select(
      'id, album_id, title, media_type, file_path, thumbnail_path, alt_text, sort_order, is_featured'
    )
    .single();

  if (error || !data) {
    return NextResponse.json(
      { ok: false, message: 'File uploaded but media record could not be created.' },
      { status: 502 }
    );
  }

  await access.supabase
    .from('gallery_albums')
    .update({ cover_url: publicUrl })
    .eq('id', albumId)
    .is('cover_url', null);

  revalidatePath('/admin');
  revalidatePath('/admin/gallery');
  revalidatePath('/gallery');

  return NextResponse.json({
    ok: true,
    message: 'Media uploaded successfully.',
    record: {
      id: data.id,
      albumId: data.album_id,
      title: data.title,
      mediaType: data.media_type === 'video' ? 'video' : 'image',
      fileUrl: data.file_path,
      thumbnailUrl: data.thumbnail_path ?? data.file_path,
      altText: data.alt_text ?? data.title,
      sortOrder: data.sort_order,
      isFeatured: data.is_featured
    }
  });
}
