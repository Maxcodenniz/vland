import { NextResponse } from 'next/server';

import { inferMediaTypeFromPath, sanitizeFilename } from '@/lib/media';
import { requireAdminAccess } from '@/lib/supabase/admin';

const MAX_UPLOAD_SIZE = 20 * 1024 * 1024;

export async function POST(request: Request) {
  const access = await requireAdminAccess(['manage_content']);

  if ('error' in access) {
    return access.error;
  }

  const formData = await request.formData();
  const fileEntry = formData.get('file');

  if (!(fileEntry instanceof File) || !fileEntry.size) {
    return NextResponse.json(
      { ok: false, message: 'Please choose an image or video to upload.' },
      { status: 400 }
    );
  }

  if (fileEntry.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json(
      { ok: false, message: 'Files must be 20MB or smaller.' },
      { status: 400 }
    );
  }

  const mediaType = inferMediaTypeFromPath(fileEntry.name);

  if (mediaType === 'text') {
    return NextResponse.json(
      { ok: false, message: 'Only image and video files are supported here.' },
      { status: 400 }
    );
  }

  const objectPath = `${access.user.id}/${Date.now()}-${sanitizeFilename(fileEntry.name)}`;
  const arrayBuffer = await fileEntry.arrayBuffer();

  const { error: uploadError } = await access.supabase.storage
    .from('content-media')
    .upload(objectPath, Buffer.from(arrayBuffer), {
      cacheControl: '3600',
      contentType: fileEntry.type,
      upsert: false
    });

  if (uploadError) {
    return NextResponse.json(
      { ok: false, message: 'Unable to upload this media right now.' },
      { status: 502 }
    );
  }

  const {
    data: { publicUrl }
  } = access.supabase.storage.from('content-media').getPublicUrl(objectPath);

  return NextResponse.json({
    ok: true,
    message: 'Media uploaded successfully.',
    mediaType,
    publicUrl
  });
}
