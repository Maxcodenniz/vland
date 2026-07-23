import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { normalizeMediaGalleryPaths } from '@/lib/media';
import { adminPostSchema } from '@/lib/schemas/admin';
import { requireAdminAccess } from '@/lib/supabase/admin';

function getValidationMessage(
  errors: Record<string, string[] | undefined>,
  fallback: string
) {
  const firstError = Object.values(errors).flat().find(Boolean);
  return firstError ?? fallback;
}

function normalizePostInput(body: Record<string, unknown>) {
  return {
    ...body,
    excerpt:
      typeof body.excerpt === 'string'
        ? body.excerpt.trim().slice(0, 240)
        : body.excerpt
  };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ postId: string }> }
) {
  const access = await requireAdminAccess(['manage_posts', 'manage_content']);

  if ('error' in access) {
    return access.error;
  }

  const { postId } = await context.params;
  const rawBody = (await request.json()) as Record<string, unknown>;
  const body = normalizePostInput(rawBody);
  const parsed = adminPostSchema.safeParse(body);

  if (!parsed.success) {
    const flattened = parsed.error.flatten();
    return NextResponse.json(
      {
        ok: false,
        errors: flattened,
        message: getValidationMessage(flattened.fieldErrors, 'Invalid post data.')
      },
      { status: 400 }
    );
  }

  const mediaGalleryPaths = normalizeMediaGalleryPaths(
    parsed.data.mediaGalleryPaths.length
      ? parsed.data.mediaGalleryPaths
      : [parsed.data.coverMediaPath]
  );

  const { data, error } = await access.supabase
    .from('posts')
    .update({
      title: parsed.data.title,
      slug: parsed.data.slug,
      excerpt: parsed.data.excerpt || null,
      body: parsed.data.body,
      category: parsed.data.category || null,
      tags: parsed.data.tags,
      cover_media_path: mediaGalleryPaths[0] || null,
      media_gallery: mediaGalleryPaths,
      status: parsed.data.status
    })
    .eq('id', postId)
    .select('id, title')
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message || 'Unable to update this post right now.' },
      { status: 502 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { ok: false, message: 'This post could not be found. Refresh and try again.' },
      { status: 404 }
    );
  }

  revalidatePath('/admin');
  revalidatePath('/admin/posts');
  revalidatePath('/community');
  revalidatePath('/');

  return NextResponse.json({
    ok: true,
    message: `Post "${data.title}" updated successfully.`
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ postId: string }> }
) {
  const access = await requireAdminAccess(['manage_posts', 'manage_content']);

  if ('error' in access) {
    return access.error;
  }

  const { postId } = await context.params;

  const { data: existingPost } = await access.supabase
    .from('posts')
    .select('title')
    .eq('id', postId)
    .maybeSingle();

  if (!existingPost) {
    return NextResponse.json(
      { ok: false, message: 'This post could not be found. Refresh and try again.' },
      { status: 404 }
    );
  }

  const { error } = await access.supabase.from('posts').delete().eq('id', postId);

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message || 'Unable to delete this post right now.' },
      { status: 502 }
    );
  }

  revalidatePath('/admin');
  revalidatePath('/admin/posts');
  revalidatePath('/community');
  revalidatePath('/');

  return NextResponse.json({
    ok: true,
    message: `Post "${existingPost.title}" deleted successfully.`
  });
}
