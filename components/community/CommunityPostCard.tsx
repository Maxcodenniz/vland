'use client';

import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Minus,
  Plus,
  Send,
  Share2,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { AdminFeedbackToast } from '@/components/admin/AdminFeedbackToast';
import { COMMUNITY_REACTIONS, type CommunityReactionType } from '@/lib/community';
import type {
  PublicCommunityComment,
  PublicCommunityPostRecord
} from '@/lib/data/live-content';
import { getEmbeddedVideoUrl, inferMediaTypeFromPath } from '@/lib/media';

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMs = date.getTime() - Date.now();
  const minutes = Math.round(diffMs / (1000 * 60));

  if (Math.abs(minutes) < 60) {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(minutes, 'minute');
  }

  const hours = Math.round(minutes / 60);

  if (Math.abs(hours) < 24) {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(hours, 'hour');
  }

  const days = Math.round(hours / 24);
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(days, 'day');
}

type ReactionSummary = PublicCommunityPostRecord['topReactions'];

export function CommunityPostCard({
  id,
  title,
  category,
  excerpt,
  body,
  author,
  createdAt,
  reactionCount: initialReactionCount,
  commentCount: initialCommentCount,
  coverMediaPath,
  mediaGalleryPaths,
  viewerReaction: initialViewerReaction,
  topReactions: initialTopReactions,
  recentComments
}: PublicCommunityPostRecord) {
  const galleryPaths = mediaGalleryPaths.length ? mediaGalleryPaths : coverMediaPath ? [coverMediaPath] : [];
  const [viewerReaction, setViewerReaction] = useState<CommunityReactionType | null>(
    initialViewerReaction
  );
  const [reactionCount, setReactionCount] = useState(initialReactionCount);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [topReactions, setTopReactions] = useState<ReactionSummary>(initialTopReactions);
  const [comments, setComments] = useState<PublicCommunityComment[]>(recentComments);
  const [commentName, setCommentName] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [isReacting, setIsReacting] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isCommentFormOpen, setIsCommentFormOpen] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [viewerZoom, setViewerZoom] = useState(1);
  const [viewerTouchStartX, setViewerTouchStartX] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentMediaIndex = Math.min(activeMediaIndex, Math.max(galleryPaths.length - 1, 0));
  const activeMediaPath = galleryPaths[currentMediaIndex] ?? '';
  const activeMediaType = inferMediaTypeFromPath(activeMediaPath);
  const embeddedVideoUrl = activeMediaType === 'video' ? getEmbeddedVideoUrl(activeMediaPath) : null;
  const viewerImageIndices = galleryPaths.reduce<number[]>((indices, path, index) => {
    if (inferMediaTypeFromPath(path) === 'image') {
      indices.push(index);
    }

    return indices;
  }, []);
  const currentViewerImagePosition = viewerImageIndices.indexOf(currentMediaIndex);

  async function reactToPost(reactionType: CommunityReactionType) {
    setIsReacting(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(`/api/community/posts/${id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactionType })
      });
      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
        viewerReaction?: CommunityReactionType | null;
        reactionCount?: number;
        topReactions?: ReactionSummary;
      };

      if (!response.ok) {
        setError(result.message ?? 'Unable to save your reaction right now.');
        return;
      }

      setViewerReaction(result.viewerReaction ?? null);
      setReactionCount(result.reactionCount ?? 0);
      setTopReactions(result.topReactions ?? []);
    } catch (reactionError) {
      setError(
        reactionError instanceof Error
          ? reactionError.message
          : 'Unable to save your reaction right now.'
      );
    } finally {
      setIsReacting(false);
    }
  }

  async function addComment() {
    if (commentName.trim().length < 2) {
      setError('Enter your name before posting a comment.');
      return;
    }

    if (commentBody.trim().length < 2) {
      setError('Write a comment before posting.');
      return;
    }

    setIsCommenting(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(`/api/community/posts/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestName: commentName, body: commentBody })
      });
      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
        comment?: PublicCommunityComment;
        commentCount?: number;
      };

      if (!response.ok || !result.comment) {
        setError(result.message ?? 'Unable to add your comment right now.');
        return;
      }

      setComments((current) => [result.comment!, ...current].slice(0, 3));
      setCommentCount(result.commentCount ?? commentCount + 1);
      setCommentBody('');
      setFeedback('Comment posted successfully.');
    } catch (commentError) {
      setError(
        commentError instanceof Error
          ? commentError.message
          : 'Unable to add your comment right now.'
      );
    } finally {
      setIsCommenting(false);
    }
  }

  async function sharePost() {
    const shareUrl = `${window.location.origin}/community#post-${id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: excerpt,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }

      setFeedback('Share link ready.');
      setError(null);
    } catch {
      setError('Unable to share this post right now.');
    }
  }

  function openImageViewer(index: number) {
    setActiveMediaIndex(index);
    setViewerZoom(1);
    setIsImageViewerOpen(true);
  }

  function closeImageViewer() {
    setIsImageViewerOpen(false);
    setViewerZoom(1);
    setViewerTouchStartX(null);
  }

  function zoomViewer(delta: number) {
    setViewerZoom((current) => {
      const next = current + delta;
      return Math.min(4, Math.max(1, Number(next.toFixed(2))));
    });
  }

  function moveViewerBy(offset: number) {
    if (viewerImageIndices.length < 2 || currentViewerImagePosition < 0) {
      return;
    }

    const nextPosition =
      (currentViewerImagePosition + offset + viewerImageIndices.length) % viewerImageIndices.length;
    setActiveMediaIndex(viewerImageIndices[nextPosition]!);
    setViewerZoom(1);
  }

  function handleViewerTouchEnd(clientX: number) {
    if (viewerTouchStartX === null || viewerImageIndices.length < 2) {
      setViewerTouchStartX(null);
      return;
    }

    const deltaX = clientX - viewerTouchStartX;
    setViewerTouchStartX(null);

    if (Math.abs(deltaX) < 40) {
      return;
    }

    moveViewerBy(deltaX < 0 ? 1 : -1);
  }

  useEffect(() => {
    if (!isImageViewerOpen || activeMediaType !== 'image') {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeImageViewer();
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        moveViewerBy(-1);
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        moveViewerBy(1);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMediaType, currentViewerImagePosition, isImageViewerOpen, viewerImageIndices.length]);

  return (
    <article className="card community-post-card stack" id={`post-${id}`}>
      <div className="community-post-header">
        <div className="community-post-avatar" aria-hidden="true">
          {author.charAt(0)}
        </div>
        <div className="stack" style={{ gap: '0.2rem' }}>
          <strong>{author}</strong>
          <div className="community-post-meta">
            <span>{category}</span>
            <span>•</span>
            <span>{formatRelativeTime(createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="stack" style={{ gap: '0.7rem' }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <p className="muted" style={{ margin: 0, lineHeight: 1.75 }}>
          {body || excerpt}
        </p>
      </div>

      {galleryPaths.length ? (
        <div className="community-post-gallery stack">
          {activeMediaType === 'video' ? (
            embeddedVideoUrl ? (
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="community-post-media community-post-embed"
                referrerPolicy="strict-origin-when-cross-origin"
                src={embeddedVideoUrl}
                title={title}
              />
            ) : (
              <video className="community-post-media" controls preload="metadata">
                <source src={activeMediaPath} />
              </video>
            )
          ) : (
            <button
              className="community-media-stage-button"
              onClick={() => openImageViewer(currentMediaIndex)}
              type="button"
            >
              <img alt={title} className="community-post-media" src={activeMediaPath} />
            </button>
          )}
          {galleryPaths.length > 1 ? (
            <div className="community-post-thumbnails">
              {galleryPaths.map((path, index) => {
                const itemType = inferMediaTypeFromPath(path);
                const isActive = index === currentMediaIndex;

                return (
                  <button
                    className={isActive ? 'community-post-thumbnail active' : 'community-post-thumbnail'}
                    key={`${path}-${index}`}
                    onClick={() => setActiveMediaIndex(index)}
                    type="button"
                  >
                    {itemType === 'video' ? (
                      getEmbeddedVideoUrl(path) ? (
                        <span className="community-post-thumbnail-label">Video</span>
                      ) : (
                        <video className="community-post-thumbnail-media" muted playsInline preload="metadata">
                          <source src={path} />
                        </video>
                      )
                    ) : (
                      <img
                        alt={`${title} media ${index + 1}`}
                        className="community-post-thumbnail-media"
                        src={path}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="community-post-summary">
        <div className="community-reaction-stack">
          {topReactions.length ? (
            <div className="community-top-reactions">
              {topReactions.map((reaction) => (
                <span className="community-reaction-pill" key={reaction.type}>
                  <span>{reaction.emoji}</span>
                  <span>{reaction.count}</span>
                </span>
              ))}
            </div>
          ) : (
            <span className="muted">Be the first to react</span>
          )}
        </div>
        <span className="muted">
          {reactionCount} reactions • {commentCount} comments
        </span>
      </div>

      <div className="community-reaction-bar">
        {COMMUNITY_REACTIONS.map((reaction) => (
          <button
            className={viewerReaction === reaction.type ? 'community-action active' : 'community-action'}
            disabled={isReacting}
            key={reaction.type}
            onClick={() => reactToPost(reaction.type)}
            type="button"
          >
            <span>{reaction.emoji}</span>
            <span>{reaction.label}</span>
          </button>
        ))}
      </div>

      <div className="community-post-actions">
        <button
          aria-expanded={isCommentFormOpen}
          className="community-secondary-action"
          onClick={() => setIsCommentFormOpen((current) => !current)}
          type="button"
        >
          <MessageCircle size={16} />
          <span>Comment</span>
        </button>
        <button className="community-secondary-action" onClick={sharePost} type="button">
          <Share2 size={16} />
          <span>Share</span>
        </button>
      </div>

      {isCommentFormOpen ? (
        <div className="community-comment-form">
          <div className="form-grid columns-2">
            <input
              className="input"
              maxLength={60}
              onChange={(event) => setCommentName(event.target.value)}
              placeholder="Your name"
              value={commentName}
            />
            <button
              className="button-ghost"
              disabled={isCommenting}
              onClick={addComment}
              type="button"
            >
              <Send size={16} />
              <span>{isCommenting ? 'Posting...' : 'Post comment'}</span>
            </button>
          </div>
          <textarea
            className="textarea"
            maxLength={1000}
            onChange={(event) => setCommentBody(event.target.value)}
            placeholder="Write a comment..."
            value={commentBody}
          />
        </div>
      ) : null}

      <div className="community-comment-list">
        {comments.length ? (
          comments.map((comment) => (
            <article className="community-comment-item" key={comment.id}>
              <div className="community-comment-name">{comment.authorName}</div>
              <p style={{ margin: 0 }}>{comment.body}</p>
              <span className="muted">{formatRelativeTime(comment.createdAt)}</span>
            </article>
          ))
        ) : (
          <div className="community-empty-comments">No comments yet. Start the conversation.</div>
        )}
      </div>

      {isImageViewerOpen && activeMediaType === 'image' ? (
        <div className="community-image-viewer" onClick={closeImageViewer} role="dialog" aria-modal="true">
          <div className="community-image-viewer-panel" onClick={(event) => event.stopPropagation()}>
            <div className="community-image-viewer-toolbar">
              <div className="community-image-viewer-status">
                <span className="badge">Zoom {Math.round(viewerZoom * 100)}%</span>
                {viewerImageIndices.length > 1 && currentViewerImagePosition >= 0 ? (
                  <span className="muted">
                    Image {currentViewerImagePosition + 1} of {viewerImageIndices.length} · Use arrow
                    keys or swipe
                  </span>
                ) : null}
              </div>
              <div className="inline-actions">
                {viewerImageIndices.length > 1 ? (
                  <>
                    <button className="community-secondary-action" onClick={() => moveViewerBy(-1)} type="button">
                      <ChevronLeft size={16} />
                      <span>Previous</span>
                    </button>
                    <button className="community-secondary-action" onClick={() => moveViewerBy(1)} type="button">
                      <ChevronRight size={16} />
                      <span>Next</span>
                    </button>
                  </>
                ) : null}
                <button className="community-secondary-action" onClick={() => zoomViewer(-0.25)} type="button">
                  <Minus size={16} />
                  <span>Zoom out</span>
                </button>
                <button className="community-secondary-action" onClick={() => setViewerZoom(1)} type="button">
                  <span>Reset</span>
                </button>
                <button className="community-secondary-action" onClick={() => zoomViewer(0.25)} type="button">
                  <Plus size={16} />
                  <span>Zoom in</span>
                </button>
                <button className="community-secondary-action" onClick={closeImageViewer} type="button">
                  <X size={16} />
                  <span>Close</span>
                </button>
              </div>
            </div>
            <div
              className="community-image-viewer-canvas"
              onTouchEnd={(event) => handleViewerTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
              onTouchStart={(event) => setViewerTouchStartX(event.touches[0]?.clientX ?? null)}
            >
              <img
                alt={title}
                className="community-image-viewer-image"
                src={activeMediaPath}
                style={{ transform: `scale(${viewerZoom})` }}
              />
            </div>
            {viewerImageIndices.length > 1 ? (
              <p className="muted community-image-viewer-hint" style={{ margin: 0 }}>
                Swipe left or right to view the next image.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <AdminFeedbackToast error={error} message={feedback} />
    </article>
  );
}
