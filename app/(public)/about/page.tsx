import { FeatureCard } from '@/components/shared/FeatureCard';
import { PageHero } from '@/components/shared/PageHero';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { teamMembers } from '@/lib/data/site-content';
import { getConfigurablePageHero } from '@/lib/data/live-content';

const values = [
  {
    title: 'Mission',
    description:
      'Deliver reliable media, training and digital support services with professionalism, speed and care.'
  },
  {
    title: 'Vision',
    description:
      'Become the trusted creative and digital service hub for Saltpond and the wider Central Region.'
  },
  {
    title: 'Why Choose Us',
    description:
      'One welcoming service center for media, training, studio sessions and practical support.'
  }
];

export default async function AboutPage() {
  const hero = await getConfigurablePageHero('about-hero', {
    eyebrow: 'About VIDEOLAND MULTIMEDIA',
    title: 'A service center designed to support both everyday needs and special occasions.',
    description:
      'VIDEOLAND MULTIMEDIA combines creative production, studio sessions, digital skills training and practical registration support into one professional service center.',
    primaryCta: { href: '/contact', label: 'Talk to our team' },
    secondaryCta: { href: '/bookings', label: 'Book appointment' }
  });

  return (
    <>
      <PageHero
        description={hero.description}
        eyebrow={hero.eyebrow}
        primaryCta={hero.primaryCta}
        secondaryCta={hero.secondaryCta}
        title={hero.title}
      />

      <section className="section">
        <div className="container grid columns-3">
          {values.map((item) => (
            <FeatureCard
              description={item.description}
              key={item.title}
              title={item.title}
            />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeader
            description="Meet the people behind the service quality, creative direction and customer care."
            label="Team"
            title="Present the people behind the service quality."
          />
          <div className="grid columns-3">
            {teamMembers.map((member) => (
              <FeatureCard
                description={member.bio}
                key={member.name}
                meta={member.role}
                title={member.name}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
