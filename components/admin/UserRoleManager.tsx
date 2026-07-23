'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AdminFeedbackToast } from '@/components/admin/AdminFeedbackToast';
import type { AdminUserProfileRecord } from '@/lib/data/live-content';
import type { AppRole } from '@/lib/supabase/auth';

const roleOptions: AppRole[] = ['super_admin', 'admin', 'moderator', 'visitor'];

export function UserRoleManager({
  initialRecords,
  canManageRoles
}: {
  initialRecords: AdminUserProfileRecord[];
  canManageRoles: boolean;
}) {
  const router = useRouter();
  const [records, setRecords] = useState(initialRecords);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateRecord(id: string, role: AppRole) {
    setRecords((current) =>
      current.map((record) => (record.id === id ? { ...record, role } : record))
    );
  }

  async function saveRole(record: AdminUserProfileRecord) {
    setSavingId(record.id);
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/admin/users/${record.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: record.role })
    });

    const result = (await response.json()) as { ok: boolean; message?: string };
    setSavingId(null);

    if (!response.ok) {
      setError(result.message ?? 'Unable to update this role.');
      return;
    }

    setMessage(result.message ?? 'Role updated.');
    router.refresh();
  }

  return (
    <section className="stack">
      <AdminFeedbackToast error={error} message={message} />
      {!canManageRoles ? (
        <section className="card content-panel stack">
          <h2 style={{ margin: 0 }}>Role management restricted</h2>
          <p className="section-description" style={{ marginBottom: 0 }}>
            Only `super_admin` accounts can change staff roles. Admins can review the
            role model here but cannot modify access.
          </p>
        </section>
      ) : null}

      <section className="admin-records">
        {records.map((record) => (
          <article className="card content-panel stack" key={record.id}>
            <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0 }}>{record.fullName}</h2>
              <span className="badge">{record.id.slice(0, 8)}</span>
            </div>
            <div className="form-grid columns-2">
              <label>
                <span className="muted">Phone</span>
                <input className="input" disabled value={record.phone} />
              </label>
              <label>
                <span className="muted">Role</span>
                <select
                  className="select"
                  disabled={!canManageRoles}
                  onChange={(event) => updateRecord(record.id, event.target.value as AppRole)}
                  value={record.role}
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {canManageRoles ? (
              <div className="inline-actions">
                <button
                  className="button-secondary"
                  disabled={savingId === record.id}
                  onClick={() => saveRole(record)}
                  type="button"
                >
                  {savingId === record.id ? 'Saving...' : 'Save role'}
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </section>
    </section>
  );
}
