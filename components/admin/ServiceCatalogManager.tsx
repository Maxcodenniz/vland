'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AdminFeedbackToast } from '@/components/admin/AdminFeedbackToast';
import { ModuleMediaFields } from '@/components/admin/ModuleMediaFields';
import type { AdminServiceRecord } from '@/lib/data/live-content';
import { inferMediaTypeFromPath } from '@/lib/media';
import { adminServiceSchema } from '@/lib/schemas/admin';

type ServiceDraft = {
  title: string;
  slug: string;
  summary: string;
  description: string;
  mediaPath: string;
  mediaType: 'image' | 'video' | 'text';
  priceLabel: string;
  ctaLabel: string;
  categoryId: string | null;
  quoteOnly: boolean;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
};

type ServicePayload = {
  title: string;
  slug: string;
  summary: string;
  description: string;
  mediaPath: string;
  mediaType: 'image' | 'video' | 'text';
  priceLabel: string;
  ctaLabel: string;
  categoryId: string | null;
  quoteOnly: boolean;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
};

type ServiceApiResult = {
  ok: boolean;
  message?: string;
  errors?: {
    formErrors?: string[];
    fieldErrors?: Partial<Record<keyof ServicePayload, string[] | undefined>>;
  };
};

const emptyService: ServiceDraft = {
  title: '',
  slug: '',
  summary: '',
  description: '',
  mediaPath: '',
  mediaType: 'text',
  priceLabel: '',
  ctaLabel: 'Book now',
  categoryId: null,
  quoteOnly: false,
  isActive: true,
  isFeatured: false,
  sortOrder: 0
};

const serviceFieldLabels: Record<keyof ServicePayload, string> = {
  title: 'Title',
  slug: 'Slug',
  summary: 'Summary',
  description: 'Description',
  mediaPath: 'Media URL',
  mediaType: 'Media type',
  priceLabel: 'Price label',
  ctaLabel: 'CTA label',
  categoryId: 'Category',
  quoteOnly: 'Quote only',
  isActive: 'Active',
  isFeatured: 'Featured',
  sortOrder: 'Sort order'
};

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeServicePayload(record: ServiceDraft | AdminServiceRecord): ServicePayload {
  const mediaPath = record.mediaPath.trim();

  return {
    title: record.title.trim(),
    slug: record.slug.trim(),
    summary: record.summary.trim(),
    description: record.description.trim(),
    mediaPath,
    mediaType: mediaPath ? record.mediaType : 'text',
    priceLabel: record.priceLabel.trim(),
    ctaLabel: record.ctaLabel.trim(),
    categoryId: record.categoryId?.trim() ? record.categoryId.trim() : null,
    quoteOnly: record.quoteOnly,
    isActive: record.isActive,
    isFeatured: record.isFeatured,
    sortOrder: Number(record.sortOrder)
  };
}

function formatServiceErrors(result: ServiceApiResult) {
  const formErrors = result.errors?.formErrors ?? [];
  const fieldEntries = Object.entries(result.errors?.fieldErrors ?? {}) as Array<
    [keyof ServicePayload, string[] | undefined]
  >;
  const fieldErrors = fieldEntries.flatMap(([field, messages]) =>
    (messages ?? []).map((message) => `${serviceFieldLabels[field]}: ${message}`)
  );
  const allErrors = [...formErrors, ...fieldErrors];

  if (!allErrors.length) {
    return result.message ?? 'Invalid service data.';
  }

  return allErrors.join(' ');
}

