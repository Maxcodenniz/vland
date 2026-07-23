import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { adminCourseSchema } from '@/lib/schemas/admin';
import { requireAdminAccess } from '@/lib/supabase/admin';

function getCourseWriteErrorMessage(error: { code?: string; message: string }) {
  if (error.code === '23505') {
    return 'This course slug is already in use. Choose a different slug.';
  }

  return error.message || 'Unable to create this course right now.';
}

export async function POST(request: Request) {
  const access = await requireAdminAccess(['manage_courses', 'manage_content']);

  if ('error' in access) {
    return access.error;
  }

  const body = await request.json();
  const parsed = adminCourseSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten(), message: 'Invalid course data.' },
      { status: 400 }
    );
  }

  const { error } = await access.supabase.from('courses').insert({
    title: parsed.data.title,
    slug: parsed.data.slug,
    category: parsed.data.category,
    duration_label: parsed.data.durationLabel,
    fee_label: parsed.data.feeLabel,
    schedule_label: parsed.data.scheduleLabel,
    trainer_name: parsed.data.trainerName || null,
    description: parsed.data.description,
    media_path: parsed.data.mediaPath || null,
    media_type: parsed.data.mediaPath && parsed.data.mediaType === 'video' ? 'video' : 'image',
    is_active: parsed.data.isActive,
    sort_order: parsed.data.sortOrder
  });

  if (error) {
    return NextResponse.json(
      { ok: false, message: getCourseWriteErrorMessage(error) },
      { status: error.code === '23505' ? 409 : 502 }
    );
  }

  revalidatePath('/admin');
  revalidatePath('/admin/courses');
  revalidatePath('/training');
  revalidatePath(`/training/${parsed.data.slug}`);

  return NextResponse.json({ ok: true, message: 'Course created successfully.' });
}
