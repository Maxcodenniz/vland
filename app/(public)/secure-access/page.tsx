import Link from 'next/link';

import { AdminLoginForm } from '@/components/forms/AdminLoginForm';
import { PageHero } from '@/components/shared/PageHero';

export default async function SecureAccessPage({
  searchParams
}: {
  searchParams: Promise<{
    redirectTo?: string;
    denied?: string;
  }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirectTo || '/admin';
  const denied = params.denied === '1';

  return (
    <>
      <PageHero
        description="Private access for VIDEOLAND MULTIMEDIA administrators and moderators. This page is not listed in the public navigation."
        eyebrow="Private Staff Access"
        primaryCta={{ href: '/', label: 'Back to homepage' }}
        secondaryCta={{ href: '/contact', label: 'Need help?' }}
        title="Sign in to the private admin workspace."
      />
      <section className="section">
        <div className="container split">
          <div className="stack">
            <div className="card content-panel stack">
              <span className="badge">Authorized staff only</span>
              <h2 style={{ margin: 0 }}>Admin and moderator sign in</h2>
              <p className="section-description">
                Use your approved work account to access content management,
                booking tools, moderation workflows and private settings.
              </p>
              <Link className="button-ghost" href="/secure-access/forgot-password">
                Forgot password?
              </Link>
              {denied ? (
                <p className="auth-error" style={{ margin: 0 }}>
                  Your account does not currently have permission to access that
                  private page.
                </p>
              ) : null}
            </div>
          </div>
          <AdminLoginForm redirectTo={redirectTo} />
        </div>
      </section>
    </>
  );
}
