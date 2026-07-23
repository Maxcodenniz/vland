'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { AdminFeedbackToast } from '@/components/admin/AdminFeedbackToast';
import { ModuleMediaFields } from '@/components/admin/ModuleMediaFields';
import type { AdminCourseRecord } from '@/lib/data/live-content';
import { inferMediaTypeFromPath } from '@/lib/media';
import { adminCourseSchema } from '@/lib/schemas/admin';

type CourseDraft = Omit<AdminCourseRecord, 'id'>;
type CoursePayload = {
  title: string;
  slug: string;
  category: string;
  durationLabel: string;
  feeLabel: string;
  scheduleLabel: string;
  trainerName: string;
  description: string;
  mediaPath: string;
  mediaType: 'image' | 'video' | 'text';
  isActive: boolean;
  sortOrder: number;
};
type CourseApiResult = {
  ok: boolean;
  message?: string;
  errors?: {
    formErrors?: string[];
    fieldErrors?: Partial<Record<keyof CoursePayload, string[] | undefined>>;
  };
};

const emptyCourse: CourseDraft = {
  title: '',
  slug: '',
  category: '',
  durationLabel: '',
  feeLabel: '',
  scheduleLabel: '',
  trainerName: '',
  description: '',
  mediaPath: '',
  mediaType: 'text',
  isActive: true,
  sortOrder: 0
};

const courseFieldLabels: Record<keyof CoursePayload, string> = {
  title: 'Title',
  slug: 'Slug',
  category: 'Category',
  durationLabel: 'Duration',
  feeLabel: 'Fee',
  scheduleLabel: 'Schedule',
  trainerName: 'Trainer',
  description: 'Description',
  mediaPath: 'Media URL',
  mediaType: 'Media type',
  isActive: 'Active',
  sortOrder: 'Sort order'
};

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeCoursePayload(record: CourseDraft | AdminCourseRecord): CoursePayload {
  const title = record.title.trim();
  const mediaPath = record.mediaPath.trim();
  const normalizedSlug = toSlug(record.slug || title);

  return {
    title,
    slug: normalizedSlug,
    category: record.category.trim(),
    durationLabel: record.durationLabel.trim(),
    feeLabel: record.feeLabel.trim(),
    scheduleLabel: record.scheduleLabel.trim(),
    trainerName: record.trainerName.trim(),
    description: record.description.trim(),
    mediaPath,
    mediaType: mediaPath ? record.mediaType : 'text',
    isActive: record.isActive,
    sortOrder: Number(record.sortOrder)
  };
}

function formatCourseErrors(result: CourseApiResult) {
  const formErrors = result.errors?.formErrors ?? [];
  const fieldEntries = Object.entries(result.errors?.fieldErrors ?? {}) as Array<
    [keyof CoursePayload, string[] | undefined]
  >;
  const fieldErrors = fieldEntries.flatMap(([field, messages]) =>
    (messages ?? []).map((message) => `${courseFieldLabels[field]}: ${message}`)
  );
  const allErrors = [...formErrors, ...fieldErrors];

  if (!allErrors.length) {
    return result.message ?? 'Invalid course data.';
  }

  return allErrors.join(' ');
}

