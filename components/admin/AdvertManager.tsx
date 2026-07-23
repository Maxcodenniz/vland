'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { AdminFeedbackToast } from '@/components/admin/AdminFeedbackToast';
import { ModuleMediaFields } from '@/components/admin/ModuleMediaFields';
import type { AdminContentBlockRecord } from '@/lib/data/live-content';
import { inferMediaTypeFromPath } from '@/lib/media';

type Draft = Omit<AdminContentBlockRecord, 'id'>;

const ADVERT_PREFIX = 'community-ad-';

const emptyDraft: Draft = {
  sectionKey: ADVERT_PREFIX,
  title: '',
  subtitle: '',
  body: '',
  ctaLabel: '',
  ctaHref: '',
  eyebrow: '',
  secondaryCtaLabel: '',
  secondaryCtaHref: '',
  heroHighlightsText: '',
  visualBadge: '',
  visualTitle: '',
  visualDescription: '',
  topChipLabel: '',
  middleChipLabel: '',
  bottomChipLabel: '',
  mediaPath: '',
  mediaType: 'text',
  isVisible: true,
  sortOrder: 0
};

function normalizeAdvertSectionKey(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return ADVERT_PREFIX;
  }

  if (trimmed.startsWith(ADVERT_PREFIX)) {
    return trimmed;
  }

  return `${ADVERT_PREFIX}${trimmed.replace(/^community-ad-?/, '')}`;
}

function isValidAdvertSectionKey(value: string) {
  return value.trim().startsWith(ADVERT_PREFIX) && value.trim().length > ADVERT_PREFIX.length;
}