export function ServiceCatalogManager({
  initialRecords,
  categories
}: {
  initialRecords: AdminServiceRecord[];
  categories: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [records, setRecords] = useState(initialRecords);
  const [newRecord, setNewRecord] = useState<ServiceDraft>(emptyService);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploadingCreateMedia, setIsUploadingCreateMedia] = useState(false);
  const [uploadingRecordId, setUploadingRecordId] = useState<string | null>(null);
  const [newMediaFile, setNewMediaFile] = useState<File | null>(null);
  const [recordFiles, setRecordFiles] = useState<Record<string, File | null>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function updateRecord(id: string, patch: Partial<AdminServiceRecord>) {
    setRecords((current) =>
      current.map((record) => (record.id === id ? { ...record, ...patch } : record))
    );
  }

  async function uploadMedia(file: File) {
    const formData = new FormData();
    formData.set('file', file);

    const response = await fetch('/api/admin/content-media/upload', {
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
      throw new Error(result.message ?? 'Unable to upload this media.');
    }

    return result;
  }

  async function uploadCreateMedia() {
    if (!newMediaFile) {
      setError('Choose a media file before uploading.');
      return;
    }

    setIsUploadingCreateMedia(true);
    setError(null);
    setMessage(null);

    try {
      const result = await uploadMedia(newMediaFile);
      setNewRecord((current) => ({
        ...current,
        mediaPath: result.publicUrl ?? '',
        mediaType: result.mediaType ?? 'image'
      }));
      setNewMediaFile(null);
      setMessage(result.message ?? 'Media uploaded.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload media.');
    } finally {
      setIsUploadingCreateMedia(false);
    }
  }

  async function uploadRecordMedia(recordId: string) {
    const file = recordFiles[recordId];
    const currentRecord = records.find((record) => record.id === recordId);

    if (!file) {
      setError('Choose a media file before uploading.');
      return;
    }

    if (!currentRecord) {
      setError('Unable to find this service record right now.');
      return;
    }

    setUploadingRecordId(recordId);
    setError(null);
    setMessage(null);

    try {
      const result = await uploadMedia(file);
      const nextRecord = {
        ...currentRecord,
        mediaPath: result.publicUrl ?? '',
        mediaType: result.mediaType ?? 'image'
      } satisfies AdminServiceRecord;

      updateRecord(recordId, {
        mediaPath: nextRecord.mediaPath,
        mediaType: nextRecord.mediaType
      });
      setRecordFiles((current) => ({ ...current, [recordId]: null }));
      await saveRecord(nextRecord, 'Service media uploaded and saved.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload media.');
    } finally {
      setUploadingRecordId(null);
    }
  }

  async function saveRecord(record: AdminServiceRecord, successMessage = 'Service saved.') {
    const payload = normalizeServicePayload(record);
    const parsed = adminServiceSchema.safeParse(payload);

    if (!parsed.success) {
      setError(
        formatServiceErrors({
          ok: false,
          message: 'Invalid service data.',
          errors: parsed.error.flatten()
        })
      );
      return;
    }

    setSavingId(record.id);
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/admin/services/${record.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data)
    });

    const result = (await response.json()) as ServiceApiResult;
    setSavingId(null);

    if (!response.ok) {
      setError(formatServiceErrors(result));
      return;
    }

    setMessage(result.message ?? successMessage);
    router.refresh();
  }

  async function createRecord() {
    const payload = normalizeServicePayload(newRecord);
    const parsed = adminServiceSchema.safeParse(payload);

    if (!parsed.success) {
      setError(
        formatServiceErrors({
          ok: false,
          message: 'Invalid service data.',
          errors: parsed.error.flatten()
        })
      );
      return;
    }

    setIsCreating(true);
    setMessage(null);
    setError(null);

    const response = await fetch('/api/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data)
    });

    const result = (await response.json()) as ServiceApiResult;
    setIsCreating(false);

    if (!response.ok) {
      setError(formatServiceErrors(result));
      return;
    }

    setNewRecord(emptyService);
    setMessage(result.message ?? 'Service created.');
    router.refresh();
  }

  async function deleteRecord(record: AdminServiceRecord) {
    if (!window.confirm(`Delete the service "${record.title}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(record.id);
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/admin/services/${record.id}`, {
      method: 'DELETE'
    });
    const result = (await response.json()) as ServiceApiResult;

    setDeletingId(null);

    if (!response.ok) {
      setError(result.message ?? 'Unable to delete this service.');
      return;
    }

    setRecords((current) => current.filter((item) => item.id !== record.id));
    setRecordFiles((current) => {
      const next = { ...current };
      delete next[record.id];
      return next;
    });
    setMessage(result.message ?? 'Service deleted.');
    router.refresh();
  }

  return (
    <section className="stack">
      <AdminFeedbackToast error={error} message={message} />
      <section className="card content-panel stack">
        <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Add service</h2>
          <span className="badge">{records.length} services</span>
        </div>
        <div className="form-grid columns-2">
          <label>
            <span className="muted">Title</span>
            <input
              className="input"
              onChange={(event) =>
                setNewRecord((current) => {
                  const nextTitle = event.target.value;
                  const currentTitleSlug = toSlug(current.title);
                  const shouldSyncSlug = !current.slug.trim() || current.slug === currentTitleSlug;

                  return {
                    ...current,
                    title: nextTitle,
                    slug: shouldSyncSlug ? toSlug(nextTitle) : current.slug
                  };
                })
              }
              value={newRecord.title}
            />
          </label>
          <label>
            <span className="muted">Slug</span>
            <input
              className="input"
              onChange={(event) =>
                setNewRecord((current) => ({ ...current, slug: toSlug(event.target.value) }))
              }
              value={newRecord.slug}
            />
          </label>
          <label>
            <span className="muted">Price label</span>
            <input
              className="input"
              onChange={(event) =>
                setNewRecord((current) => ({ ...current, priceLabel: event.target.value }))
              }
              value={newRecord.priceLabel}
            />
          </label>
          <label>
            <span className="muted">CTA label</span>
            <input
              className="input"
              onChange={(event) =>
                setNewRecord((current) => ({ ...current, ctaLabel: event.target.value }))
              }
              value={newRecord.ctaLabel}
            />
          </label>
          <label>
            <span className="muted">Category</span>
            <select
              className="select"
              onChange={(event) =>
                setNewRecord((current) => ({
                  ...current,
                  categoryId: event.target.value || null
                }))
              }
              value={newRecord.categoryId ?? ''}
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="muted">Sort order</span>
            <input
              className="input"
              onChange={(event) =>
                setNewRecord((current) => ({
                  ...current,
                  sortOrder: Number(event.target.value || 0)
                }))
              }
              type="number"
              value={newRecord.sortOrder}
            />
          </label>
        </div>
        <label>
          <span className="muted">Summary</span>
          <textarea
            className="textarea"
            onChange={(event) => setNewRecord((current) => ({ ...current, summary: event.target.value }))}
            value={newRecord.summary}
          />
        </label>
        <label>
          <span className="muted">Description</span>
          <textarea
            className="textarea"
            onChange={(event) =>
              setNewRecord((current) => ({ ...current, description: event.target.value }))
            }
            value={newRecord.description}
          />
        </label>
        <ModuleMediaFields
          isUploading={isUploadingCreateMedia}
          mediaPath={newRecord.mediaPath}
          mediaType={newRecord.mediaType}
          onMediaPathChange={(value) =>
            setNewRecord((current) => ({
              ...current,
              mediaPath: value,
              mediaType: inferMediaTypeFromPath(value)
            }))
          }
          onSelectedFileChange={setNewMediaFile}
          onUpload={uploadCreateMedia}
          previewLabel={newRecord.title || 'Service media'}
          selectedFile={newMediaFile}
        />
        <div className="inline-actions">
          <label className="inline-actions">
            <input
              checked={newRecord.quoteOnly}
              onChange={(event) =>
                setNewRecord((current) => ({ ...current, quoteOnly: event.target.checked }))
              }
              type="checkbox"
            />
            <span className="muted">Quote only</span>
          </label>
          <label className="inline-actions">
            <input
              checked={newRecord.isActive}
              onChange={(event) =>
                setNewRecord((current) => ({ ...current, isActive: event.target.checked }))
              }
              type="checkbox"
            />
            <span className="muted">Active</span>
          </label>
          <label className="inline-actions">
            <input
              checked={newRecord.isFeatured}
              onChange={(event) =>
                setNewRecord((current) => ({ ...current, isFeatured: event.target.checked }))
              }
              type="checkbox"
            />
            <span className="muted">Featured</span>
          </label>
        </div>
        <div className="inline-actions">
          <button className="button-secondary" disabled={isCreating} onClick={createRecord} type="button">
            {isCreating ? 'Adding...' : 'Add service'}
          </button>
        </div>
      </section>

      <section className="admin-records">
        {records.map((record) => (
          <article className="card content-panel stack" key={record.id}>
            <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0 }}>{record.title}</h2>
              <span className="badge">{record.categoryName}</span>
            </div>
            <div className="form-grid columns-2">
              <label>
                <span className="muted">Title</span>
                <input
                  className="input"
                  onChange={(event) => {
                    const nextTitle = event.target.value;
                    const currentTitleSlug = toSlug(record.title);
                    const shouldSyncSlug = !record.slug.trim() || record.slug === currentTitleSlug;

                    updateRecord(record.id, {
                      title: nextTitle,
                      slug: shouldSyncSlug ? toSlug(nextTitle) : record.slug
                    });
                  }}
                  value={record.title}
                />
              </label>
              <label>
                <span className="muted">Slug</span>
                <input
                  className="input"
                  onChange={(event) => updateRecord(record.id, { slug: toSlug(event.target.value) })}
                  value={record.slug}
                />
              </label>
              <label>
                <span className="muted">Price label</span>
                <input
                  className="input"
                  onChange={(event) => updateRecord(record.id, { priceLabel: event.target.value })}
                  value={record.priceLabel}
                />
              </label>
              <label>
                <span className="muted">CTA label</span>
                <input
                  className="input"
                  onChange={(event) => updateRecord(record.id, { ctaLabel: event.target.value })}
                  value={record.ctaLabel}
                />
              </label>
              <label>
                <span className="muted">Category</span>
                <select
                  className="select"
                  onChange={(event) =>
                    updateRecord(record.id, {
                      categoryId: event.target.value || null,
                      categoryName:
                        categories.find((category) => category.id === event.target.value)?.name ??
                        'Uncategorized'
                    })
                  }
                  value={record.categoryId ?? ''}
                >
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="muted">Sort order</span>
                <input
                  className="input"
                  onChange={(event) =>
                    updateRecord(record.id, { sortOrder: Number(event.target.value || 0) })
                  }
                  type="number"
                  value={record.sortOrder}
                />
              </label>
            </div>
            <label>
              <span className="muted">Summary</span>
              <textarea
                className="textarea"
                onChange={(event) => updateRecord(record.id, { summary: event.target.value })}
                value={record.summary}
              />
            </label>
            <label>
              <span className="muted">Description</span>
              <textarea
                className="textarea"
                onChange={(event) => updateRecord(record.id, { description: event.target.value })}
                value={record.description}
              />
            </label>
            <ModuleMediaFields
              isUploading={uploadingRecordId === record.id}
              mediaPath={record.mediaPath}
              mediaType={record.mediaType}
              onMediaPathChange={(value) =>
                updateRecord(record.id, {
                  mediaPath: value,
                  mediaType: inferMediaTypeFromPath(value)
                })
              }
              onSelectedFileChange={(file) =>
                setRecordFiles((current) => ({ ...current, [record.id]: file }))
              }
              onUpload={() => uploadRecordMedia(record.id)}
              previewLabel={record.title}
              selectedFile={recordFiles[record.id] ?? null}
            />
            <div className="inline-actions">
              <label className="inline-actions">
                <input
                  checked={record.quoteOnly}
                  onChange={(event) => updateRecord(record.id, { quoteOnly: event.target.checked })}
                  type="checkbox"
                />
                <span className="muted">Quote only</span>
              </label>
              <label className="inline-actions">
                <input
                  checked={record.isActive}
                  onChange={(event) => updateRecord(record.id, { isActive: event.target.checked })}
                  type="checkbox"
                />
                <span className="muted">Active</span>
              </label>
              <label className="inline-actions">
                <input
                  checked={record.isFeatured}
                  onChange={(event) =>
                    updateRecord(record.id, { isFeatured: event.target.checked })
                  }
                  type="checkbox"
                />
                <span className="muted">Featured</span>
              </label>
            </div>
            <div className="inline-actions">
              <button
                className="button-secondary"
                disabled={savingId === record.id || deletingId === record.id}
                onClick={() => saveRecord(record)}
                type="button"
              >
                {savingId === record.id ? 'Saving...' : 'Save service'}
              </button>
              <button
                className="button-ghost"
                disabled={savingId === record.id || deletingId === record.id}
                onClick={() => deleteRecord(record)}
                type="button"
              >
                {deletingId === record.id ? 'Deleting...' : 'Delete service'}
              </button>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
