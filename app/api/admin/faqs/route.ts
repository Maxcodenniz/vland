import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { adminFaqSchema } from '@/lib/schemas/admin';
import { requireAdminAccess } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const access = await requireAdminAccess(['manage_content']);

  if ('error' in access) {
    return access.error;
  }

  const body = await request.json();
  const parsed = adminFaqSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten(), message: 'Invalid FAQ data.' },
      { status: 400 }
    );
  }

  const { error } = await access.supabase.from('faqs').insert({
    question: parsed.data.question,
    answer: parsed.data.answer,
    sort_order: parsed.data.sortOrder
  });

  if (error) {
    return NextResponse.json(
      { ok: false, message: 'Unable to create this FAQ right now.' },
      { status: 502 }
    );
  }

  revalidatePath('/admin');
  revalidatePath('/admin/faqs');
  revalidatePath('/');

  return NextResponse.json({ ok: true, message: 'FAQ created successfully.' });
}