export function AdvertManager({
  initialRecords
}: {
  initialRecords: AdminContentBlockRecord[];
}) {
  const router = useRouter();
  const [records, setRecords] = useState(initialRecords);
  const recordsRef = useRef(initialRecords);
  const [newRecord, setNewRecord] = useState<Draft>(emptyDraft);
  const newRecordRef = useRef<Draft>(emptyDraft);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploadingCreateMedia, setIsUploadingCreateMedia] = useState(false);
  const [uploadingRecordId, setUploadingRecordId] = useState<string | null>(null);
  const [newMediaFile, setNewMediaFile] = useState<File | null>(null);
  const [recordFiles, setRecordFiles] = useState<Record<string, File | null>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function updateRecord(id: string, patch: Partial<AdminContentBlockRecord>) {
    setRecords((current) => {
      const nextRecords = current.map((record) =>
        record.id === id ? { ...record, ...patch } : record
      );

      recordsRef.current = nextRecords;
      return nextRecords;
    });
  }

  function patchNewRecord(patch: Partial<Draft>) {
    const nextDraft = {
      ...newRecordRef.current,
      ...patch
    };

    newRecordRef.current = nextDraft;
    setNewRecord(nextDraft);
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
      patchNewRecord({
        mediaPath: result.publicUrl ?? '',
        mediaType: result.mediaType ?? 'image'
      });
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
        throw new Error('This advert could not be found. Refresh and try again.');
      }

      const nextRecord = {
        ...currentRecord,
        mediaPath: result.publicUrl ?? '',
        mediaType: result.mediaType ?? 'image'
      } satisfies AdminContentBlockRecord;

      updateRecord(recordId, {
        mediaPath: nextRecord.mediaPath,
        mediaType: nextRecord.mediaType
      });
      setRecordFiles((current) => ({ ...current, [recordId]: null }));
      await persistRecord(nextRecord, 'Media uploaded and saved.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload media.');
    } finally {
      setUploadingRecordId(null);
    }
  }

  function validateAdvertRecord(record: Pick<AdminContentBlockRecord, 'sectionKey' | 'title'>) {
    if (!isValidAdvertSectionKey(record.sectionKey)) {
      return 'Section key must start with `community-ad-` and include a unique advert name.';
    }

    if (!record.title.trim()) {
      return 'Title is required for each advert.';
    }

    return null;
  }

  async function persistRecord(
    record: AdminContentBlockRecord,
    successMessage = 'Advert saved.'
  ) {
    const validationMessage = validateAdvertRecord(record);

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setSavingId(record.id);
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/admin/content/${record.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...record,
        sectionKey: normalizeAdvertSectionKey(record.sectionKey)
      })
    });

    const result = (await response.json()) as { ok: boolean; message?: string };
    setSavingId(null);

    if (!response.ok) {
      setError(result.message ?? 'Unable to save this advert.');
      return;
    }

    setMessage(result.message ?? successMessage);
    router.refresh();
  }

  async function saveRecord(recordId: string) {
    const record = recordsRef.current.find((item) => item.id === recordId);

    if (!record) {
      setError('This advert could not be found. Refresh and try again.');
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
    setIsCreating(true);
    setMessage(null);
    setError(null);

    let draft = {
      ...newRecordRef.current,
      sectionKey: normalizeAdvertSectionKey(newRecordRef.current.sectionKey)
    };

    const validationMessage = validateAdvertRecord(draft);

    if (validationMessage) {
      setIsCreating(false);
      setError(validationMessage);
      return;
    }

    if (newMediaFile) {
      try {
        const result = await uploadMedia(newMediaFile);

        draft = {
          ...draft,
          mediaPath: result.publicUrl ?? '',
          mediaType: result.mediaType ?? 'image'
        };

        newRecordRef.current = draft;
        setNewRecord(draft);
        setNewMediaFile(null);
      } catch (uploadError) {
        setIsCreating(false);
        setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload media.');
        return;
      }
    }

    const response = await fetch('/api/admin/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft)
    });

    const result = (await response.json()) as { ok: boolean; message?: string };
    setIsCreating(false);

    if (!response.ok) {
      setError(result.message ?? 'Unable to add this advert.');
      return;
    }

    newRecordRef.current = emptyDraft;
    setNewRecord(emptyDraft);
    setMessage(result.message ?? 'Advert created.');
    router.refresh();
  }

  async function deleteRecord(record: AdminContentBlockRecord) {
    if (!window.confirm(`Delete the advert "${record.title}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(record.id);
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/admin/content/${record.id}`, {
      method: 'DELETE'
    });
    const result = (await response.json()) as { ok: boolean; message?: string };
    setDeletingId(null);

    if (!response.ok) {
      setError(result.message ?? 'Unable to delete this advert.');
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
    setMessage(result.message ?? 'Advert deleted.');
    router.refresh();
  }

  return (
    <section className="stack">
      <AdminFeedbackToast error={error} message={message} />
      <section className="card content-panel stack">
        <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Add advert</h2>
          <span className="badge">{records.length} adverts</span>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          This workspace manages only Community sidebar adverts. Section keys must start with
          `community-ad-`.
        </p>
        <div className="form-grid columns-2">
          <label>
            <span className="muted">Section key</span>
            <input
              className="input"
              onChange={(e) => patchNewRecord({ sectionKey: e.target.value })}
              placeholder="community-ad-summer-offer"
              value={newRecord.sectionKey}
            />
          </label>
          <label>
            <span className="muted">Title</span>
            <input
              className="input"
              onChange={(e) => patchNewRecord({ title: e.target.value })}
              value={newRecord.title}
            />
          </label>
          <label>
            <span className="muted">Eyebrow</span>
            <input
              className="input"
              onChange={(e) => patchNewRecord({ eyebrow: e.target.value })}
              value={newRecord.eyebrow}
            />
          </label>
          <label>
            <span className="muted">Subtitle</span>
            <input
              className="input"
              onChange={(e) => patchNewRecord({ subtitle: e.target.value })}
              value={newRecord.subtitle}
            />
          </label>
          <label>
            <span className="muted">Sort order</span>
            <input
              className="input"
              onChange={(e) => patchNewRecord({ sortOrder: Number(e.target.value || 0) })}
              type="number"
              value={newRecord.sortOrder}
            />
          </label>
          <label>
            <span className="muted">CTA label</span>
            <input
              className="input"
              onChange={(e) => patchNewRecord({ ctaLabel: e.target.value })}
              value={newRecord.ctaLabel}
            />
          </label>
          <label>
            <span className="muted">CTA href</span>
            <input
              className="input"
              onChange={(e) => patchNewRecord({ ctaHref: e.target.value })}
              placeholder="/contact or https://..."
              value={newRecord.ctaHref}
            />
          </label>
        </div>
        <label>
          <span className="muted">Body</span>
          <textarea
            className="textarea"
            onChange={(e) => patchNewRecord({ body: e.target.value })}
            value={newRecord.body}
          />
        </label>
        <ModuleMediaFields
          isUploading={isUploadingCreateMedia}
          mediaPath={newRecord.mediaPath}
          mediaType={newRecord.mediaType}
          onMediaPathChange={(value) =>
            patchNewRecord({
              mediaPath: value,
              mediaType: inferMediaTypeFromPath(value)
            })
          }
          onSelectedFileChange={setNewMediaFile}
          onUpload={uploadCreateMedia}
          previewLabel={newRecord.title || 'Advert media'}
          selectedFile={newMediaFile}
        />
        <label className="inline-actions">
          <input
            checked={newRecord.isVisible}
            onChange={(e) => patchNewRecord({ isVisible: e.target.checked })}
            type="checkbox"
          />
          <span className="muted">Visible on public site</span>
        </label>
        <div className="inline-actions">
          <button
            className="button-secondary"
            disabled={isCreating}
            onClick={createRecord}
            type="button"
          >
            {isCreating ? 'Adding...' : 'Add advert'}
          </button>
        </div>
      </section>

      <section className="admin-records">
        {records.map((record) => (
          <article className="card content-panel stack" key={record.id}>
            <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0 }}>{record.title}</h2>
              <span className="badge">{record.sectionKey}</span>
            </div>
            <div className="form-grid columns-2">
              <label>
                <span className="muted">Section key</span>
                <input
                  className="input"
                  onChange={(e) => updateRecord(record.id, { sectionKey: e.target.value })}
                  value={record.sectionKey}
                />
              </label>
              <label>
                <span className="muted">Title</span>
                <input
                  className="input"
                  onChange={(e) => updateRecord(record.id, { title: e.target.value })}
                  value={record.title}
                />
              </label>
              <label>
                <span className="muted">Eyebrow</span>
                <input
                  className="input"
                  onChange={(e) => updateRecord(record.id, { eyebrow: e.target.value })}
                  value={record.eyebrow}
                />
              </label>
              <label>
                <span className="muted">Subtitle</span>
                <input
                  className="input"
                  onChange={(e) => updateRecord(record.id, { subtitle: e.target.value })}
                  value={record.subtitle}
                />
              </label>
              <label>
                <span className="muted">Sort order</span>
                <input
                  className="input"
                  onChange={(e) => updateRecord(record.id, { sortOrder: Number(e.target.value || 0) })}
                  type="number"
                  value={record.sortOrder}
                />
              </label>
              <label>
                <span className="muted">CTA label</span>
                <input
                  className="input"
                  onChange={(e) => updateRecord(record.id, { ctaLabel: e.target.value })}
                  value={record.ctaLabel}
                />
              </label>
              <label>
                <span className="muted">CTA href</span>
                <input
                  className="input"
                  onChange={(e) => updateRecord(record.id, { ctaHref: e.target.value })}
                  value={record.ctaHref}
                />
              </label>
            </div>
            <label>
              <span className="muted">Body</span>
              <textarea
                className="textarea"
                onChange={(e) => updateRecord(record.id, { body: e.target.value })}
                value={record.body}
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
            <label className="inline-actions">
              <input
                checked={record.isVisible}
                onChange={(e) => updateRecord(record.id, { isVisible: e.target.checked })}
                type="checkbox"
              />
              <span className="muted">Visible on public site</span>
            </label>
            <div className="inline-actions">
              <button
                className="button-secondary"
                disabled={savingId === record.id || deletingId === record.id}
                onClick={() => saveRecord(record.id)}
                type="button"
              >
                {savingId === record.id ? 'Saving...' : 'Save advert'}
              </button>
              <button
                className="button-ghost"
                disabled={savingId === record.id || deletingId === record.id}
                onClick={() => deleteRecord(record)}
                type="button"
              >
                {deletingId === record.id ? 'Deleting...' : 'Delete advert'}
              </button>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
