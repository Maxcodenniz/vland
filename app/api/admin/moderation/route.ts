import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { moderationUpdateSchema } from '@/lib/schemas/admin';
import { requireAdminAccess } from '@/lib/supabase/admin';

export async function PATCH(request: Request) {
  const body = await request.json();
  const parsed = moderationUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        errors: parsed.error.flatten(),
        message: 'The moderation request is invalid.'
      },
      { status: 400 }
    );
  }

  const access = await requireAdminAccess(
    parsed.data.targetType === 'comment'
      ? 'moderate_comments'
      : ['moderate_posts', 'manage_posts']
  );

  if ('error' in access) {
    return access.error;
  }

  if (parsed.data.targetType === 'comment') {
    if (parsed.data.action === 'delete') {
      const { error } = await access.supabase
        .from('comments')
        .delete()
        .eq('id', parsed.data.targetId);

      if (error) {
        return NextResponse.json(
          {
            ok: false,
            message: 'Unable to delete this comment right now.'
          },
          { status: 502 }
        );
      }
    } else {
      const { error } = await access.supabase
        .from('comments')
        .update({
          status: parsed.data.action
        })
        .eq('id', parsed.data.targetId);

      if (error) {
        return NextResponse.json(
          {
            ok: false,
            message: 'Unable to update this comment right now.'
          },
          { status: 502 }
        );
      }
    }
  } else {
    if (parsed.data.action === 'delete') {
      const { error } = await access.supabase
        .from('posts')
        .delete()
        .eq('id', parsed.data.targetId);

      if (error) {
        return NextResponse.json(
          {
            ok: false,
            message: 'Unable to delete this post right now.'
          },
          { status: 502 }
        );
      }
    } else {
      const { error } = await access.supabase
        .from('posts')
        .update({
          status: parsed.data.action
        })
        .eq('id', parsed.data.targetId);

      if (error) {
        return NextResponse.json(
          {
            ok: false,
            message: 'Unable to update this post right now.'
          },
          { status: 502 }
        );
      }
    }
  }

  revalidatePath('/admin');
  revalidatePath('/admin/moderation');
  revalidatePath('/admin/posts');
  revalidatePath('/community');

  return NextResponse.json({
    ok: true,
    message: 'Moderation decision saved successfully.'
  });
}
