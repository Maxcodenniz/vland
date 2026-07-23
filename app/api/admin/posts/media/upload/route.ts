import { NextResponse } from 'next/server';

import { requireAdminAccess } from '@/lib/supabase/admin';

const MAX_UPLOAD_SIZE = 20 * 1024 * 1024;

function sanitizeFilename(filename: string) {
  return filename.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
}

function inferMediaType(file: File) {
  if (file.type.startsWith('video/')) {
    return 'video' as const;
  }

  return 'image' as const;
}

export async function POST(request: Request) {
  const access = await requireAdminAccess(['manage_posts', 'manage_content']);

  if ('error' in access) {
    return access.error;
  }

  const formData = await request.formData();
  const fileEntry = formData.get('file');

  if (!(fileEntry instanceof File)) {
    return NextResponse.json(
      { ok: false, message: 'Please choose a photo or video to upload.' },
      { status: 400 }
    );
  }

  if (!fileEntry.size) {
    return NextResponse.json(
      { ok: false, message: 'Please choose a photo or video to upload.' },
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
  const objectPath = `${access.user.id}/${Date.now()}-${sanitizeFilename(fileEntry.name)}`;
  const arrayBuffer = await fileEntry.arrayBuffer();

  const { error: uploadError } = await access.supabase.storage
    .from('post-media')
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
  } = access.supabase.storage.from('post-media').getPublicUrl(objectPath);

  return NextResponse.json({
    ok: true,
    message: 'Post media uploaded successfully.',
    mediaType,
    publicUrl
  });
}
