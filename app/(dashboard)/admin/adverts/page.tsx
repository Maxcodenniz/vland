import { AdvertManager } from '@/components/admin/AdvertManager';
import { getAdminContentBlockRecords } from '@/lib/data/live-content';

export default async function AdminAdvertsPage() {
  const records = (await getAdminContentBlockRecords()).filter((record) =>
    record.sectionKey.startsWith('community-ad-')
  );

  return (
    <div className="stack">
      <h1 style={{ margin: 0 }}>Adverts workspace</h1>
      <p className="section-description">
        Manage the Community sidebar adverts from one focused editor with only the advert fields
        that appear publicly.
      </p>
      <p className="muted" style={{ margin: 0 }}>
        Use section keys like `community-ad-1` or `community-ad-adspa`, then control the sidebar
        order with the sort order field.
      </p>
      <AdvertManager initialRecords={records} />
    </div>
  );
}
