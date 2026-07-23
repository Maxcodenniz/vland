import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  COMMUNITY_REACTIONS,
  COMMUNITY_SESSION_COOKIE,
  createCommunitySessionKey,
  isCommunityReactionType
} from '@/lib/community';
import { createServerSupabaseClient } from '@/lib/supabase/server';

function summarizeReactions(
  rows: Array<{ reaction_type?: string | null }>
): Array<{ type: string; emoji: string; count: number }> {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const type = row.reaction_type ?? 'like';
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([type, count]) => ({
      type,
      count,
      emoji: COMMUNITY_REACTIONS.find((reaction) => reaction.type === type)?.emoji ?? '👍'
    }));
}

export async function POST(
  request: Request,
  context: { params: Promise<{ postId: string }> }
) {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: 'Community reactions are unavailable right now.' },
      { status: 503 }
    );
  }

  const { postId } = await context.params;
  const body = (await request.json()) as { reactionType?: string };
  const reactionType = body.reactionType?.trim().toLowerCase() ?? '';

  if (!isCommunityReactionType(reactionType)) {
    return NextResponse.json(
      { ok: false, message: 'Choose a valid reaction.' },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const sessionKey =
    cookieStore.get(COMMUNITY_SESSION_COOKIE)?.value ?? createCommunitySessionKey();

  const { error: reactionError, data: selectedReaction } = await supabase.rpc(
    'toggle_public_post_reaction',
    {
      target_post_id: postId,
      visitor_session_key: sessionKey,
      selected_reaction: reactionType
    }
  );

  if (reactionError) {
    return NextResponse.json(
      {
        ok: false,
        message:
          reactionError.message ||
          'Unable to save your reaction right now. Make sure the latest schema is applied.'
      },
      { status: 502 }
    );
  }

  const { data: reactions } = await supabase
    .from('post_likes')
    .select('reaction_type')
    .eq('post_id', postId);

  const response = NextResponse.json({
    ok: true,
    viewerReaction: selectedReaction ?? null,
    reactionCount: reactions?.length ?? 0,
    topReactions: summarizeReactions(
      (reactions as Array<{ reaction_type?: string | null }> | null) ?? []
    )
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
