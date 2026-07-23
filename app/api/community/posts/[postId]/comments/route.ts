import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { COMMUNITY_SESSION_COOKIE, createCommunitySessionKey } from '@/lib/community';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  context: { params: Promise<{ postId: string }> }
) {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: 'Community comments are unavailable right now.' },
      { status: 503 }
    );
  }

  const { postId } = await context.params;
  const body = (await request.json()) as { guestName?: string; body?: string };
  const guestName = body.guestName?.trim() || 'Guest';
  const commentBody = body.body?.trim() ?? '';

  if (guestName.length < 2) {
    return NextResponse.json(
      { ok: false, message: 'Enter a display name with at least 2 characters.' },
      { status: 400 }
    );
  }

  if (commentBody.length < 2) {
    return NextResponse.json(
      { ok: false, message: 'Write a comment with at least 2 characters.' },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const sessionKey =
    cookieStore.get(COMMUNITY_SESSION_COOKIE)?.value ?? createCommunitySessionKey();

  const { data: commentId, error: commentError } = await supabase.rpc('create_public_comment', {
    target_post_id: postId,
    visitor_session_key: sessionKey,
    visitor_name: guestName,
    comment_body: commentBody
  });

  if (commentError || !commentId) {
    return NextResponse.json(
      {
        ok: false,
        message:
          commentError?.message ||
          'Unable to add your comment right now. Make sure the latest schema is applied.'
      },
      { status: 502 }
    );
  }

  const [{ data: comment }, { count }] = await Promise.all([
    supabase
      .from('comments')
      .select('id, guest_name, body, created_at')
      .eq('id', commentId)
      .maybeSingle(),
    supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('status', 'visible')
  ]);

  const response = NextResponse.json({
    ok: true,
    comment: {
      id: comment?.id ?? String(commentId),
      authorName: comment?.guest_name?.trim() || guestName,
      body: comment?.body ?? commentBody,
      createdAt: comment?.created_at ?? new Date().toISOString()
    },
    commentCount: count ?? 1
  });

  response.cookies.set({
    name: COMMUNITY_SESSION_COOKIE,
    value: sessionKey,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365
  });

  return response;
}
