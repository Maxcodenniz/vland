import Link from 'next/link';

import { ResetPasswordForm } from '@/components/forms/ResetPasswordForm';
import { PageHero } from '@/components/shared/PageHero';

export default function ResetPasswordPage() {
  return (
    <>
      <PageHero
        description="Choose a new password to restore access to the private staff workspace."
        eyebrow="Private Staff Access"
        primaryCta={{ href: '/secure-access', label: 'Back to sign in' }}
        secondaryCta={{ href: '/contact', label: 'Need support?' }}
        title="Set a new password for your staff account."
      />
      <section className="section">
        <div className="container split">
          <div className="stack">
            <div className="card content-panel stack">
              <span className="badge">Password reset</span>
              <h2 style={{ margin: 0 }}>Create a fresh password</h2>
              <p className="section-description">
                Use a strong password that only authorized staff will know.
              </p>
              <Link className="button-ghost" href="/secure-access">
                Return to sign in
              </Link>
            </div>
          </div>
          <ResetPasswordForm />
        </div>
      </section>
    </>
  );
}
