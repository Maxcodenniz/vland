import { NextResponse } from 'next/server';

import { contactFormSchema } from '@/lib/schemas/contact';

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = contactFormSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        errors: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const web3FormsKey = process.env.WEB3FORMS_ACCESS_KEY;

  if (!web3FormsKey) {
    return NextResponse.json(
      {
        ok: true,
        message:
          'Message validated. Add WEB3FORMS_ACCESS_KEY to enable outbound form delivery.'
      },
      { status: 202 }
    );
  }

  const response = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      access_key: web3FormsKey,
      subject: parsed.data.subject,
      from_name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      message: parsed.data.message
    })
  });

  if (!response.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Unable to send message via Web3Forms.'
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: 'Message sent successfully.'
  });
}
