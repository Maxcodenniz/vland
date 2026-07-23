import Link from 'next/link';

import { CommunityPostCard } from '@/components/community/CommunityPostCard';
import {
  getPublicCommunityPosts,
  getVisibleContentBlocksByPrefix
} from '@/lib/data/live-content';
import { getEmbeddedVideoUrl } from '@/lib/media';

export default async function CommunityPage() {
  const [communityPosts, adverts] = await Promise.all([
    getPublicCommunityPosts(),
    getVisibleContentBlocksByPrefix('community-ad')
  ]);

  return (
    <section className="section">
      <div className="container">
        <div className="community-layout">
          <div>
            {communityPosts.length ? (
              <div className="community-feed">
                {communityPosts.map((post) => (
                  <CommunityPostCard key={post.id} {...post} />
                ))}
              </div>
            ) : (
              <div className="card content-panel empty-state">
                <h3 style={{ marginTop: 0 }}>No live posts yet</h3>
                <p className="muted" style={{ marginBottom: 0 }}>
                  Community posts will appear here as soon as they are published from the private
                  workspace.
                </p>
              </div>
            )}
          </div>

          {adverts.length ? (
            <aside className="community-sidebar">
              <div className="community-sidebar-stack">
                <div className="card content-panel community-sidebar-intro">
                  <span className="section-label">Adverts</span>
                </div>

                {adverts.map((advert) => {
                  const embeddedVideoUrl =
                    advert.mediaType === 'video' ? getEmbeddedVideoUrl(advert.mediaPath) : null;

                  return (
                    <article className="card content-panel stack community-ad-card" key={advert.id}>
                      {advert.eyebrow ? <span className="section-label">{advert.eyebrow}</span> : null}
                      <h3 style={{ margin: 0 }}>{advert.title}</h3>
                      {advert.subtitle ? (
                        <p className="muted" style={{ margin: 0 }}>
                          {advert.subtitle}
                        </p>
                      ) : null}
                      {advert.mediaPath ? (
                        advert.mediaType === 'video' ? (
                          embeddedVideoUrl ? (
                            <iframe
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="post-media-thumb community-post-embed"
                              referrerPolicy="strict-origin-when-cross-origin"
                              src={embeddedVideoUrl}
                              title={advert.title}
                            />
                          ) : (
                            <video className="community-ad-media" controls preload="metadata">
                              <source src={advert.mediaPath} />
                            </video>
                          )
                        ) : (
                          <img alt={advert.title} className="community-ad-media" src={advert.mediaPath} />
                        )
                      ) : null}
                      {advert.body ? (
                        <p className="section-description" style={{ margin: 0 }}>
                          {advert.body}
                        </p>
                      ) : null}
                      {advert.ctaLabel && advert.ctaHref ? (
                        <div className="inline-actions">
                          <Link className="button-secondary" href={advert.ctaHref}>
                            {advert.ctaLabel}
                          </Link>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </section>
  );
}
