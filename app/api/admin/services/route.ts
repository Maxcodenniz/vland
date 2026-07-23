import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { adminServiceSchema } from '@/lib/schemas/admin';
import { requireAdminAccess } from '@/lib/supabase/admin';

function getStoredServiceMediaType(
  mediaPath: string | null | undefined,
  mediaType: 'image' | 'video' | 'text'
) {
  if (!mediaPath?.trim()) {
    return 'image';
  }

  return mediaType === 'video' ? 'video' : 'image';
}

export async function POST(request: Request) {
  const access = await requireAdminAccess(['manage_services', 'manage_content']);

  if ('error' in access) {
    return access.error;
  }

  const body = await request.json();
  const parsed = adminServiceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten(), message: 'Invalid service data.' },
      { status: 400 }
    );
  }

  const { error, data } = await access.supabase
    .from('services')
    .insert({
      title: parsed.data.title,
      slug: parsed.data.slug,
      summary: parsed.data.summary,
      description: parsed.data.description,
      media_path: parsed.data.mediaPath || null,
      media_type: getStoredServiceMediaType(parsed.data.mediaPath, parsed.data.mediaType),
      price_label: parsed.data.priceLabel,
      cta_label: parsed.data.ctaLabel,
      category_id: parsed.data.categoryId,
      quote_only: parsed.data.quoteOnly,
      is_active: parsed.data.isActive,
      is_featured: parsed.data.isFeatured,
      sort_order: parsed.data.sortOrder
    })
    .select('id, slug')
    .single();

  if (error || !data) {
    return NextResponse.json(
      { ok: false, message: error?.message || 'Unable to create this service right now.' },
      { status: 502 }
    );
  }

  revalidatePath('/admin');
  revalidatePath('/admin/services');
  revalidatePath('/services');
  revalidatePath(`/services/${data.slug}`);

  return NextResponse.json({ ok: true, message: 'Service created successfully.' });
}
