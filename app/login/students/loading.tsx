export default function Loading() {
  return (
    <div className="role-content" aria-label="Memuat dasbor siswa">
      <div className="skeleton skeleton-line short" />
      <div className="skeleton skeleton-line" />
      <div className="stat-grid">
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
      <div className="panel skeleton-table">
        <div className="skeleton skeleton-line short" />
        <div className="skeleton-row" />
        <div className="skeleton-row" />
        <div className="skeleton-row" />
      </div>
    </div>
  );
}
