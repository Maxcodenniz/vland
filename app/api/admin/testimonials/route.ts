import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { adminTestimonialSchema } from '@/lib/schemas/admin';
import { requireAdminAccess } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const access = await requireAdminAccess(['manage_content']);

  if ('error' in access) {
    return access.error;
  }

  const body = await request.json();
  const parsed = adminTestimonialSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten(), message: 'Invalid testimonial data.' },
      { status: 400 }
    );
  }

  const { error } = await access.supabase.from('testimonials').insert({
    client_name: parsed.data.clientName,
    role_label: parsed.data.roleLabel || null,
    quote: parsed.data.quote,
    media_path: parsed.data.mediaPath || null,
    media_type: parsed.data.mediaPath && parsed.data.mediaType === 'video' ? 'video' : 'image',
    is_featured: parsed.data.isFeatured
  });

  if (error) {
    return NextResponse.json(
      { ok: false, message: 'Unable to create this testimonial right now.' },
      { status: 502 }
    );
  }

  revalidatePath('/admin');
  revalidatePath('/admin/testimonials');
  revalidatePath('/');

  return NextResponse.json({ ok: true, message: 'Testimonial created successfully.' });
}
