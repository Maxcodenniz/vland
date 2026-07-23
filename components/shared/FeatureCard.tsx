import Link from 'next/link';

import { getEmbeddedVideoUrl } from '@/lib/media';

type FeatureCardProps = {
  title: string;
  description: string;
  meta?: string;
  href?: string;
  ctaLabel?: string;
  mediaPath?: string;
  mediaType?: 'image' | 'video' | 'text';
};

export function FeatureCard({
  title,
  description,
  meta,
  href,
  ctaLabel = 'Explore',
  mediaPath,
  mediaType = 'text'
}: FeatureCardProps) {
  const embeddedVideoUrl = mediaType === 'video' ? getEmbeddedVideoUrl(mediaPath ?? '') : null;

  return (
    <article className="card content-panel stack">
      {mediaPath ? (
        <div className="post-media-preview">
          {mediaType === 'video' ? (
            embeddedVideoUrl ? (
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="post-media-thumb community-post-embed"
                referrerPolicy="strict-origin-when-cross-origin"
                src={embeddedVideoUrl}
                title={title}
              />
            ) : (
              <video className="post-media-thumb" controls preload="metadata">
                <source src={mediaPath} />
              </video>
            )
          ) : (
            <img alt={title} className="post-media-thumb" src={mediaPath} />
          )}
        </div>
      ) : null}
      {meta ? <span className="badge">{meta}</span> : null}
      <h3 style={{ margin: 0, fontSize: '1.35rem' }}>{title}</h3>
      <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>
        {description}
      </p>
      {href ? (
        <Link className="button-ghost" href={href}>
          {ctaLabel}
        </Link>
      ) : null}
    </article>
  );
}
