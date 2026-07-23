import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { adminContentBlockSchema } from '@/lib/schemas/admin';
import { requireAdminAccess } from '@/lib/supabase/admin';

function revalidateContentPages() {
  revalidatePath('/admin');
  revalidatePath('/admin/content');
  revalidatePath('/');
  revalidatePath('/about');
  revalidatePath('/services');
  revalidatePath('/training');
  revalidatePath('/studio-booking');
  revalidatePath('/official-photos');
  revalidatePath('/recruitment');
  revalidatePath('/gallery');
  revalidatePath('/community');
  revalidatePath('/bookings');
  revalidatePath('/contact');
}

export async function POST(request: Request) {
  const access = await requireAdminAccess(['manage_content']);

  if ('error' in access) {
    return access.error;
  }

  const body = await request.json();
  const parsed = adminContentBlockSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten(), message: 'Invalid content block data.' },
      { status: 400 }
    );
  }

  const { error } = await access.supabase.from('content_blocks').insert({
    section_key: parsed.data.sectionKey,
    title: parsed.data.title,
    subtitle: parsed.data.subtitle || null,
    body: parsed.data.body || null,
    cta_label: parsed.data.ctaLabel || null,
    cta_href: parsed.data.ctaHref || null,
    payload: {
      mediaPath: parsed.data.mediaPath || '',
      mediaType: parsed.data.mediaType,
      eyebrow: parsed.data.eyebrow || '',
      secondaryCtaLabel: parsed.data.secondaryCtaLabel || '',
      secondaryCtaHref: parsed.data.secondaryCtaHref || '',
      heroHighlightsText: parsed.data.heroHighlightsText || '',
      visualBadge: parsed.data.visualBadge || '',
      visualTitle: parsed.data.visualTitle || '',
      visualDescription: parsed.data.visualDescription || '',
      topChipLabel: parsed.data.topChipLabel || '',
      middleChipLabel: parsed.data.middleChipLabel || '',
      bottomChipLabel: parsed.data.bottomChipLabel || ''
    },
    is_visible: parsed.data.isVisible,
    sort_order: parsed.data.sortOrder
  });

  if (error) {
    return NextResponse.json(
      { ok: false, message: 'Unable to create this content block right now.' },
      { status: 502 }
    );
  }

  revalidateContentPages();

  return NextResponse.json({ ok: true, message: 'Content block created successfully.' });
}
