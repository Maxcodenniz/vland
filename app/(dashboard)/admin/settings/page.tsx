import { SettingsEditor } from '@/components/admin/SettingsEditor';
import { getAdminSettingsRecord } from '@/lib/data/live-content';

export default async function AdminSettingsPage() {
  const settings = await getAdminSettingsRecord();

  return (
    <div className="stack">
      <h1 style={{ margin: 0 }}>Site settings</h1>
      <p className="section-description">
        Manage business identity, contact details, WhatsApp number, map link,
        SEO defaults and visibility settings from editable configuration tables.
      </p>
      <SettingsEditor initialValues={settings} />
    </div>
  );
}
