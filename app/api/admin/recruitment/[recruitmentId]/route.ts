import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { adminRecruitmentSchema } from '@/lib/schemas/admin';
import { requireAdminAccess } from '@/lib/supabase/admin';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ recruitmentId: string }> }
) {
  const access = await requireAdminAccess(['manage_recruitment', 'manage_content']);

  if ('error' in access) {
    return access.error;
  }

  const { recruitmentId } = await context.params;
  const body = await request.json();
  const parsed = adminRecruitmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten(), message: 'Invalid recruitment data.' },
      { status: 400 }
    );
  }

  const { error } = await access.supabase
    .from('recruitment_services')
    .update({
      title: parsed.data.title,
      slug: parsed.data.slug,
      status: parsed.data.status,
      deadline_label: parsed.data.deadlineLabel || null,
      fee_label: parsed.data.feeLabel || null,
      requirements: parsed.data.requirements,
      instructions: parsed.data.instructions || null,
      media_path: parsed.data.mediaPath || null,
      media_type: parsed.data.mediaPath && parsed.data.mediaType === 'video' ? 'video' : 'image',
      is_active: parsed.data.isActive,
      sort_order: parsed.data.sortOrder
    })
    .eq('id', recruitmentId);

  if (error) {
    return NextResponse.json(
      { ok: false, message: 'Unable to update this recruitment item right now.' },
      { status: 502 }
    );
  }

  revalidatePath('/admin');
  revalidatePath('/admin/recruitment');
  revalidatePath('/recruitment');

  return NextResponse.json({ ok: true, message: 'Recruitment item updated successfully.' });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ recruitmentId: string }> }
) {
  const access = await requireAdminAccess(['manage_recruitment', 'manage_content']);

  if ('error' in access) {
    return access.error;
  }

  const { recruitmentId } = await context.params;

  const { data: existingRecord } = await access.supabase
    .from('recruitment_services')
    .select('title')
    .eq('id', recruitmentId)
    .maybeSingle();

  if (!existingRecord) {
    return NextResponse.json(
      {
        ok: false,
        message: 'This recruitment item could not be found. Refresh and try again.'
      },
      { status: 404 }
    );
  }

  const { error } = await access.supabase
    .from('recruitment_services')
    .delete()
    .eq('id', recruitmentId);

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error.message || 'Unable to delete this recruitment item right now.'
      },
      { status: 502 }
    );
  }

  revalidatePath('/admin');
  revalidatePath('/admin/recruitment');
  revalidatePath('/recruitment');

  return NextResponse.json({
    ok: true,
    message: `Recruitment item "${existingRecord.title}" deleted successfully.`
  });
}
