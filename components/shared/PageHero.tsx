import Link from 'next/link';

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  fullWidth?: boolean;
};

export function PageHero({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
  fullWidth = true
}: PageHeroProps) {
  return (
    <section className={`page-hero${fullWidth ? ' page-hero-full' : ''}`}>
      <div className={`container${fullWidth ? ' container-wide' : ''}`}>
        <div className="card hero-panel stack">
          <span className="section-label">{eyebrow}</span>
          <h1 className="section-title">{title}</h1>
          <p className="section-description">{description}</p>
          <div className="inline-actions">
            {primaryCta ? (
              <Link className="button" href={primaryCta.href}>
                {primaryCta.label}
              </Link>
            ) : null}
            {secondaryCta ? (
              <Link className="button-ghost" href={secondaryCta.href}>
                {secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
