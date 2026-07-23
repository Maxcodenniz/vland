'use client';

import type { ComponentProps } from 'react';
import { useState } from 'react';

import { AdminFeedbackToast } from '@/components/admin/AdminFeedbackToast';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { isPrivilegedRole } from '@/lib/supabase/access';
import type { AppRole } from '@/lib/supabase/auth';

export function AdminLoginForm({
  redirectTo
}: {
  redirectTo?: string;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (
    event
  ) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setError(
        'Supabase environment variables are missing. Configure auth to enable protected admin login.'
      );
      setIsSubmitting(false);
      return;
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError || !data.user) {
      setError(signInError?.message ?? 'Unable to sign in.');
      setIsSubmitting(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();

    const role = (profileData?.role as AppRole | undefined) ?? 'visitor';

    if (profileError || !isPrivilegedRole(role)) {
      await supabase.auth.signOut();
      setError(
        'Your account is signed in, but it does not have admin or moderator access.'
      );
      setIsSubmitting(false);
      return;
    }

    window.location.assign(redirectTo || '/admin');
  };

  return (
    <form className="card content-panel form-grid auth-form" onSubmit={handleSubmit}>
      <AdminFeedbackToast error={error} />
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
      <label>
        <span className="muted">Password</span>
        <input
          autoComplete="current-password"
          className="input"
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
      </label>
      <button className="button" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Signing in...' : 'Sign in to private workspace'}
      </button>
    </form>
  );
}
