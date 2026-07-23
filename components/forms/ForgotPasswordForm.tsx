'use client';

import type { ComponentProps } from 'react';
import { useState } from 'react';

import { AdminFeedbackToast } from '@/components/admin/AdminFeedbackToast';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (
    event
  ) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setError(
        'Supabase environment variables are missing. Configure auth to enable password recovery.'
      );
      setIsSubmitting(false);
      return;
    }

    const redirectTo = `${window.location.origin}/secure-access/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });

    if (resetError) {
      setError(resetError.message);
      setIsSubmitting(false);
      return;
    }

    setMessage(
      'If that account is approved for staff access, a password reset link has been sent.'
    );
    setIsSubmitting(false);
  };

  return (
    <form className="card content-panel form-grid auth-form" onSubmit={handleSubmit}>
      <AdminFeedbackToast error={error} message={message} />
      <label>
        <span className="muted">Work email</span>
        <input
          autoComplete="email"
          className="input"
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          value={email}
        />
      </label>
      <button className="button" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Sending...' : 'Send reset link'}
      </button>
    </form>
  );
}
