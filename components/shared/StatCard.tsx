type StatCardProps = {
  value: string;
  label: string;
};

export function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="card kpi">
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}
