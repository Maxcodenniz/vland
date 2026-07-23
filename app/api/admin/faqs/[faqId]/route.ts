import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { adminFaqSchema } from '@/lib/schemas/admin';
import { requireAdminAccess } from '@/lib/supabase/admin';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ faqId: string }> }
) {
  const access = await requireAdminAccess(['manage_content']);

  if ('error' in access) {
    return access.error;
  }

  const { faqId } = await context.params;
  const body = await request.json();
  const parsed = adminFaqSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten(), message: 'Invalid FAQ data.' },
      { status: 400 }
    );
  }

  const { error } = await access.supabase
    .from('faqs')
    .update({
      question: parsed.data.question,
      answer: parsed.data.answer,
      sort_order: parsed.data.sortOrder
    })
    .eq('id', faqId);

  if (error) {
    return NextResponse.json(
      { ok: false, message: 'Unable to update this FAQ right now.' },
      { status: 502 }
    );
  }

  revalidatePath('/admin');
  revalidatePath('/admin/faqs');
  revalidatePath('/');

  return NextResponse.json({ ok: true, message: 'FAQ updated successfully.' });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ faqId: string }> }
) {
  const access = await requireAdminAccess(['manage_content']);

  if ('error' in access) {
    return access.error;
  }

  const { faqId } = await context.params;

  const { data: existingFaq } = await access.supabase
    .from('faqs')
    .select('question')
    .eq('id', faqId)
    .maybeSingle();

  if (!existingFaq) {
    return NextResponse.json(
      { ok: false, message: 'This FAQ could not be found. Refresh and try again.' },
      { status: 404 }
    );
  }

  const { error } = await access.supabase.from('faqs').delete().eq('id', faqId);

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message || 'Unable to delete this FAQ right now.' },
      { status: 502 }
    );
  }

  revalidatePath('/admin');
  revalidatePath('/admin/faqs');
  revalidatePath('/');

  return NextResponse.json({
    ok: true,
    message: `FAQ "${existingFaq.question}" deleted successfully.`
  });
}
