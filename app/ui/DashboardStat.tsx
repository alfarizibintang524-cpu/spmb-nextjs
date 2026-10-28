import CountUp from "./CountUp";

const icons = [
  <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 8v6m3-3h-6" /></>,
  <><path d="M4 19V5m0 14h16" /><path d="m7 15 4-4 3 2 5-6" /></>,
  <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 12h8m-8 4h5" /></>,
  <><path d="m12 3 2.6 5.3 5.9.9-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.9L12 3Z" /></>,
  <><path d="M4 19h16M6 16V9m6 7V5m6 11v-4" /></>,
];

export default function DashboardStat({
  label,
  value,
  icon = 0,
  prefix,
}: {
  label: string;
  value: number | string;
  icon?: number;
  prefix?: string;
}) {
  const numeric = typeof value === "number" && Number.isFinite(value);
  return (
    <div className="panel stat-card">
      <div className="stat-card-inner">
        <div className="stat-copy">
          <span>{label}</span>
          <strong>{numeric ? <CountUp value={value} prefix={prefix} /> : value}</strong>
        </div>
        <span className="stat-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {icons[icon % icons.length]}
          </svg>
        </span>
      </div>
    </div>
  );
}
