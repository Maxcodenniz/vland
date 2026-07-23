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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ serviceId: string }> }
) {
  const access = await requireAdminAccess(['manage_services', 'manage_content']);

  if ('error' in access) {
    return access.error;
  }

  const { serviceId } = await context.params;
  const body = await request.json();
  const parsed = adminServiceSchema.safeParse(body);

  const { data: existingService } = await access.supabase
    .from('services')
    .select('slug')
    .eq('id', serviceId)
    .maybeSingle();

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten(), message: 'Invalid service data.' },
      { status: 400 }
    );
  }

  const { error } = await access.supabase
    .from('services')
    .update({
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
    .eq('id', serviceId);

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message || 'Unable to update this service right now.' },
      { status: 502 }
    );
  }

  revalidatePath('/admin');
  revalidatePath('/admin/services');
  revalidatePath('/services');
  if (existingService?.slug) {
    revalidatePath(`/services/${existingService.slug}`);
  }
  revalidatePath(`/services/${parsed.data.slug}`);

  return NextResponse.json({ ok: true, message: 'Service updated successfully.' });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ serviceId: string }> }
) {
  const access = await requireAdminAccess(['manage_services', 'manage_content']);

  if ('error' in access) {
    return access.error;
  }

  const { serviceId } = await context.params;

  const { data: existingService } = await access.supabase
    .from('services')
    .select('slug, title')
    .eq('id', serviceId)
    .maybeSingle();

  if (!existingService) {
    return NextResponse.json(
      { ok: false, message: 'This service could not be found. Refresh and try again.' },
      { status: 404 }
    );
  }

  const { error } = await access.supabase.from('services').delete().eq('id', serviceId);

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message || 'Unable to delete this service right now.' },
      { status: 502 }
    );
  }

  revalidatePath('/admin');
  revalidatePath('/admin/services');
  revalidatePath('/services');
  revalidatePath(`/services/${existingService.slug}`);

  return NextResponse.json({
    ok: true,
    message: `Service "${existingService.title}" deleted successfully.`
  });
}
