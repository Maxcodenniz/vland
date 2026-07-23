import { AdminTable } from '@/components/admin/AdminTable';
import { AdminWorkspaceCard } from '@/components/admin/AdminWorkspaceCard';
import { ModerationQueue } from '@/components/admin/ModerationQueue';
import { StatCard } from '@/components/shared/StatCard';
import {
  getAdminBookings,
  getAdminModuleRows,
  getAdminOverviewStats,
  getModerationQueueItems
} from '@/lib/data/live-content';

export default async function AdminOverviewPage() {
  const [stats, bookingRows, moderationItems, moduleRows] = await Promise.all([
    getAdminOverviewStats(),
    getAdminBookings(),
    getModerationQueueItems(),
    getAdminModuleRows()
  ]);

  return (
    <div className="stack">
      <div className="stack">
        <span className="section-label">Overview</span>
        <h1 style={{ margin: 0 }}>Admin and moderator workspace</h1>
        <p className="section-description">
          Manage bookings, content, media, community posts, settings and
          moderation from one private control center.
        </p>
      </div>

      <div className="grid columns-4">
        <StatCard label="Homepage sections" value={String(stats.homepageSections)} />
        <StatCard label="Services" value={String(stats.services)} />
        <StatCard label="Community posts" value={String(stats.communityPosts)} />
        <StatCard label="Testimonials" value={String(stats.testimonials)} />
      </div>

      <div className="grid columns-3">
        <AdminWorkspaceCard
          description="Review flagged comments, approve media, and keep the public wall safe and welcoming."
          href="/admin/moderation"
          label="Moderator"
          title="Moderation Center"
        />
        <AdminWorkspaceCard
          description="Update homepage storytelling, banners, services and featured content without exposing internal tools publicly."
          href="/admin/content"
          label="Admin"
          title="Content Control"
        />
        <AdminWorkspaceCard
          description="Track appointment requests, assign follow-ups and keep service delivery organized."
          href="/admin/bookings"
          label="Operations"
          title="Booking Desk"
        />
      </div>

      <ModerationQueue items={moderationItems} title="Priority moderation queue" />

      <AdminTable
        columns={['Booking ID', 'Service', 'Status', 'Date', 'Phone']}
        rows={bookingRows}
        title="Latest bookings"
      />
      <AdminTable
        columns={['Module', 'Record count']}
        rows={moduleRows}
        title="Content modules"
      />
    </div>
  );
}
