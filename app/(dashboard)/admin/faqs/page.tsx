import { FaqManager } from '@/components/admin/FaqManager';
import { getAdminFaqRecords } from '@/lib/data/live-content';

export default async function AdminFaqsPage() {
  const records = await getAdminFaqRecords();

  return (
    <div className="stack">
      <h1 style={{ margin: 0 }}>FAQs</h1>
      <p className="section-description">
        Keep frequently asked questions reusable across service pages and global
        landing pages.
      </p>
      <FaqManager initialRecords={records} />
    </div>
  );
}
