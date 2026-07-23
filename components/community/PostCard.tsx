import Link from 'next/link';

import { getEmbeddedVideoUrl } from '@/lib/media';

type PostCardProps = {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  author: string;
  reactionCount: number;
  commentCount: number;
  mediaType: 'image' | 'video' | 'text';
  coverMediaPath?: string;
  mediaGalleryPaths?: string[];
};

export function PostCard({
  id,
  title,
  category,
  excerpt,
  author,
  reactionCount,
  commentCount,
  mediaType,
  coverMediaPath,
  mediaGalleryPaths
}: PostCardProps) {
  const primaryMediaPath = mediaGalleryPaths?.[0] || coverMediaPath;
  const embeddedVideoUrl = mediaType === 'video' ? getEmbeddedVideoUrl(primaryMediaPath ?? '') : null;

  return (
    <article className="card wall-post stack" id={`community-preview-${id}`}>
      {primaryMediaPath ? (
        mediaType === 'video' ? (
          embeddedVideoUrl ? (
            <iframe
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="post-card-media community-post-embed"
              referrerPolicy="strict-origin-when-cross-origin"
              src={embeddedVideoUrl}
              title={title}
            />
          ) : (
            <video className="post-card-media" controls preload="metadata">
              <source src={primaryMediaPath} />
            </video>
          )
        ) : (
          <img alt={title} className="post-card-media" src={primaryMediaPath} />
        )
      ) : null}
      <div className="inline-actions">
        <span className="badge">{category}</span>
        <span className="badge">{mediaType}</span>
        {(mediaGalleryPaths?.length ?? 0) > 1 ? (
          <span className="badge">{mediaGalleryPaths!.length} media</span>
        ) : null}
      </div>
      <h3 style={{ margin: 0 }}>{title}</h3>
      <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>
        {excerpt}
      </p>
      <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
        <span className="muted">By {author}</span>
        <span className="muted">
          {reactionCount} reactions • {commentCount} comments
        </span>
      </div>
      <div className="inline-actions">
        <Link className="button-ghost" href={`/community#post-${id}`}>
          Read more
        </Link>
      </div>
    </article>
  );
}