export function CourseCatalogManager({
  initialRecords
}: {
  initialRecords: AdminCourseRecord[];
}) {
  const router = useRouter();
  const [records, setRecords] = useState(initialRecords);
  const recordsRef = useRef(initialRecords);
  const [newRecord, setNewRecord] = useState<CourseDraft>(emptyCourse);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploadingCreateMedia, setIsUploadingCreateMedia] = useState(false);
  const [uploadingRecordId, setUploadingRecordId] = useState<string | null>(null);
  const [newMediaFile, setNewMediaFile] = useState<File | null>(null);
  const [recordFiles, setRecordFiles] = useState<Record<string, File | null>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function updateRecord(id: string, patch: Partial<AdminCourseRecord>) {
    setRecords((current) => {
      const nextRecords = current.map((record) =>
        record.id === id ? { ...record, ...patch } : record
      );

      recordsRef.current = nextRecords;
      return nextRecords;
    });
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

    if (!file) {
      setError('Choose a media file before uploading.');
      return;
    }

    setUploadingRecordId(recordId);
    setError(null);
    setMessage(null);

    try {
      const result = await uploadMedia(file);
      const currentRecord = recordsRef.current.find((record) => record.id === recordId);

      if (!currentRecord) {
        throw new Error('This course could not be found. Refresh and try again.');
      }

      const nextRecord = {
        ...currentRecord,
        mediaPath: result.publicUrl ?? '',
        mediaType: result.mediaType ?? 'image'
      } satisfies AdminCourseRecord;

      updateRecord(recordId, {
        mediaPath: nextRecord.mediaPath,
        mediaType: nextRecord.mediaType
      });
      setRecordFiles((current) => ({ ...current, [recordId]: null }));
      await persistRecord(nextRecord, 'Course media uploaded and saved.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload media.');
    } finally {
      setUploadingRecordId(null);
    }
  }

  async function persistRecord(record: AdminCourseRecord, successMessage = 'Course saved.') {
    const payload = normalizeCoursePayload(record);
    const parsed = adminCourseSchema.safeParse(payload);

    if (!parsed.success) {
      setError(
        formatCourseErrors({
          ok: false,
          message: 'Invalid course data.',
          errors: parsed.error.flatten()
        })
      );
      return;
    }

    setSavingId(record.id);
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/admin/courses/${record.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data)
    });

    const result = (await response.json()) as CourseApiResult;
    setSavingId(null);

    if (!response.ok) {
      setError(formatCourseErrors(result));
      return;
    }

    setMessage(result.message ?? successMessage);
    router.refresh();
  }

  async function saveRecord(recordId: string) {
    const record = recordsRef.current.find((item) => item.id === recordId);

    if (!record) {
      setError('This course could not be found. Refresh and try again.');
      return;
    }

    const pendingFile = recordFiles[recordId];

    if (pendingFile) {
      await uploadRecordMedia(recordId);
      return;
    }

    await persistRecord(record);
  }

  async function createRecord() {
    const payload = normalizeCoursePayload(newRecord);
    const parsed = adminCourseSchema.safeParse(payload);

    if (!parsed.success) {
      setError(
        formatCourseErrors({
          ok: false,
          message: 'Invalid course data.',
          errors: parsed.error.flatten()
        })
      );
      return;
    }

    setIsCreating(true);
    setMessage(null);
    setError(null);

    let nextPayload = parsed.data;

    if (newMediaFile) {
      try {
        const result = await uploadMedia(newMediaFile);
        nextPayload = {
          ...nextPayload,
          mediaPath: result.publicUrl ?? '',
          mediaType: result.mediaType ?? 'image'
        };
        setNewMediaFile(null);
      } catch (uploadError) {
        setIsCreating(false);
        setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload media.');
        return;
      }
    }

    const response = await fetch('/api/admin/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nextPayload)
    });

    const result = (await response.json()) as CourseApiResult;
    setIsCreating(false);

    if (!response.ok) {
      setError(formatCourseErrors(result));
      return;
    }

    setNewRecord(emptyCourse);
    setMessage(result.message ?? 'Course created.');
    router.refresh();
  }

  async function deleteRecord(record: AdminCourseRecord) {
    if (!window.confirm(`Delete the course "${record.title}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(record.id);
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/admin/courses/${record.id}`, {
      method: 'DELETE'
    });
    const result = (await response.json()) as { ok: boolean; message?: string };
    setDeletingId(null);

    if (!response.ok) {
      setError(result.message ?? 'Unable to delete this course.');
      return;
    }

    setRecords((current) => {
      const nextRecords = current.filter((item) => item.id !== record.id);
      recordsRef.current = nextRecords;
      return nextRecords;
    });
    setRecordFiles((current) => {
      const next = { ...current };
      delete next[record.id];
      return next;
    });
    setMessage(result.message ?? 'Course deleted.');
    router.refresh();
  }

  return (
    <section className="stack">
      <AdminFeedbackToast error={error} message={message} />
      <section className="card content-panel stack">
        <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Add course</h2>
          <span className="badge">{records.length} courses</span>
        </div>
        <div className="form-grid columns-2">
          <label>
            <span className="muted">Title</span>
            <input className="input" onChange={(e) => setNewRecord((c) => ({ ...c, title: e.target.value, slug: c.slug === '' || c.slug === toSlug(c.title) ? toSlug(e.target.value) : c.slug }))} value={newRecord.title} />
          </label>
          <label>
            <span className="muted">Slug</span>
            <input className="input" onChange={(e) => setNewRecord((c) => ({ ...c, slug: toSlug(e.target.value) }))} value={newRecord.slug} />
          </label>
          <label>
            <span className="muted">Category</span>
            <input className="input" onChange={(e) => setNewRecord((c) => ({ ...c, category: e.target.value }))} value={newRecord.category} />
          </label>
          <label>
            <span className="muted">Duration</span>
            <input className="input" onChange={(e) => setNewRecord((c) => ({ ...c, durationLabel: e.target.value }))} value={newRecord.durationLabel} />
          </label>
          <label>
            <span className="muted">Fee</span>
            <input className="input" onChange={(e) => setNewRecord((c) => ({ ...c, feeLabel: e.target.value }))} value={newRecord.feeLabel} />
          </label>
          <label>
            <span className="muted">Schedule</span>
            <input className="input" onChange={(e) => setNewRecord((c) => ({ ...c, scheduleLabel: e.target.value }))} value={newRecord.scheduleLabel} />
          </label>
          <label>
            <span className="muted">Trainer</span>
            <input className="input" onChange={(e) => setNewRecord((c) => ({ ...c, trainerName: e.target.value }))} value={newRecord.trainerName} />
          </label>
          <label>
            <span className="muted">Sort order</span>
            <input className="input" onChange={(e) => setNewRecord((c) => ({ ...c, sortOrder: Number(e.target.value || 0) }))} type="number" value={newRecord.sortOrder} />
          </label>
        </div>
        <label>
          <span className="muted">Description</span>
          <textarea className="textarea" onChange={(e) => setNewRecord((c) => ({ ...c, description: e.target.value }))} value={newRecord.description} />
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
          previewLabel={newRecord.title || 'Course media'}
          selectedFile={newMediaFile}
        />
        <label className="inline-actions">
          <input checked={newRecord.isActive} onChange={(e) => setNewRecord((c) => ({ ...c, isActive: e.target.checked }))} type="checkbox" />
          <span className="muted">Active</span>
        </label>
        <div className="inline-actions">
          <button className="button-secondary" disabled={isCreating} onClick={createRecord} type="button">
            {isCreating ? 'Adding...' : 'Add course'}
          </button>
        </div>
      </section>

      <section className="admin-records">
        {records.map((record) => (
          <article className="card content-panel stack" key={record.id}>
            <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0 }}>{record.title}</h2>
              <span className="badge">{record.category}</span>
            </div>
            <div className="form-grid columns-2">
              <label><span className="muted">Title</span><input className="input" onChange={(e) => updateRecord(record.id, { title: e.target.value })} value={record.title} /></label>
              <label><span className="muted">Slug</span><input className="input" onChange={(e) => updateRecord(record.id, { slug: toSlug(e.target.value) })} value={record.slug} /></label>
              <label><span className="muted">Category</span><input className="input" onChange={(e) => updateRecord(record.id, { category: e.target.value })} value={record.category} /></label>
              <label><span className="muted">Duration</span><input className="input" onChange={(e) => updateRecord(record.id, { durationLabel: e.target.value })} value={record.durationLabel} /></label>
              <label><span className="muted">Fee</span><input className="input" onChange={(e) => updateRecord(record.id, { feeLabel: e.target.value })} value={record.feeLabel} /></label>
              <label><span className="muted">Schedule</span><input className="input" onChange={(e) => updateRecord(record.id, { scheduleLabel: e.target.value })} value={record.scheduleLabel} /></label>
              <label><span className="muted">Trainer</span><input className="input" onChange={(e) => updateRecord(record.id, { trainerName: e.target.value })} value={record.trainerName} /></label>
              <label><span className="muted">Sort order</span><input className="input" onChange={(e) => updateRecord(record.id, { sortOrder: Number(e.target.value || 0) })} type="number" value={record.sortOrder} /></label>
            </div>
            <label>
              <span className="muted">Description</span>
              <textarea className="textarea" onChange={(e) => updateRecord(record.id, { description: e.target.value })} value={record.description} />
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
            <label className="inline-actions">
              <input checked={record.isActive} onChange={(e) => updateRecord(record.id, { isActive: e.target.checked })} type="checkbox" />
              <span className="muted">Active</span>
            </label>
            <div className="inline-actions">
              <button className="button-secondary" disabled={savingId === record.id || deletingId === record.id} onClick={() => saveRecord(record.id)} type="button">
                {savingId === record.id ? 'Saving...' : 'Save course'}
              </button>
              <button className="button-ghost" disabled={savingId === record.id || deletingId === record.id} onClick={() => deleteRecord(record)} type="button">
                {deletingId === record.id ? 'Deleting...' : 'Delete course'}
              </button>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
