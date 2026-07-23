import { PageHero } from '@/components/shared/PageHero';
import { galleryHighlights, services } from '@/lib/data/site-content';
import {
  getConfigurablePageHero,
  getPublicGalleryMedia
} from '@/lib/data/live-content';

export default async function GalleryPage() {
  const [hero, mediaItems] = await Promise.all([
    getConfigurablePageHero('gallery-hero', {
      eyebrow: 'Gallery',
      title: 'A gallery structure ready for albums, categories and featured media.',
      description:
        'Showcase featured albums, category filters, media pagination and admin-uploaded photos and videos with optimized delivery.',
      primaryCta: { href: '/bookings', label: 'Book a shoot' },
      secondaryCta: { href: '/community', label: 'View latest posts' }
    }),
    getPublicGalleryMedia()
  ]);
  const categories = Array.from(new Set(mediaItems.map((item) => item.category)));

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
        <div className="container">
          <div className="inline-actions" style={{ marginBottom: '1.5rem' }}>
            {(categories.length
              ? categories
              : Array.from(new Set(services.map((service) => service.category)))
            ).map((category) => (
              <span className="badge" key={category}>
                {category}
              </span>
            ))}
          </div>
          <div className="grid columns-3">
            {(mediaItems.length
              ? mediaItems
              : galleryHighlights.map((item, index) => ({
                  id: `fallback-gallery-${index + 1}`,
                  albumTitle: item.title,
                  category: item.category,
                  mediaType: 'image' as const,
                  fileUrl: item.image,
                  thumbnailUrl: item.image,
                  altText: item.title
                }))
            ).map((item) => (
              <article className="card" key={item.id} style={{ overflow: 'hidden' }}>
                {item.mediaType === 'video' ? (
                  <video className="gallery-public-video" controls muted preload="metadata">
                    <source src={item.fileUrl} />
                  </video>
                ) : (
                  <img alt={item.altText} className="image-cover" src={item.fileUrl} />
                )}
                <div className="content-panel stack">
                  <span className="badge">{item.category}</span>
                  <h3 style={{ margin: 0 }}>{item.albumTitle}</h3>
                  <p className="muted" style={{ margin: 0 }}>
                    Public gallery media managed from the private dashboard.
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
