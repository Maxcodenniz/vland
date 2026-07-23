import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { adminUserRoleSchema } from '@/lib/schemas/admin';
import { requireAdminAccess } from '@/lib/supabase/admin';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ profileId: string }> }
) {
  const access = await requireAdminAccess(['manage_users']);

  if ('error' in access) {
    return access.error;
  }

  const { profileId } = await context.params;
  const body = await request.json();
  const parsed = adminUserRoleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten(), message: 'Invalid role data.' },
      { status: 400 }
    );
  }

  const { error } = await access.supabase
    .from('profiles')
    .update({ role: parsed.data.role })
    .eq('id', profileId);

  if (error) {
    return NextResponse.json(
      { ok: false, message: 'Unable to update this user role right now.' },
      { status: 502 }
    );
  }

  revalidatePath('/admin');
  revalidatePath('/admin/users');

  return NextResponse.json({ ok: true, message: 'User role updated successfully.' });
}
