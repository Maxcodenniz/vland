import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { adminTestimonialSchema } from '@/lib/schemas/admin';
import { requireAdminAccess } from '@/lib/supabase/admin';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ testimonialId: string }> }
) {
  const access = await requireAdminAccess(['manage_content']);

  if ('error' in access) {
    return access.error;
  }

  const { testimonialId } = await context.params;
  const body = await request.json();
  const parsed = adminTestimonialSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten(), message: 'Invalid testimonial data.' },
      { status: 400 }
    );
  }

  const { error } = await access.supabase
    .from('testimonials')
    .update({
      client_name: parsed.data.clientName,
      role_label: parsed.data.roleLabel || null,
      quote: parsed.data.quote,
      media_path: parsed.data.mediaPath || null,
      media_type: parsed.data.mediaPath && parsed.data.mediaType === 'video' ? 'video' : 'image',
      is_featured: parsed.data.isFeatured
    })
    .eq('id', testimonialId);

  if (error) {
    return NextResponse.json(
      { ok: false, message: 'Unable to update this testimonial right now.' },
      { status: 502 }
    );
  }

  revalidatePath('/admin');
  revalidatePath('/admin/testimonials');
  revalidatePath('/');

  return NextResponse.json({ ok: true, message: 'Testimonial updated successfully.' });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ testimonialId: string }> }
) {
  const access = await requireAdminAccess(['manage_content']);

  if ('error' in access) {
    return access.error;
  }

  const { testimonialId } = await context.params;

  const { data: existingRecord } = await access.supabase
    .from('testimonials')
    .select('client_name')
    .eq('id', testimonialId)
    .maybeSingle();

  if (!existingRecord) {
    return NextResponse.json(
      { ok: false, message: 'This testimonial could not be found. Refresh and try again.' },
      { status: 404 }
    );
  }

  const { error } = await access.supabase
    .from('testimonials')
    .delete()
    .eq('id', testimonialId);

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error.message || 'Unable to delete this testimonial right now.'
      },
      { status: 502 }
    );
  }

  revalidatePath('/admin');
  revalidatePath('/admin/testimonials');
  revalidatePath('/');

  return NextResponse.json({
    ok: true,
    message: `Testimonial "${existingRecord.client_name}" deleted successfully.`
  });
}
