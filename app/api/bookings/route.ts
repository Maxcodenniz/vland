import { NextResponse } from 'next/server';

import { bookingFormSchema } from '@/lib/schemas/bookings';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = bookingFormSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        errors: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      {
        ok: true,
        message:
          'Booking request validated. Add Supabase environment variables to store live booking records.'
      },
      { status: 202 }
    );
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('id, title')
    .eq('slug', parsed.data.serviceSlug)
    .maybeSingle();

  if (serviceError || !service) {
    return NextResponse.json(
      {
        ok: false,
        message: 'The selected service could not be found.'
      },
      { status: 400 }
    );
  }

  const { data: booking, error: insertError } = await supabase
    .from('bookings')
    .insert({
      user_id: user?.id ?? null,
      service_id: service.id,
      full_name: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      preferred_date: parsed.data.preferredDate,
      preferred_time: parsed.data.preferredTime,
      notes: parsed.data.notes?.trim() || null
    })
    .select('booking_reference')
    .single();

  if (insertError || !booking) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Unable to save your booking request right now.'
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    bookingReference: booking.booking_reference,
    message: `Booking request received for ${service.title}. Our team will confirm shortly.`
  });
}
