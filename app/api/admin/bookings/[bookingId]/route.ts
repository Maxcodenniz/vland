import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { bookingUpdateSchema } from '@/lib/schemas/admin';
import { requireAdminAccess } from '@/lib/supabase/admin';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ bookingId: string }> }
) {
  const access = await requireAdminAccess('manage_bookings');

  if ('error' in access) {
    return access.error;
  }

  const { bookingId } = await context.params;

  if (bookingId.startsWith('fallback-')) {
    return NextResponse.json(
      {
        ok: false,
        message:
          'This is a preview booking row. Real bookings can be updated after a visitor submits one.'
      },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = bookingUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        errors: parsed.error.flatten(),
        message: 'The booking update request is invalid.'
      },
      { status: 400 }
    );
  }

  const { data: booking, error } = await access.supabase
    .from('bookings')
    .update({
      status: parsed.data.status
    })
    .eq('id', bookingId)
    .select('id, booking_reference')
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error.message || 'Unable to update this booking right now.'
      },
      { status: 502 }
    );
  }

  if (!booking) {
    return NextResponse.json(
      {
        ok: false,
        message: 'This booking could not be found. Refresh the queue and try again.'
      },
      { status: 404 }
    );
  }

  revalidatePath('/admin');
  revalidatePath('/admin/bookings');

  return NextResponse.json({
    ok: true,
    message: `Booking ${booking.booking_reference} updated successfully.`
  });
}
