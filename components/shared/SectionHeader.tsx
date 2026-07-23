type SectionHeaderProps = {
  label: string;
  title: string;
  description: string;
};

export function SectionHeader({
  label,
  title,
  description
}: SectionHeaderProps) {
  return (
    <div className="section-header">
      <span className="section-label">{label}</span>
      <h2 className="section-title">{title}</h2>
      <p className="section-description">{description}</p>
    </div>
  );
}
