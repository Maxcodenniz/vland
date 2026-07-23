import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { adminSettingsSchema } from '@/lib/schemas/admin';
import { requireAdminAccess } from '@/lib/supabase/admin';

export async function PATCH(request: Request) {
  const access = await requireAdminAccess('manage_settings');

  if ('error' in access) {
    return access.error;
  }

  const body = await request.json();
  const parsed = adminSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        errors: parsed.error.flatten(),
        message: 'The settings update request is invalid.'
      },
      { status: 400 }
    );
  }

  const {
    businessName,
    siteName,
    domain,
    phone,
    email,
    whatsappNumber,
    address,
    mapEmbedUrl,
    seoTitle,
    seoDescription,
    heroVideoUrl,
    activeTheme
  } = parsed.data;

  const [{ data: contactSettings, error: contactLoadError }, { data: siteSettings, error: siteLoadError }] =
    await Promise.all([
      access.supabase.from('contact_settings').select('id').limit(1).maybeSingle(),
      access.supabase.from('site_settings').select('id').limit(1).maybeSingle()
    ]);

  if (contactLoadError || siteLoadError) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Unable to load the current settings records.'
      },
      { status: 502 }
    );
  }

  const contactPayload = {
    business_name: businessName,
    phone,
    email,
    whatsapp_number: whatsappNumber,
    address,
    map_embed_url: mapEmbedUrl || null
  };

  const sitePayload = {
    site_name: siteName,
    domain,
    seo_title: seoTitle || null,
    seo_description: seoDescription || null,
    hero_video_url: heroVideoUrl || null,
    active_theme: activeTheme
  };

  const [{ error: contactSaveError }, { error: siteSaveError }] = await Promise.all([
    contactSettings?.id
      ? access.supabase.from('contact_settings').update(contactPayload).eq('id', contactSettings.id)
      : access.supabase.from('contact_settings').insert(contactPayload),
    siteSettings?.id
      ? access.supabase.from('site_settings').update(sitePayload).eq('id', siteSettings.id)
      : access.supabase.from('site_settings').insert(sitePayload)
  ]);

  if (contactSaveError || siteSaveError) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Unable to save the updated settings right now.'
      },
      { status: 502 }
    );
  }

  revalidatePath('/', 'layout');
  revalidatePath('/admin/settings');
  revalidatePath('/contact');

  return NextResponse.json({
    ok: true,
    message: 'Site settings updated successfully.'
  });
}
