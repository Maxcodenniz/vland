'use client';

import { useState } from 'react';

import { AdminFeedbackToast } from '@/components/admin/AdminFeedbackToast';
import type { AdminGalleryMediaRecord } from '@/lib/data/live-content';

type UploadState = {
  title: string;
  altText: string;
  sortOrder: number;
  isFeatured: boolean;
  file: File | null;
};

type UrlState = {
  title: string;
  mediaType: 'image' | 'video';
  fileUrl: string;
  thumbnailUrl: string;
  altText: string;
  sortOrder: number;
  isFeatured: boolean;
};

const emptyUpload: UploadState = {
  title: '',
  altText: '',
  sortOrder: 0,
  isFeatured: false,
  file: null
};

const emptyUrl: UrlState = {
  title: '',
  mediaType: 'image',
  fileUrl: '',
  thumbnailUrl: '',
  altText: '',
  sortOrder: 0,
  isFeatured: false
};

export function GalleryMediaManager({
  albumId,
  initialRecords
}: {
  albumId: string;
  initialRecords: AdminGalleryMediaRecord[];
}) {
  const [records, setRecords] = useState(initialRecords);
  const [uploadDraft, setUploadDraft] = useState<UploadState>(emptyUpload);
  const [urlDraft, setUrlDraft] = useState<UrlState>(emptyUrl);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function updateRecord(id: string, patch: Partial<AdminGalleryMediaRecord>) {
    setRecords((current) =>
      current.map((record) => (record.id === id ? { ...record, ...patch } : record))
    );
  }

  async function uploadFromDevice() {
    if (!uploadDraft.file) {
      setError('Choose a media file before uploading.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.set('albumId', albumId);
    formData.set('title', uploadDraft.title);
    formData.set('altText', uploadDraft.altText);
    formData.set('sortOrder', String(uploadDraft.sortOrder));
    formData.set('isFeatured', String(uploadDraft.isFeatured));
    formData.set('file', uploadDraft.file);

    const response = await fetch('/api/admin/gallery/media/upload', {
      method: 'POST',
      body: formData
    });

    const result = (await response.json()) as {
      ok: boolean;
      message?: string;
      record?: AdminGalleryMediaRecord;
    };

    setIsUploading(false);

    if (!response.ok || !result.record) {
      setError(result.message ?? 'Unable to upload this media item.');
      return;
    }

    const uploadedRecord = result.record;
    setRecords((current) =>
      [...current, uploadedRecord].sort((a, b) => a.sortOrder - b.sortOrder)
    );
    setUploadDraft(emptyUpload);
    setMessage(result.message ?? 'Media uploaded.');
  }

  async function addByUrl() {
    setIsSavingUrl(true);
    setError(null);
    setMessage(null);

    const response = await fetch('/api/admin/gallery/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        albumId,
        title: urlDraft.title,
        mediaType: urlDraft.mediaType,
        fileUrl: urlDraft.fileUrl,
        thumbnailUrl: urlDraft.thumbnailUrl,
        altText: urlDraft.altText,
        sortOrder: urlDraft.sortOrder,
        isFeatured: urlDraft.isFeatured
      })
    });

    const result = (await response.json()) as {
      ok: boolean;
      message?: string;
      record?: AdminGalleryMediaRecord;
    };

    setIsSavingUrl(false);

    if (!response.ok || !result.record) {
      setError(result.message ?? 'Unable to save this media URL.');
      return;
    }

    const savedUrlRecord = result.record;
    setRecords((current) =>
      [...current, savedUrlRecord].sort((a, b) => a.sortOrder - b.sortOrder)
    );
    setUrlDraft(emptyUrl);
    setMessage(result.message ?? 'Media URL saved.');
  }

  async function saveRecord(record: AdminGalleryMediaRecord) {
    setSavingId(record.id);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/admin/gallery/media/${record.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });

    const result = (await response.json()) as {
      ok: boolean;
      message?: string;
      record?: AdminGalleryMediaRecord;
    };

    setSavingId(null);

    if (!response.ok || !result.record) {
      setError(result.message ?? 'Unable to save this media item.');
      return;
    }

    const updatedRecord = result.record;
    setRecords((current) =>
      current
        .map((item) => (item.id === updatedRecord.id ? updatedRecord : item))
        .sort((a, b) => a.sortOrder - b.sortOrder)
    );
    setMessage(result.message ?? 'Media item saved.');
  }

  async function deleteRecord(record: AdminGalleryMediaRecord) {
    if (!window.confirm(`Delete the media item "${record.title}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(record.id);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/admin/gallery/media/${record.id}`, {
      method: 'DELETE'
    });
    const result = (await response.json()) as {
      ok: boolean;
      message?: string;
    };

    setDeletingId(null);

    if (!response.ok) {
      setError(result.message ?? 'Unable to delete this media item.');
      return;
    }

    setRecords((current) => current.filter((item) => item.id !== record.id));
    setMessage(result.message ?? 'Media item deleted.');
  }

  return (
    <section className="stack media-manager">
      <AdminFeedbackToast error={error} message={message} />
      <div className="grid columns-2 media-manager-grid">
        <section className="card content-panel stack">
          <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>Upload from device</h3>
            <span className="badge">Local file</span>
          </div>
          <label>
            <span className="muted">Title</span>
            <input
              className="input"
              onChange={(event) =>
                setUploadDraft((current) => ({ ...current, title: event.target.value }))
              }
              value={uploadDraft.title}
            />
          </label>
          <label>
            <span className="muted">Media file</span>
            <input
              className="input"
              onChange={(event) =>
                setUploadDraft((current) => ({
                  ...current,
                  file: event.target.files?.[0] ?? null
                }))
              }
              type="file"
            />
          </label>
          <div className="form-grid columns-2">
            <label>
              <span className="muted">Alt text</span>
              <input
                className="input"
                onChange={(event) =>
                  setUploadDraft((current) => ({ ...current, altText: event.target.value }))
                }
                value={uploadDraft.altText}
              />
            </label>
            <label>
              <span className="muted">Sort order</span>
              <input
                className="input"
                onChange={(event) =>
                  setUploadDraft((current) => ({
                    ...current,
                    sortOrder: Number(event.target.value || 0)
                  }))
                }
                type="number"
                value={uploadDraft.sortOrder}
              />
            </label>
          </div>
          <label className="inline-actions">
            <input
              checked={uploadDraft.isFeatured}
              onChange={(event) =>
                setUploadDraft((current) => ({
                  ...current,
                  isFeatured: event.target.checked
                }))
              }
              type="checkbox"
            />
            <span className="muted">Featured media</span>
          </label>
          <button
            className="button-secondary"
            disabled={isUploading}
            onClick={uploadFromDevice}
            type="button"
          >
            {isUploading ? 'Uploading...' : 'Upload media'}
          </button>
        </section>

        <section className="card content-panel stack">
          <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>Attach by URL</h3>
            <span className="badge">External link</span>
          </div>
          <div className="form-grid columns-2">
            <label>
              <span className="muted">Title</span>
              <input
                className="input"
                onChange={(event) =>
                  setUrlDraft((current) => ({ ...current, title: event.target.value }))
                }
                value={urlDraft.title}
              />
            </label>
            <label>
              <span className="muted">Media type</span>
              <select
                className="select"
                onChange={(event) =>
                  setUrlDraft((current) => ({
                    ...current,
                    mediaType: event.target.value as 'image' | 'video'
                  }))
                }
                value={urlDraft.mediaType}
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </label>
          </div>
          <label>
            <span className="muted">Media URL</span>
            <input
              className="input"
              onChange={(event) =>
                setUrlDraft((current) => ({ ...current, fileUrl: event.target.value }))
              }
              placeholder="https://..."
              value={urlDraft.fileUrl}
            />
          </label>
          <label>
            <span className="muted">Thumbnail URL</span>
            <input
              className="input"
              onChange={(event) =>
                setUrlDraft((current) => ({ ...current, thumbnailUrl: event.target.value }))
              }
              placeholder="Optional for videos"
              value={urlDraft.thumbnailUrl}
            />
          </label>
          <div className="form-grid columns-2">
            <label>
              <span className="muted">Alt text</span>
              <input
                className="input"
                onChange={(event) =>
                  setUrlDraft((current) => ({ ...current, altText: event.target.value }))
                }
                value={urlDraft.altText}
              />
            </label>
            <label>
              <span className="muted">Sort order</span>
              <input
                className="input"
                onChange={(event) =>
                  setUrlDraft((current) => ({
                    ...current,
                    sortOrder: Number(event.target.value || 0)
                  }))
                }
                type="number"
                value={urlDraft.sortOrder}
              />
            </label>
          </div>
          <label className="inline-actions">
            <input
              checked={urlDraft.isFeatured}
              onChange={(event) =>
                setUrlDraft((current) => ({
                  ...current,
                  isFeatured: event.target.checked
                }))
              }
              type="checkbox"
            />
            <span className="muted">Featured media</span>
          </label>
          <button
            className="button-secondary"
            disabled={isSavingUrl}
            onClick={addByUrl}
            type="button"
          >
            {isSavingUrl ? 'Saving...' : 'Save media URL'}
          </button>
        </section>
      </div>

      <div className="admin-records media-records">
        {records.length ? (
          records.map((record) => (
            <article className="card content-panel stack media-record-card" key={record.id}>
              <div className="media-record-preview">
                {record.mediaType === 'image' ? (
                  <img
                    alt={record.altText || record.title}
                    className="media-thumb"
                    src={record.thumbnailUrl || record.fileUrl}
                  />
                ) : record.thumbnailUrl ? (
                  <img
                    alt={record.altText || record.title}
                    className="media-thumb"
                    src={record.thumbnailUrl}
                  />
                ) : (
                  <div className="media-video-placeholder">Video</div>
                )}
              </div>
              <div className="stack">
                <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
                  <strong>{record.title}</strong>
                  <span className="badge">{record.mediaType}</span>
                </div>
                <div className="form-grid columns-2">
                  <label>
                    <span className="muted">Title</span>
                    <input
                      className="input"
                      onChange={(event) =>
                        updateRecord(record.id, { title: event.target.value })
                      }
                      value={record.title}
                    />
                  </label>
                  <label>
                    <span className="muted">Type</span>
                    <select
                      className="select"
                      onChange={(event) =>
                        updateRecord(record.id, {
                          mediaType: event.target.value as 'image' | 'video'
                        })
                      }
                      value={record.mediaType}
                    >
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                    </select>
                  </label>
                  <label>
                    <span className="muted">Media URL</span>
                    <input
                      className="input"
                      onChange={(event) =>
                        updateRecord(record.id, { fileUrl: event.target.value })
                      }
                      value={record.fileUrl}
                    />
                  </label>
                  <label>
                    <span className="muted">Thumbnail URL</span>
                    <input
                      className="input"
                      onChange={(event) =>
                        updateRecord(record.id, { thumbnailUrl: event.target.value })
                      }
                      value={record.thumbnailUrl}
                    />
                  </label>
                  <label>
                    <span className="muted">Alt text</span>
                    <input
                      className="input"
                      onChange={(event) =>
                        updateRecord(record.id, { altText: event.target.value })
                      }
                      value={record.altText}
                    />
                  </label>
                  <label>
                    <span className="muted">Sort order</span>
                    <input
                      className="input"
                      onChange={(event) =>
                        updateRecord(record.id, {
                          sortOrder: Number(event.target.value || 0)
                        })
                      }
                      type="number"
                      value={record.sortOrder}
                    />
                  </label>
                </div>
                <label className="inline-actions">
                  <input
                    checked={record.isFeatured}
                    onChange={(event) =>
                      updateRecord(record.id, { isFeatured: event.target.checked })
                    }
                    type="checkbox"
                  />
                  <span className="muted">Featured media</span>
                </label>
                <div className="inline-actions">
                  <button
                    className="button-secondary"
                    disabled={savingId === record.id || deletingId === record.id}
                    onClick={() => saveRecord(record)}
                    type="button"
                  >
                    {savingId === record.id ? 'Saving...' : 'Save media'}
                  </button>
                  <button
                    className="button-ghost"
                    disabled={savingId === record.id || deletingId === record.id}
                    onClick={() => deleteRecord(record)}
                    type="button"
                  >
                    {deletingId === record.id ? 'Deleting...' : 'Delete media'}
                  </button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <article className="card content-panel">
            <p className="muted" style={{ margin: 0 }}>
              No media has been attached to this album yet.
            </p>
          </article>
        )}
      </div>
    </section>
  );
}
