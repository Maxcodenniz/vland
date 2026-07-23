'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AdminFeedbackToast } from '@/components/admin/AdminFeedbackToast';
import type { AdminPostRecord } from '@/lib/data/live-content';
import {
  getEmbeddedVideoUrl,
  inferMediaTypeFromPath as inferSharedMediaTypeFromPath,
  normalizeMediaGalleryPaths
} from '@/lib/media';

type Draft = Omit<AdminPostRecord, 'id' | 'likes' | 'comments'> & {
  tagsText: string;
};

const emptyDraft: Draft = {
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  category: '',
  tags: [],
  tagsText: '',
  coverMediaPath: '',
  mediaGalleryPaths: [],
  coverMediaType: 'text',
  status: 'published'
};

function parseTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function limitExcerpt(value: string) {
  return value.slice(0, 240);
}

function getApiMessage(result: {
  message?: string;
  errors?: {
    fieldErrors?: Record<string, string[] | undefined>;
    formErrors?: string[];
  };
}) {
  const firstFieldError = result.errors
    ? Object.values(result.errors.fieldErrors ?? {}).flat().find(Boolean)
    : null;

  return firstFieldError ?? result.errors?.formErrors?.[0] ?? result.message;
}

export function PostManager({ initialRecords }: { initialRecords: AdminPostRecord[] }) {
  const router = useRouter();
  const [records, setRecords] = useState(initialRecords);
  const [newRecord, setNewRecord] = useState<Draft>(emptyDraft);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploadingCreateMedia, setIsUploadingCreateMedia] = useState(false);
  const [uploadingRecordId, setUploadingRecordId] = useState<string | null>(null);
  const [newMediaFiles, setNewMediaFiles] = useState<File[]>([]);
  const [recordFiles, setRecordFiles] = useState<Record<string, File[]>>({});
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [recordMediaUrls, setRecordMediaUrls] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function updateRecord(id: string, patch: Partial<AdminPostRecord>) {
    setRecords((current) =>
      current.map((record) => (record.id === id ? { ...record, ...patch } : record))
    );
  }

  function inferMediaTypeFromPath(path: string): AdminPostRecord['coverMediaType'] {
    return inferSharedMediaTypeFromPath(path);
  }

  function buildMediaState(paths: Array<string | null | undefined>) {
    const mediaGalleryPaths = normalizeMediaGalleryPaths(paths);
    const coverMediaPath = mediaGalleryPaths[0] ?? '';

    return {
      coverMediaPath,
      mediaGalleryPaths,
      coverMediaType: inferMediaTypeFromPath(coverMediaPath)
    } satisfies Pick<AdminPostRecord, 'coverMediaPath' | 'mediaGalleryPaths' | 'coverMediaType'>;
  }

  async function uploadMedia(file: File) {
    const formData = new FormData();
    formData.set('file', file);

    const response = await fetch('/api/admin/posts/media/upload', {
      method: 'POST',
      body: formData
    });

    const result = (await response.json()) as {
      ok: boolean;
      message?: string;
      publicUrl?: string;
      mediaType?: 'image' | 'video';
    };

    if (!response.ok || !result.publicUrl || !result.mediaType) {
      throw new Error(result.message ?? 'Unable to upload post media.');
    }

    return result;
  }

  async function uploadMediaFiles(files: File[]) {
    const results = await Promise.all(files.map((file) => uploadMedia(file)));
    return results.map((result) => result.publicUrl ?? '').filter(Boolean);
  }

  async function uploadCreateMedia() {
    if (!newMediaFiles.length) {
      setError('Choose one or more media files before uploading.');
      return;
    }

    setIsUploadingCreateMedia(true);
    setError(null);
    setMessage(null);

    try {
      const uploadedPaths = await uploadMediaFiles(newMediaFiles);
      setNewRecord((current) => ({
        ...current,
        ...buildMediaState([...current.mediaGalleryPaths, ...uploadedPaths])
      }));
      setNewMediaFiles([]);
      setMessage(
        uploadedPaths.length > 1
          ? `${uploadedPaths.length} post media files uploaded.`
          : 'Post media uploaded.'
      );
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : 'Unable to upload post media.'
      );
    } finally {
      setIsUploadingCreateMedia(false);
    }
  }

  async function uploadRecordMedia(recordId: string) {
    const files = recordFiles[recordId] ?? [];
    const currentRecord = records.find((record) => record.id === recordId);
    const pendingMediaUrl = recordMediaUrls[recordId]?.trim() ?? '';

    if (!files.length) {
      setError('Choose one or more media files before uploading.');
      return;
    }

    if (!currentRecord) {
      setError('This post could not be found. Refresh and try again.');
      return;
    }

    setUploadingRecordId(recordId);
    setError(null);
    setMessage(null);

    try {
      const uploadedPaths = await uploadMediaFiles(files);
      const nextRecord = {
        ...currentRecord,
        ...buildMediaState([
          ...currentRecord.mediaGalleryPaths,
          ...(pendingMediaUrl ? [pendingMediaUrl] : []),
          ...uploadedPaths
        ])
      } satisfies AdminPostRecord;

      updateRecord(recordId, {
        coverMediaPath: nextRecord.coverMediaPath,
        mediaGalleryPaths: nextRecord.mediaGalleryPaths,
        coverMediaType: nextRecord.coverMediaType
      });
      setRecordFiles((current) => ({ ...current, [recordId]: [] }));
      if (pendingMediaUrl) {
        setRecordMediaUrls((current) => ({ ...current, [recordId]: '' }));
      }
      await saveRecord(nextRecord, 'Post media uploaded and saved.');
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : 'Unable to upload post media.'
      );
    } finally {
      setUploadingRecordId(null);
    }
  }

  async function saveRecord(record: AdminPostRecord, successMessage?: string) {
    setSavingId(record.id);
    setMessage(null);
    setError(null);
    const response = await fetch(`/api/admin/posts/${record.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    const result = (await response.json()) as { ok: boolean; message?: string };
    setSavingId(null);
    if (!response.ok) {
      setError(getApiMessage(result) ?? 'Unable to save this post.');
      return;
    }
    setMessage(successMessage ?? result.message ?? 'Post saved.');
    router.refresh();
  }

  async function saveRecordWithPendingMedia(recordId: string) {
    const pendingFiles = recordFiles[recordId] ?? [];
    const pendingMediaUrl = recordMediaUrls[recordId]?.trim() ?? '';

    if (pendingFiles.length) {
      await uploadRecordMedia(recordId);
      return;
    }

    const currentRecord = records.find((record) => record.id === recordId);

    if (!currentRecord) {
      setError('This post could not be found. Refresh and try again.');
      return;
    }

    const nextRecord = pendingMediaUrl
      ? ({
          ...currentRecord,
          ...buildMediaState([...currentRecord.mediaGalleryPaths, pendingMediaUrl])
        } satisfies AdminPostRecord)
      : currentRecord;

    if (pendingMediaUrl) {
      updateRecord(recordId, {
        coverMediaPath: nextRecord.coverMediaPath,
        mediaGalleryPaths: nextRecord.mediaGalleryPaths,
        coverMediaType: nextRecord.coverMediaType
      });
      setRecordMediaUrls((current) => ({ ...current, [recordId]: '' }));
    }

    await saveRecord(nextRecord);
  }

  function addCreateMediaUrl() {
    if (!newMediaUrl.trim()) {
      setError('Enter a media URL before adding it.');
      return;
    }

    setError(null);
    setMessage(null);
    setNewRecord((current) => ({
      ...current,
      ...buildMediaState([...current.mediaGalleryPaths, newMediaUrl])
    }));
    setNewMediaUrl('');
  }

  function addRecordMediaUrl(recordId: string) {
    const currentRecord = records.find((record) => record.id === recordId);
    const nextUrl = recordMediaUrls[recordId]?.trim() ?? '';

    if (!nextUrl) {
      setError('Enter a media URL before adding it.');
      return;
    }

    if (!currentRecord) {
      setError('This post could not be found. Refresh and try again.');
      return;
    }

    setError(null);
    setMessage(null);
    updateRecord(recordId, {
      ...buildMediaState([...currentRecord.mediaGalleryPaths, nextUrl])
    });
    setRecordMediaUrls((current) => ({ ...current, [recordId]: '' }));
  }

  function removeCreateMedia(index: number) {
    setNewRecord((current) => ({
      ...current,
      ...buildMediaState(current.mediaGalleryPaths.filter((_, itemIndex) => itemIndex !== index))
    }));
  }

  function removeRecordMedia(recordId: string, index: number) {
    const currentRecord = records.find((record) => record.id === recordId);

    if (!currentRecord) {
      return;
    }

    updateRecord(recordId, {
      ...buildMediaState(currentRecord.mediaGalleryPaths.filter((_, itemIndex) => itemIndex !== index))
    });
  }

  function renderMediaPreviewList(
    paths: string[],
    title: string,
    onRemove: (index: number) => void
  ) {
    if (!paths.length) {
      return null;
    }

    return (
      <div className="stack">
        {paths.map((path, index) => {
          const mediaType = inferMediaTypeFromPath(path);
          const embeddedVideoUrl = mediaType === 'video' ? getEmbeddedVideoUrl(path) : null;

          return (
            <div className="post-media-preview stack" key={`${path}-${index}`}>
              <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
                <span className="badge">{index === 0 ? 'Primary media' : `Media ${index + 1}`}</span>
                <div className="inline-actions">
                  <span className="badge">{mediaType}</span>
                  <button className="button-ghost" onClick={() => onRemove(index)} type="button">
                    Remove
                  </button>
                </div>
              </div>
              {mediaType === 'video' ? (
                embeddedVideoUrl ? (
                  <iframe
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="post-media-thumb community-post-embed"
                    referrerPolicy="strict-origin-when-cross-origin"
                    src={embeddedVideoUrl}
                    title={`${title} media ${index + 1}`}
                  />
                ) : (
                  <video className="post-media-thumb" controls preload="metadata">
                    <source src={path} />
                  </video>
                )
              ) : (
                <img alt={`${title} media ${index + 1}`} className="post-media-thumb" src={path} />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  async function createRecord() {
    const normalizedSlug = newRecord.slug || toSlug(newRecord.title);

    if (!newRecord.title.trim()) {
      setError('Enter a title for the post.');
      return;
    }

    if (!normalizedSlug) {
      setError('Enter a title or slug for the post.');
      return;
    }

    if (newRecord.body.trim().length < 20) {
      setError('The post body must be at least 20 characters long.');
      return;
    }

    setIsCreating(true);
    setMessage(null);
    setError(null);

    try {
      let mediaGalleryPaths = newRecord.mediaGalleryPaths;
      const pendingMediaUrl = newMediaUrl.trim();

      if (pendingMediaUrl) {
        mediaGalleryPaths = normalizeMediaGalleryPaths([...mediaGalleryPaths, pendingMediaUrl]);
        setNewMediaUrl('');
      }

      if (newMediaFiles.length) {
        const uploadedPaths = await uploadMediaFiles(newMediaFiles);
        mediaGalleryPaths = normalizeMediaGalleryPaths([...mediaGalleryPaths, ...uploadedPaths]);
        setNewRecord((current) => ({
          ...current,
          ...buildMediaState(mediaGalleryPaths)
        }));
        setNewMediaFiles([]);
      }

      const payload = {
        title: newRecord.title,
        slug: normalizedSlug,
        excerpt: newRecord.excerpt,
        body: newRecord.body,
        category: newRecord.category,
        tags: parseTags(newRecord.tagsText),
        coverMediaPath: mediaGalleryPaths[0] ?? '',
        mediaGalleryPaths,
        status: newRecord.status
      };

      const response = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
        errors?: {
          fieldErrors?: Record<string, string[] | undefined>;
          formErrors?: string[];
        };
      };
      setIsCreating(false);
      if (!response.ok) {
        setError(getApiMessage(result) ?? 'Unable to create this post.');
        return;
      }
      setNewRecord(emptyDraft);
      setMessage(result.message ?? 'Post created.');
      router.refresh();
    } catch (fetchError) {
      setIsCreating(false);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch');
    }
  }

  async function deleteRecord(record: AdminPostRecord) {
    if (!window.confirm(`Delete the post "${record.title}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(record.id);
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/admin/posts/${record.id}`, {
      method: 'DELETE'
    });
    const result = (await response.json()) as {
      ok: boolean;
      message?: string;
      errors?: {
        fieldErrors?: Record<string, string[] | undefined>;
        formErrors?: string[];
      };
    };

    setDeletingId(null);

    if (!response.ok) {
      setError(getApiMessage(result) ?? 'Unable to delete this post.');
      return;
    }

    setRecords((current) => current.filter((item) => item.id !== record.id));
    setRecordFiles((current) => {
      const next = { ...current };
      delete next[record.id];
      return next;
    });
    setRecordMediaUrls((current) => {
      const next = { ...current };
      delete next[record.id];
      return next;
    });
    setMessage(result.message ?? 'Post deleted.');
    router.refresh();
  }

  return (
    <section className="stack">
      <AdminFeedbackToast error={error} message={message} />
      <section className="card content-panel stack">
        <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Create post</h2>
          <span className="badge">{records.length} posts</span>
        </div>
        <div className="form-grid columns-2">
          <label><span className="muted">Title</span><input className="input" value={newRecord.title} onChange={(e) => setNewRecord((c) => {
            const nextTitle = e.target.value;
            const currentTitleSlug = toSlug(c.title);
            const shouldSyncSlug = !c.slug || c.slug === currentTitleSlug;

            return {
              ...c,
              title: nextTitle,
              slug: shouldSyncSlug ? toSlug(nextTitle) : c.slug
            };
          })} /></label>
          <label><span className="muted">Slug</span><input className="input" value={newRecord.slug} onChange={(e) => setNewRecord((c) => ({ ...c, slug: toSlug(e.target.value) }))} /></label>
          <label><span className="muted">Category</span><input className="input" value={newRecord.category} onChange={(e) => setNewRecord((c) => ({ ...c, category: e.target.value }))} /></label>
          <label><span className="muted">Status</span><select className="select" value={newRecord.status} onChange={(e) => setNewRecord((c) => ({ ...c, status: e.target.value as Draft['status'] }))}><option value="published">Published</option><option value="hidden">Hidden</option><option value="archived">Archived</option></select></label>
          <label><span className="muted">Media URL</span><input className="input" value={newMediaUrl} onChange={(e) => setNewMediaUrl(e.target.value)} /></label>
          <label><span className="muted">Tags (comma separated)</span><input className="input" value={newRecord.tagsText} onChange={(e) => setNewRecord((c) => ({ ...c, tagsText: e.target.value }))} /></label>
        </div>
        <div className="form-grid columns-2">
          <label>
            <span className="muted">Upload photos or videos</span>
            <input
              className="input"
              multiple
              onChange={(e) => setNewMediaFiles(Array.from(e.target.files ?? []))}
              type="file"
            />
          </label>
          <div className="inline-actions" style={{ justifyContent: 'end' }}>
            <button className="button-ghost" onClick={addCreateMediaUrl} type="button">
              Add URL media
            </button>
            <button className="button-ghost" disabled={isUploadingCreateMedia} onClick={uploadCreateMedia} type="button">
              {isUploadingCreateMedia ? 'Uploading...' : 'Upload selected media'}
            </button>
          </div>
        </div>
        {newMediaFiles.length ? (
          <p className="muted" style={{ margin: 0 }}>
            {newMediaFiles.length} file(s) selected. Creating the post will upload them automatically.
          </p>
        ) : null}
        {renderMediaPreviewList(newRecord.mediaGalleryPaths, newRecord.title || 'Post', removeCreateMedia)}
        <label><span className="muted">Excerpt</span><textarea className="textarea" maxLength={240} value={newRecord.excerpt} onChange={(e) => setNewRecord((c) => ({ ...c, excerpt: limitExcerpt(e.target.value) }))} /></label>
        <label><span className="muted">Body</span><textarea className="textarea" value={newRecord.body} onChange={(e) => setNewRecord((c) => ({ ...c, body: e.target.value }))} /></label>
        <p className="muted" style={{ margin: 0 }}>
          Use a title, a slug, and at least 20 characters in the body. The excerpt allows up to 240 characters. The first media item becomes the primary cover.
        </p>
        <div className="inline-actions">
          <button className="button-secondary" type="button" disabled={isCreating} onClick={createRecord}>
            {isCreating ? 'Creating...' : 'Create post'}
          </button>
          <button
            className="button-ghost"
            onClick={() =>
              setNewRecord((current) => ({
                ...current,
                slug: current.slug || toSlug(current.title)
              }))
            }
            type="button"
          >
            Generate slug from title
          </button>
        </div>
      </section>
      <section className="admin-records">
        {records.map((record) => (
          <article className="card content-panel stack" key={record.id}>
            <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0 }}>{record.title}</h2>
              <span className="badge">{record.likes} likes / {record.comments} comments</span>
            </div>
            <div className="form-grid columns-2">
              <label><span className="muted">Title</span><input className="input" value={record.title} onChange={(e) => updateRecord(record.id, { title: e.target.value })} /></label>
              <label><span className="muted">Slug</span><input className="input" value={record.slug} onChange={(e) => updateRecord(record.id, { slug: e.target.value })} /></label>
              <label><span className="muted">Category</span><input className="input" value={record.category} onChange={(e) => updateRecord(record.id, { category: e.target.value })} /></label>
              <label><span className="muted">Status</span><select className="select" value={record.status} onChange={(e) => updateRecord(record.id, { status: e.target.value as AdminPostRecord['status'] })}><option value="published">Published</option><option value="hidden">Hidden</option><option value="archived">Archived</option></select></label>
              <label><span className="muted">Media URL</span><input className="input" value={recordMediaUrls[record.id] ?? ''} onChange={(e) => setRecordMediaUrls((current) => ({ ...current, [record.id]: e.target.value }))} /></label>
              <label><span className="muted">Tags (comma separated)</span><input className="input" value={record.tags.join(', ')} onChange={(e) => updateRecord(record.id, { tags: parseTags(e.target.value) })} /></label>
            </div>
            <div className="form-grid columns-2">
              <label>
                <span className="muted">Upload photos or videos</span>
                <input
                  className="input"
                  onChange={(e) =>
                    setRecordFiles((current) => ({
                      ...current,
                      [record.id]: Array.from(e.target.files ?? [])
                    }))
                  }
                  multiple
                  type="file"
                />
              </label>
              <div className="inline-actions" style={{ justifyContent: 'end' }}>
                <button className="button-ghost" onClick={() => addRecordMediaUrl(record.id)} type="button">
                  Add URL media
                </button>
                <button
                  className="button-ghost"
                  disabled={uploadingRecordId === record.id}
                  onClick={() => uploadRecordMedia(record.id)}
                  type="button"
                >
                  {uploadingRecordId === record.id ? 'Uploading...' : 'Upload selected media'}
                </button>
              </div>
            </div>
            {(recordFiles[record.id] ?? []).length ? (
              <p className="muted" style={{ margin: 0 }}>
                {(recordFiles[record.id] ?? []).length} file(s) selected. Saving this post will upload them automatically.
              </p>
            ) : null}
            {renderMediaPreviewList(record.mediaGalleryPaths, record.title, (index) =>
              removeRecordMedia(record.id, index)
            )}
            <label><span className="muted">Excerpt</span><textarea className="textarea" maxLength={240} value={record.excerpt} onChange={(e) => updateRecord(record.id, { excerpt: limitExcerpt(e.target.value) })} /></label>
            <label><span className="muted">Body</span><textarea className="textarea" value={record.body} onChange={(e) => updateRecord(record.id, { body: e.target.value })} /></label>
            <div className="inline-actions">
              <button className="button-secondary" type="button" disabled={savingId === record.id || uploadingRecordId === record.id || deletingId === record.id} onClick={() => saveRecordWithPendingMedia(record.id)}>
                {uploadingRecordId === record.id
                  ? 'Uploading...'
                  : savingId === record.id
                    ? 'Saving...'
                    : (recordFiles[record.id] ?? []).length
                      ? 'Upload and save post'
                      : 'Save post'}
              </button>
              <button
                className="button-ghost"
                disabled={savingId === record.id || uploadingRecordId === record.id || deletingId === record.id}
                onClick={() => deleteRecord(record)}
                type="button"
              >
                {deletingId === record.id ? 'Deleting...' : 'Delete post'}
              </button>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
