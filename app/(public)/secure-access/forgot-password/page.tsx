import Link from 'next/link';

import { ForgotPasswordForm } from '@/components/forms/ForgotPasswordForm';
import { PageHero } from '@/components/shared/PageHero';

export default function ForgotPasswordPage() {
  return (
    <>
      <PageHero
        description="Request a secure password reset link for your private staff account."
        eyebrow="Private Staff Access"
        primaryCta={{ href: '/secure-access', label: 'Back to sign in' }}
        secondaryCta={{ href: '/contact', label: 'Need support?' }}
        title="Reset admin or moderator password."
      />
      <section className="section">
        <div className="container split">
          <div className="stack">
            <div className="card content-panel stack">
              <span className="badge">Recovery</span>
              <h2 style={{ margin: 0 }}>Send a recovery link</h2>
              <p className="section-description">
                Enter the approved work email for your VIDEOLAND MULTIMEDIA staff
                account and we will send a secure reset link.
              </p>
              <Link className="button-ghost" href="/secure-access">
                Return to sign in
              </Link>
            </div>
          </div>
          <ForgotPasswordForm />
        </div>
      </section>
    </>
  );
}
