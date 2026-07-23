import { ContentBlockManager } from '@/components/admin/ContentBlockManager';
import { getAdminContentBlockRecords } from '@/lib/data/live-content';

export default async function AdminContentPage() {
  const records = (await getAdminContentBlockRecords()).filter(
    (record) => !record.sectionKey.startsWith('community-ad-')
  );

  return (
    <div className="stack">
      <h1 style={{ margin: 0 }}>Content block management</h1>
      <p className="section-description">
        Manage homepage sections, service-page hero content, spotlight blocks, and visibility
        settings from configurable content records.
      </p>
      <p className="muted" style={{ margin: 0 }}>
        Community sidebar adverts now live in the dedicated `Adverts` workspace.
      </p>
      <ContentBlockManager initialRecords={records} />
    </div>
  );
}
