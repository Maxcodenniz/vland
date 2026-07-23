import Link from 'next/link';

type AdminWorkspaceCardProps = {
  title: string;
  description: string;
  href: string;
  label: string;
};

export function AdminWorkspaceCard({
  title,
  description,
  href,
  label
}: AdminWorkspaceCardProps) {
  return (
    <article className="card content-panel stack admin-workspace-card">
      <span className="badge">{label}</span>
      <h3 style={{ margin: 0, fontSize: '1.35rem' }}>{title}</h3>
      <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>
        {description}
      </p>
      <Link className="button-ghost" href={href}>
        Open workspace
      </Link>
    </article>
  );
}
