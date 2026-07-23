import { AdminWorkspaceCard } from '@/components/admin/AdminWorkspaceCard';
import { UserRoleManager } from '@/components/admin/UserRoleManager';
import { getAdminUserProfiles, getCurrentAdminRole } from '@/lib/data/live-content';

const userRows = [
  ['Super Admin', 'Platform owner', 'Manage users and permissions'],
  ['Admin', 'Operations staff', 'Content, bookings, media and posts'],
  ['Moderator', 'Community support', 'Comment and post moderation'],
  ['Visitor', 'Authenticated user', 'Bookings, likes, comments and profile']
];

export default async function AdminUsersPage() {
  const [profiles, currentRole] = await Promise.all([
    getAdminUserProfiles(),
    getCurrentAdminRole()
  ]);

  return (
    <div className="stack">
      <h1 style={{ margin: 0 }}>Users and roles</h1>
      <p className="section-description">
        Assign role-based permissions through Supabase Auth profiles and RLS
        checks to protect dashboard and data actions.
      </p>
      <div className="grid columns-3">
        <AdminWorkspaceCard
          description="Give content, bookings and publishing access to trusted operational staff."
          href="/admin/content"
          label="Admin"
          title="Administrator access"
        />
        <AdminWorkspaceCard
          description="Provide a focused moderation workflow for comments, posts and community safety."
          href="/admin/moderation"
          label="Moderator"
          title="Moderator access"
        />
        <AdminWorkspaceCard
          description="Review the role model and keep permissions aligned with real staff responsibilities."
          href="/admin/users"
          label="Security"
          title="Permission planning"
        />
      </div>
      <section className="card content-panel stack">
        <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Role model</h2>
          <span className="badge">{currentRole.replace('_', ' ')}</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Typical owner</th>
                <th>Capabilities</th>
              </tr>
            </thead>
            <tbody>
              {userRows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell) => (
                    <td key={`${row[0]}-${cell}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <UserRoleManager canManageRoles={currentRole === 'super_admin'} initialRecords={profiles} />
    </div>
  );
}
