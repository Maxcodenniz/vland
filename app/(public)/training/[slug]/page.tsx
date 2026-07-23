import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BookingForm } from '@/components/forms/BookingForm';
import { FeatureCard } from '@/components/shared/FeatureCard';
import { PageHero } from '@/components/shared/PageHero';
import { siteConfig } from '@/lib/config/site';
import {
  getPublicCourseBySlug,
  getPublicCourses,
  getServiceOptions
} from '@/lib/data/live-content';
import { getEmbeddedVideoUrl } from '@/lib/media';

export async function generateStaticParams() {
  const courses = await getPublicCourses();
  return courses.map((course) => ({ slug: course.slug }));
}

export default async function CourseDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [course, courses, serviceOptions] = await Promise.all([
    getPublicCourseBySlug(slug),
    getPublicCourses(),
    getServiceOptions()
  ]);

  if (!course) {
    notFound();
  }

  const activeCourse = course;
  const embeddedVideoUrl =
    activeCourse.mediaType === 'video' ? getEmbeddedVideoUrl(activeCourse.mediaPath) : null;
  const relatedCourses = courses
    .filter((item) => item.slug !== activeCourse.slug)
    .sort((left, right) => {
      const leftScore = left.category === activeCourse.category ? 0 : 1;
      const rightScore = right.category === activeCourse.category ? 0 : 1;
      return leftScore - rightScore;
    })
    .slice(0, 3);

  return (
    <>
      <PageHero
        description={activeCourse.description}
        eyebrow={activeCourse.category}
        primaryCta={{ href: '/bookings', label: 'Request enrolment support' }}
        secondaryCta={{ href: '/contact', label: 'Ask a question' }}
        title={activeCourse.title}
      />

      <section className="section">
        <div className="container split">
          <div className="grid">
            <article className="card content-panel stack">
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <span className="badge">{activeCourse.durationLabel}</span>
                <span className="badge">{activeCourse.feeLabel}</span>
                <span className="badge">{activeCourse.scheduleLabel}</span>
              </div>
              <p className="section-description" style={{ margin: 0 }}>
                {activeCourse.description}
              </p>
              {activeCourse.mediaPath ? (
                <div className="post-media-preview">
                  {activeCourse.mediaType === 'video' ? (
                    embeddedVideoUrl ? (
                      <iframe
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="post-media-thumb community-post-embed"
                        referrerPolicy="strict-origin-when-cross-origin"
                        src={embeddedVideoUrl}
                        title={activeCourse.title}
                      />
                    ) : (
                      <video className="post-media-thumb" controls preload="metadata">
                        <source src={activeCourse.mediaPath} />
                      </video>
                    )
                  ) : (
                    <img alt={activeCourse.title} className="post-media-thumb" src={activeCourse.mediaPath} />
                  )}
                </div>
              ) : null}
            </article>

            <article className="card content-panel stack">
              <h2 style={{ margin: 0 }}>Course details</h2>
              <div className="grid columns-2">
                <div className="card" style={{ padding: '1rem 1.1rem' }}>
                  <strong>Category</strong>
                  <p className="muted" style={{ marginBottom: 0 }}>
                    {activeCourse.category}
                  </p>
                </div>
                <div className="card" style={{ padding: '1rem 1.1rem' }}>
                  <strong>Trainer</strong>
                  <p className="muted" style={{ marginBottom: 0 }}>
                    {activeCourse.trainerName || 'Assigned training facilitator'}
                  </p>
                </div>
                <div className="card" style={{ padding: '1rem 1.1rem' }}>
                  <strong>Duration</strong>
                  <p className="muted" style={{ marginBottom: 0 }}>
                    {activeCourse.durationLabel}
                  </p>
                </div>
                <div className="card" style={{ padding: '1rem 1.1rem' }}>
                  <strong>Schedule</strong>
                  <p className="muted" style={{ marginBottom: 0 }}>
                    {activeCourse.scheduleLabel}
                  </p>
                </div>
              </div>
            </article>
          </div>

          <div>
            <div className="grid">
              <article className="card content-panel stack">
                <span className="badge">Quick actions</span>
                <h2 style={{ margin: 0 }}>Ready to enroll?</h2>
                <p className="muted" style={{ margin: 0 }}>
                  Use the booking form for structured training requests or contact the team directly
                  for schedules, fees and upcoming intakes.
                </p>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.85rem'
                  }}
                >
                  <Link className="button" href={`https://wa.me/${siteConfig.whatsappNumber}`}>
                    Contact on WhatsApp
                  </Link>
                  <Link className="button-ghost" href="/training">
                    Back to course catalog
                  </Link>
                </div>
              </article>

              <article className="card content-panel stack">
                <span className="badge">Enrollment form</span>
                <BookingForm defaultServiceSlug="it-courses" services={serviceOptions} />
              </article>
            </div>
          </div>
        </div>
      </section>

      {relatedCourses.length ? (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container grid">
            <div className="stack" style={{ gap: '0.4rem' }}>
              <span className="badge">Related courses</span>
              <h2 className="section-title" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}>
                Keep exploring training options
              </h2>
              <p className="section-description">
                These courses are close to {activeCourse.title.toLowerCase()} or fit a similar
                learning path.
              </p>
            </div>
            <div className="grid columns-3">
              {relatedCourses.map((item) => (
                <FeatureCard
                  ctaLabel="Open course"
                  description={item.description}
                  href={`/training/${item.slug}`}
                  key={item.slug}
                  mediaPath={item.mediaPath}
                  mediaType={item.mediaType}
                  meta={`${item.category} • ${item.durationLabel} • ${item.feeLabel}`}
                  title={item.title}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
