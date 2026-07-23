'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { AdminFeedbackToast } from '@/components/admin/AdminFeedbackToast';
import type { AdminSettingsRecord } from '@/lib/data/live-content';
import {
  adminSettingsSchema,
  type AdminSettingsValues
} from '@/lib/schemas/admin';

export function SettingsEditor({
  initialValues
}: {
  initialValues: AdminSettingsRecord;
}) {
  const router = useRouter();
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<AdminSettingsValues>({
    resolver: zodResolver(adminSettingsSchema),
    defaultValues: initialValues
  });

  const onSubmit = async (values: AdminSettingsValues) => {
    setSubmitError(null);
    setSubmitMessage(null);

    const response = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(values)
    });

    const result = (await response.json()) as {
      ok: boolean;
      message?: string;
    };

    if (!response.ok) {
      setSubmitError(result.message ?? 'Unable to save settings right now.');
      return;
    }

    setSubmitMessage(result.message ?? 'Settings updated successfully.');
    router.refresh();
  };

  return (
    <form className="card content-panel form-grid" onSubmit={handleSubmit(onSubmit)}>
      <AdminFeedbackToast error={submitError} message={submitMessage} />
      <div className="form-grid columns-2">
        <label>
          <span className="muted">Business name</span>
          <input className="input" {...register('businessName')} />
          <small className="muted">{errors.businessName?.message}</small>
        </label>
        <label>
          <span className="muted">Site name</span>
          <input className="input" {...register('siteName')} />
          <small className="muted">{errors.siteName?.message}</small>
        </label>
        <label>
          <span className="muted">Domain</span>
          <input className="input" {...register('domain')} />
          <small className="muted">{errors.domain?.message}</small>
        </label>
        <label>
          <span className="muted">Active theme</span>
          <input className="input" {...register('activeTheme')} />
          <small className="muted">{errors.activeTheme?.message}</small>
        </label>
        <label>
          <span className="muted">Phone</span>
          <input className="input" {...register('phone')} />
          <small className="muted">{errors.phone?.message}</small>
        </label>
        <label>
          <span className="muted">WhatsApp number</span>
          <input className="input" {...register('whatsappNumber')} />
          <small className="muted">{errors.whatsappNumber?.message}</small>
        </label>
        <label>
          <span className="muted">Email</span>
          <input className="input" type="email" {...register('email')} />
          <small className="muted">{errors.email?.message}</small>
        </label>
        <label>
          <span className="muted">Map embed URL</span>
          <input className="input" {...register('mapEmbedUrl')} />
          <small className="muted">{errors.mapEmbedUrl?.message}</small>
        </label>
      </div>

      <label>
        <span className="muted">Address</span>
        <textarea className="textarea" {...register('address')} />
        <small className="muted">{errors.address?.message}</small>
      </label>

      <label>
        <span className="muted">SEO title</span>
        <input className="input" {...register('seoTitle')} />
        <small className="muted">{errors.seoTitle?.message}</small>
      </label>

      <label>
        <span className="muted">SEO description</span>
        <textarea className="textarea" {...register('seoDescription')} />
        <small className="muted">{errors.seoDescription?.message}</small>
      </label>

      <label>
        <span className="muted">Hero video URL</span>
        <input className="input" {...register('heroVideoUrl')} />
        <small className="muted">{errors.heroVideoUrl?.message}</small>
      </label>

      <div className="inline-actions">
        <button className="button-secondary" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Saving...' : 'Save settings'}
        </button>
      </div>
    </form>
  );
}
