'use client';

import type { ComponentProps } from 'react';
import { useState } from 'react';

import { AdminFeedbackToast } from '@/components/admin/AdminFeedbackToast';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (
    event
  ) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 8) {
      setError('Use at least 8 characters for the new password.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setError(
        'Supabase environment variables are missing. Configure auth to enable password reset.'
      );
      setIsSubmitting(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setIsSubmitting(false);
      return;
    }

    setMessage(
      'Password updated successfully. You can now sign in to the private workspace.'
    );
    setPassword('');
    setConfirmPassword('');
    setIsSubmitting(false);
  };

  return (
    <form className="card content-panel form-grid auth-form" onSubmit={handleSubmit}>
      <AdminFeedbackToast error={error} message={message} />
      <label>
        <span className="muted">New password</span>
        <input
          autoComplete="new-password"
          className="input"
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
      </label>
      <label>
        <span className="muted">Confirm new password</span>
        <input
          autoComplete="new-password"
          className="input"
          onChange={(event) => setConfirmPassword(event.target.value)}
          type="password"
          value={confirmPassword}
        />
      </label>
      <button className="button" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Updating...' : 'Update password'}
      </button>
    </form>
  );
}
