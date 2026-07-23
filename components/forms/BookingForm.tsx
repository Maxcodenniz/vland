'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { AdminFeedbackToast } from '@/components/admin/AdminFeedbackToast';
import {
  bookingFormSchema,
  type BookingFormValues
} from '@/lib/schemas/bookings';

export function BookingForm({
  defaultServiceSlug,
  services
}: {
  defaultServiceSlug?: string;
  services: Array<{ slug: string; title: string }>;
}) {
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const firstServiceSlug = services[0]?.slug ?? '';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      serviceSlug: defaultServiceSlug ?? firstServiceSlug,
      notes: ''
    }
  });

  const onSubmit = async (values: BookingFormValues) => {
    setSubmitError(null);
    setSubmitMessage(null);

    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(values)
    });

    const result = (await response.json()) as {
      ok: boolean;
      message?: string;
      bookingReference?: string;
    };

    if (!response.ok) {
      setSubmitError(result.message ?? 'Unable to submit booking request.');
      return;
    }

    setSubmitMessage(
      result.bookingReference
        ? `${result.message} Reference: ${result.bookingReference}.`
        : result.message ?? 'Your booking request has been received.'
    );

    reset({
      serviceSlug: defaultServiceSlug ?? firstServiceSlug,
      fullName: '',
      email: '',
      phone: '',
      preferredDate: '',
      preferredTime: '',
      notes: ''
    });
  };

  return (
    <form className="card content-panel form-grid" onSubmit={handleSubmit(onSubmit)}>
      <AdminFeedbackToast error={submitError} message={submitMessage} />
      <div className="form-grid columns-2">
        <label>
          <span className="muted">Service</span>
          <select className="select" {...register('serviceSlug')}>
            {services.map((service) => (
              <option key={service.slug} value={service.slug}>
                {service.title}
              </option>
            ))}
          </select>
          <small className="muted">{errors.serviceSlug?.message}</small>
        </label>
        <label>
          <span className="muted">Full name</span>
          <input className="input" {...register('fullName')} />
          <small className="muted">{errors.fullName?.message}</small>
        </label>
        <label>
          <span className="muted">Email</span>
          <input className="input" type="email" {...register('email')} />
          <small className="muted">{errors.email?.message}</small>
        </label>
        <label>
          <span className="muted">Phone</span>
          <input className="input" {...register('phone')} />
          <small className="muted">{errors.phone?.message}</small>
        </label>
        <label>
          <span className="muted">Preferred date</span>
          <input className="input" type="date" {...register('preferredDate')} />
          <small className="muted">{errors.preferredDate?.message}</small>
        </label>
        <label>
          <span className="muted">Preferred time</span>
          <input className="input" type="time" {...register('preferredTime')} />
          <small className="muted">{errors.preferredTime?.message}</small>
        </label>
      </div>
      <label>
        <span className="muted">Notes</span>
        <textarea className="textarea" {...register('notes')} />
        <small className="muted">{errors.notes?.message}</small>
      </label>
      <button className="button" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Submitting...' : 'Submit appointment request'}
      </button>
    </form>
  );
}
